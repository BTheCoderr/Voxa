export type VoiceSessionPhase =
  | 'idle'
  | 'requesting_permission'
  | 'minting_session'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'ai_speaking'
  | 'error'
  | 'ended';

export type TranscriptMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  partial: boolean;
};

/** Saved to Supabase while streaming (debounced in the screen layer). */
export type TranscriptPersistPayload = {
  clientMessageId: string;
  role: 'user' | 'assistant';
  text: string;
  partial: boolean;
};
