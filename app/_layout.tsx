import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/theme';
import { supabase, getSession } from '../src/services/supabase';
import { useAuthStore } from '../src/store/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const checkSession = async () => {
  try {
    const result = await getSession();
    const hasSession = !!result.session;
    setIsAuthenticated(hasSession);

    if (hasSession && result.session?.user) {
      useAuthStore.getState().setUser({
        id: result.session.user.id,
        email: result.session.user.email ?? '',
        prenom: result.session.user.user_metadata?.prenom ?? '',
      });
      await useAuthStore.getState().loadUser(result.session.user.id);
    } else {
      useAuthStore.getState().setLoading(false);
    }
  } catch (err) {
    console.error('Erreur checkSession:', err);
    setIsAuthenticated(false);
    useAuthStore.getState().setLoading(false);
  } finally {
    setIsReady(true);
  }
};

  useEffect(() => {
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
  setIsAuthenticated(!!session);

  if (session?.user) {
    useAuthStore.getState().setUser({
      id: session.user.id,
      email: session.user.email ?? '',
      prenom: session.user.user_metadata?.prenom ?? '',
    });
    useAuthStore.getState().loadUser(session.user.id);
  }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
  router.replace('/(tabs)/accueil');
    }
  }, [isReady, isAuthenticated, segments]);

  useEffect(() => {
    if (!isReady) return;
    SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

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