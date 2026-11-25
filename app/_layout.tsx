import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/theme';
import { supabase, getSession, savePacteEntry, saveDiagnosticResults, recomputePillarPriority } from '../src/services/supabase';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';

SplashScreen.preventAutoHideAsync();

// Écrans du groupe (auth) accessibles à un utilisateur déjà authentifié —
// nécessaire pour le scénario "paiement site" : le compte existe et est
// connecté avant que le pacte/diagnostic n'ait jamais été rempli, contrairement
// au scénario d'inscription in-app où ces écrans se remplissent AVANT
// l'authentification (voir le bloc onAuthStateChange plus bas).
const ONBOARDING_SCREENS_ALLOWED_WHEN_AUTHENTICATED = [
  'pacte',
  'quiz',
  'diagnostic-transition',
  'resultats',
];

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

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        useAuthStore.getState().setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          prenom: session.user.user_metadata?.prenom ?? '',
        });
        useAuthStore.getState().loadUser(session.user.id);

        const { pacteText, quizScores, reset } = useOnboardingStore.getState();
        if (pacteText || quizScores) {
          try {
            await Promise.all([
              savePacteEntry(session.user.id, pacteText),
              quizScores ? saveDiagnosticResults(session.user.id, quizScores) : Promise.resolve(),
            ]);
            if (quizScores) {
              await recomputePillarPriority(session.user.id);
            }
            reset();
          } catch (err) {
            console.error('Erreur sauvegarde onboarding différée :', err);
          }
        }
      }

      // isAuthenticated ne bascule qu'une fois la sauvegarde pacte/diagnostic
      // terminée (si applicable) — sinon la redirection vers (tabs)/accueil
      // se déclenche avant que les données existent, et la DailyCard charge
      // dans le vide.
      setIsAuthenticated(!!session);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentAuthScreen = segments[1];
    const isAllowedOnboardingScreen =
      inAuthGroup && ONBOARDING_SCREENS_ALLOWED_WHEN_AUTHENTICATED.includes(currentAuthScreen ?? '');

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && !isAllowedOnboardingScreen) {
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
