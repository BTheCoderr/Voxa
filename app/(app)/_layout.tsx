import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="text-practice/[scenarioId]"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="conversation/[scenarioId]"
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#F4F7FF',
        }}
      />
      <Stack.Screen
        name="debug-health"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#F4F7FF',
        }}
      />
      <Stack.Screen
        name="lesson-map"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="lesson/[lessonId]"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="immersive-practice/[lessonId]"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
