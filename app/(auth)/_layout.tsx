import { Stack } from 'expo-router';
import { Colors } from '../../src/theme';

/**
 * Layout du flux auth (onboarding + connexion)
 * Pas de header natif — chaque écran gère son propre chrome.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="pacte" options={{ gestureEnabled: false }} />
      <Stack.Screen name="quiz" />
      <Stack.Screen
        name="diagnostic-transition"
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="resultats"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
