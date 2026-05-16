export type RealtimeSessionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

/** Normalized response from `realtime-session` Edge Function (and client parse target). */
export type RealtimeSessionMintResponse = {
  clientSecret: string;
  expiresAt: number;
  sessionId: string;
  model: string;
};

export class RealtimeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RealtimeConfigurationError';
  }
}
