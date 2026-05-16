/** Last realtime / voice pipeline error for diagnostics (in-memory). */
let lastRealtimeError: { message: string; at: string } | null = null;

export function recordRealtimeError(message: string): void {
  lastRealtimeError = { message, at: new Date().toISOString() };
}

export function getLastRealtimeError(): { message: string; at: string } | null {
  return lastRealtimeError;
}

export function clearRealtimeError(): void {
  lastRealtimeError = null;
}
