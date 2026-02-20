import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "@cawpile/offline-queue";

/**
 * Represents an action queued for offline processing.
 */
export interface QueuedAction {
  id: string;
  type: string;
  method: string;
  url: string;
  body: Record<string, unknown>;
  resourceId: string;
  timestamp: number;
}

/**
 * Input for enqueuing a new action.
 */
export interface EnqueueInput {
  type: string;
  method: string;
  url: string;
  body: Record<string, unknown>;
  resourceId: string;
}

/**
 * Callback type for discard notifications.
 */
type DiscardCallback = (action: QueuedAction, status: number) => void;

/**
 * Generate a UUID v4-like string without external dependencies.
 */
function generateId(): string {
  const hex = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      id += "-";
    } else if (i === 14) {
      id += "4";
    } else if (i === 19) {
      id += hex[Math.floor(Math.random() * 4) + 8];
    } else {
      id += hex[Math.floor(Math.random() * 16)];
    }
  }
  return id;
}

// Discard notification listeners
const discardListeners: Set<DiscardCallback> = new Set();

/**
 * Register a callback to be called when an action is discarded (4xx).
 * Returns an unsubscribe function.
 */
export function onActionDiscarded(callback: DiscardCallback): () => void {
  discardListeners.add(callback);
  return () => {
    discardListeners.delete(callback);
  };
}

/**
 * Notify all listeners about a discarded action.
 */
function notifyDiscarded(action: QueuedAction, status: number): void {
  for (const listener of discardListeners) {
    try {
      listener(action, status);
    } catch {
      // Silently ignore listener errors
    }
  }
}

/**
 * Read the current queue from AsyncStorage.
 */
export async function getQueue(): Promise<QueuedAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as QueuedAction[];
  } catch {
    return [];
  }
}

/**
 * Write the queue to AsyncStorage.
 */
async function saveQueue(queue: QueuedAction[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Enqueue an action for offline processing.
 * Deduplicates by action type + resource ID: only keeps the latest action
 * for a given type+resourceId combination.
 */
export async function enqueue(input: EnqueueInput): Promise<QueuedAction> {
  const queue = await getQueue();

  const action: QueuedAction = {
    id: generateId(),
    type: input.type,
    method: input.method,
    url: input.url,
    body: input.body,
    resourceId: input.resourceId,
    timestamp: Date.now(),
  };

  // Deduplicate: remove existing actions with same type + resourceId
  const deduped = queue.filter(
    (existing) =>
      !(existing.type === action.type && existing.resourceId === action.resourceId),
  );

  deduped.push(action);
  await saveQueue(deduped);

  return action;
}

/**
 * Remove a specific action from the queue by ID.
 */
async function removeAction(actionId: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((a) => a.id !== actionId);
  await saveQueue(filtered);
}

/**
 * Process all queued actions in FIFO order.
 * - On success (2xx): removes the action from the queue.
 * - On client error (4xx): discards the action and notifies listeners.
 * - On server error (5xx): keeps the action in the queue for later retry.
 *
 * Returns the number of actions processed successfully.
 */
export async function processQueue(): Promise<number> {
  const queue = await getQueue();
  if (queue.length === 0) {
    return 0;
  }

  let processed = 0;
  const remaining: QueuedAction[] = [];

  // Determine the base URL for API calls
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";

  for (const action of queue) {
    try {
      const fullUrl = `${baseUrl}${action.url}`;
      const response = await fetch(fullUrl, {
        method: action.method,
        headers: { "Content-Type": "application/json" },
        body: action.method !== "GET" ? JSON.stringify(action.body) : undefined,
      });

      if (response.ok) {
        // Success: action processed, do not keep in queue
        processed++;
      } else if (response.status >= 400 && response.status < 500) {
        // Client error: discard the action (not retryable)
        notifyDiscarded(action, response.status);
      } else {
        // Server error: keep in queue for retry later
        remaining.push(action);
      }
    } catch {
      // Network error or other failure: keep in queue for retry
      remaining.push(action);
    }
  }

  await saveQueue(remaining);
  return processed;
}

/**
 * Clear all queued actions.
 */
export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

/**
 * Get the count of queued actions.
 */
export async function getQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
