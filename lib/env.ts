const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const REALTIME_SESSION_URL = process.env.EXPO_PUBLIC_REALTIME_SESSION_URL ?? '';

export const env = {
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
  supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  revenueCatIos: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? '',
  revenueCatAndroid: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? '',
  realtimeSessionUrl: REALTIME_SESSION_URL,
  realtimeSessionConfigured: Boolean(REALTIME_SESSION_URL),
  /** `1` = richer empty states for marketing screenshots (no fake sessions). */
  screenshotMode: process.env.EXPO_PUBLIC_SCREENSHOT_MODE === '1',
};
