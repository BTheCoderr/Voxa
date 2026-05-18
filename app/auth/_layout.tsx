import { Stack } from 'expo-router';

import { palette } from '@/constants/theme';

export default function AuthDeepLinkLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.void },
        animation: 'fade',
      }}
    />
  );
}
