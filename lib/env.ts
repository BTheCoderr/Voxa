const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

function edgeFunctionUrl(slug: string, override?: string): string {
  const explicit = override?.trim();
  if (explicit) return explicit;
  if (!SUPABASE_URL) return '';
  return `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/${slug}`;
}

const REALTIME_SESSION_URL = edgeFunctionUrl(
  'realtime-session',
  process.env.EXPO_PUBLIC_REALTIME_SESSION_URL,
);
const AI_CHAT_COACH_URL = edgeFunctionUrl(
  'ai-chat-coach',
  process.env.EXPO_PUBLIC_AI_CHAT_COACH_URL,
);
const ELEVENLABS_TTS_URL = edgeFunctionUrl(
  'elevenlabs-tts',
  process.env.EXPO_PUBLIC_ELEVENLABS_TTS_URL,
);
const AI_MODE_RAW = process.env.EXPO_PUBLIC_AI_MODE ?? 'text';

export type AiMode = 'text' | 'voice';

function parseAiMode(raw: string): AiMode {
  return raw.trim().toLowerCase() === 'voice' ? 'voice' : 'text';
}

export const env = {
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
  supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  /** `text` = Groq/Gemini via Edge Function. `voice` = OpenAI Realtime. */
  aiMode: parseAiMode(AI_MODE_RAW),
  aiChatCoachUrl: AI_CHAT_COACH_URL,
  aiChatCoachConfigured: Boolean(AI_CHAT_COACH_URL),
  elevenLabsTtsUrl: ELEVENLABS_TTS_URL,
  elevenLabsTtsConfigured: Boolean(ELEVENLABS_TTS_URL),
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  revenueCatIos: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? '',
  revenueCatAndroid: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? '',
  realtimeSessionUrl: REALTIME_SESSION_URL,
  realtimeSessionConfigured: Boolean(REALTIME_SESSION_URL),
  /** `1` = richer empty states for marketing screenshots (no fake sessions). */
  screenshotMode: process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1',
};
