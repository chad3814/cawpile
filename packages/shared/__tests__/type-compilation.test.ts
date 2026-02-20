import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('Type compilation', () => {
  it('all exported types compile without errors via tsc --noEmit', () => {
    const sharedRoot = path.resolve(__dirname, '..');

    // Run tsc --noEmit on the shared package source
    // This ensures all type definitions are valid and consistent
    const result = execSync('npx tsc --noEmit', {
      cwd: sharedRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // If tsc succeeds, it returns empty string (no errors)
    expect(result.trim()).toBe('');
  });
});
