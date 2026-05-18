import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/db/database.types';
import { env } from '@/lib/env';

/**
 * createClient throws if URL/key are empty. Use inert placeholders for local UI runs without `.env`.
 * All real auth/DB calls should still guard on `env.supabaseConfigured` (or handle errors).
 */
const supabaseUrl = env.supabaseUrl || 'https://offline.voxa.local';
const supabaseAnonKey =
  env.supabaseAnonKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.offline-placeholder-not-a-real-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    /** Native: we handle `voxa://` in `app/auth/callback`. Avoid auto-parsing random URLs. */
    detectSessionInUrl: false,
    /** Hash/token deep links for `voxa://auth/callback`; keep explicit (also default in supabase-js). */
    flowType: 'implicit',
  },
});
