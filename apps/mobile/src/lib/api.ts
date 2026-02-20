import { getStoredToken } from "./auth";

/**
 * Error thrown by the API client with typed response information.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: Record<string, string> | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Get the base URL for API requests.
 * Reads from EXPO_PUBLIC_API_BASE_URL environment variable.
 */
export function getBaseUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL environment variable is not set");
  }
  return baseUrl.replace(/\/+$/, "");
}

/**
 * Build headers for an API request, including JWT authorization.
 */
async function buildHeaders(
  customHeaders?: Record<string, string>,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const token = await getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Parse a response body as JSON, handling error responses.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: Record<string, string> | null = null;
    try {
      body = await response.json() as Record<string, string>;
    } catch {
      // Response body is not JSON
    }
    const message = body?.error ?? body?.message ?? `API error: ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Centralized API client for making authenticated requests to the Cawpile backend.
 * All requests include JWT authorization and JSON content type headers.
 */
export const api = {
  async get<T>(path: string): Promise<T> {
    const baseUrl = getBaseUrl();
    const headers = await buildHeaders();
    const response = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers,
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const baseUrl = getBaseUrl();
    const headers = await buildHeaders();
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const baseUrl = getBaseUrl();
    const headers = await buildHeaders();
    const response = await fetch(`${baseUrl}${path}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete(path: string): Promise<void> {
    const baseUrl = getBaseUrl();
    const headers = await buildHeaders();
    const response = await fetch(`${baseUrl}${path}`, {
      method: "DELETE",
      headers,
    });
    return handleResponse<void>(response);
  },
};
