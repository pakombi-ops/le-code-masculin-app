import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';

/**
 * ROUTE — lecodemasculin://billing-return
 *
 * Retour du Stripe Customer Portal. Comme checkout-return : sur Android, Expo
 * Router reçoit le lien en plus de WebBrowser.openAuthSessionAsync. La route
 * relit l'accès côté serveur (rien n'est accordé ni retiré localement) puis se retire.
 */
export default function BillingReturnRoute() {
  const userId = useAuthStore((s) => s.user?.id);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const { checkEntitlement, refreshQuota } = useAuthStore.getState();
    const refresh = userId
      ? Promise.allSettled([checkEntitlement(userId), refreshQuota(userId)])
      : Promise.resolve();
    refresh.finally(() => {
      if (!userId) return; // le layout redirige vers la connexion
      if (router.canGoBack()) router.back();
      else router.dismissTo('/(tabs)/profil');
    });
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ animation: 'none', gestureEnabled: false }} />
      <ActivityIndicator color={Colors.brand.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.primary },
});
