import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={Colors.background.primary} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
