import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GuidedProfile } from '@/lib/learning/types';
import { EMPTY_GUIDED_PROFILE } from '@/lib/learning/types';
import { getOnboardingComplete } from '@/lib/onboarding/storage';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

const LOCAL_KEY = '@voxa/guided-profile/v1';
const LEGACY_MIGRATED_KEY = '@voxa/guided-profile/v1/legacy-migrated';

type StoredProfile = GuidedProfile;

async function readLocal(): Promise<StoredProfile | null> {
  const raw = await AsyncStorage.getItem(LOCAL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}

async function writeLocal(profile: StoredProfile): Promise<void> {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
}

type ProfileRow = {
  display_name: string | null;
  native_language: string | null;
  target_language: string | null;
  interests: string[] | null;
  level: string | null;
  explanation_language: string | null;
  onboarding_completed: boolean;
};

function rowToProfile(row: ProfileRow): GuidedProfile {
  return {
    displayName: row.display_name ?? '',
    nativeLanguage: (row.native_language as GuidedProfile['nativeLanguage']) ?? null,
    targetLanguage: (row.target_language as GuidedProfile['targetLanguage']) ?? null,
    interests: (row.interests ?? []) as GuidedProfile['interests'],
    level: (row.level as GuidedProfile['level']) ?? null,
    explanationLanguage: (row.explanation_language as GuidedProfile['explanationLanguage']) ?? null,
    onboardingCompleted: row.onboarding_completed,
  };
}

function profileToRow(profile: GuidedProfile): {
  display_name: string | null;
  native_language: string | null;
  target_language: string | null;
  interests: string[];
  level: string | null;
  explanation_language: string | null;
  onboarding_completed: boolean;
} {
  return {
    display_name: profile.displayName || null,
    native_language: profile.nativeLanguage,
    target_language: profile.targetLanguage,
    interests: profile.interests,
    level: profile.level,
    explanation_language: profile.explanationLanguage,
    onboarding_completed: profile.onboardingCompleted,
  };
}

/** One-time: skip guided onboarding for users who finished the legacy 3-step flow before this feature. */
export async function migrateLegacyOnboardingIfNeeded(): Promise<void> {
  const migrated = await AsyncStorage.getItem(LEGACY_MIGRATED_KEY);
  if (migrated === 'true') return;

  const local = await readLocal();
  if (local?.onboardingCompleted) {
    await AsyncStorage.setItem(LEGACY_MIGRATED_KEY, 'true');
    return;
  }

  const legacyComplete = await getOnboardingComplete();
  if (legacyComplete) {
    await writeLocal({ ...EMPTY_GUIDED_PROFILE, onboardingCompleted: true });
  }
  await AsyncStorage.setItem(LEGACY_MIGRATED_KEY, 'true');
}

export async function getGuidedProfile(): Promise<GuidedProfile> {
  await migrateLegacyOnboardingIfNeeded();

  const local = await readLocal();
  if (local) return local;

  return { ...EMPTY_GUIDED_PROFILE };
}

export async function isGuidedOnboardingComplete(): Promise<boolean> {
  const profile = await getGuidedProfile();
  return profile.onboardingCompleted;
}

export async function saveGuidedProfile(
  partial: Partial<GuidedProfile>,
  userId?: string | null,
): Promise<GuidedProfile> {
  const current = await getGuidedProfile();
  const next: GuidedProfile = { ...current, ...partial };
  await writeLocal(next);

  if (!env.supabaseConfigured || !userId) {
    return next;
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profileToRow(next) }, { onConflict: 'id' });
    if (error && __DEV__) {
      console.warn('[guidedProfile] supabase upsert failed', error.message);
    }
  } catch {
    // Local copy is source of truth offline; cloud sync is best-effort
  }

  return next;
}

export async function syncGuidedProfileFromRemote(userId: string): Promise<GuidedProfile> {
  if (!env.supabaseConfigured) {
    return getGuidedProfile();
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'display_name, native_language, target_language, interests, level, explanation_language, onboarding_completed',
      )
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return getGuidedProfile();
    }

    const remote = rowToProfile(data as ProfileRow);
    const local = await readLocal();

    if (remote.onboardingCompleted || !local?.onboardingCompleted) {
      await writeLocal(remote.onboardingCompleted ? remote : { ...local, ...remote });
      return remote.onboardingCompleted ? remote : { ...local, ...remote };
    }

    return local ?? remote;
  } catch {
    return getGuidedProfile();
  }
}

export async function completeGuidedOnboarding(
  profile: GuidedProfile,
  userId?: string | null,
): Promise<void> {
  await saveGuidedProfile({ ...profile, onboardingCompleted: true }, userId);
}
