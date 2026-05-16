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
    detectSessionInUrl: false,
  },
});
