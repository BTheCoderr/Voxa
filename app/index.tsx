import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { VoxaSplashScreen } from '@/components/splash/VoxaSplashScreen';
import { useAuth } from '@/lib/auth/AuthContext';
import { isGuidedLessonsEnabled } from '@/lib/lessons/guidedLessonsEnabled';
import { getOnboardingComplete } from '@/lib/onboarding/storage';
import {
  isGuidedOnboardingComplete,
  syncGuidedProfileFromRemote,
} from '@/lib/onboarding/guidedProfile';

const BOOT_SLOW_MS = 8000;

export default function Index() {
  const { initialized, user } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [guidedComplete, setGuidedComplete] = useState<boolean | null>(null);
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlowLoad(true), BOOT_SLOW_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    void (async () => {
      if (user?.id) {
        await syncGuidedProfileFromRemote(user.id);
      }
      const [legacy, guided] = await Promise.all([getOnboardingComplete(), isGuidedOnboardingComplete()]);
      setOnboardingComplete(legacy);
      setGuidedComplete(guided);
    })();
  }, [initialized, user?.id]);

  if (!initialized || onboardingComplete === null || guidedComplete === null) {
    return <VoxaSplashScreen slowLoad={slowLoad} />;
  }

  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (!guidedComplete && isGuidedLessonsEnabled()) {
    return <Redirect href="/(onboarding)/guided" />;
  }

  return <Redirect href="/(app)/(tabs)" />;
}
