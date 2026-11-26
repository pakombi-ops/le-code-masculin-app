import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';
import { parseCheckoutParams, handleCheckoutRoute, CheckoutRouteExit } from '../src/services/checkoutReturn';

/**
 * ROUTE — lecodemasculin://checkout-return?status=success|cancelled&session_id=…
 *
 * Filet de sécurité : sur Android, Expo Router reçoit le lien de retour du
 * checkout Stripe en plus de WebBrowser.openAuthSessionAsync. Sans cette
 * route, il affichait « Unmatched route ».
 *
 * Elle n'accorde JAMAIS d'accès : elle relance checkEntitlement (lecture
 * serveur) et n'affiche que ce que le serveur répond. Voir
 * src/services/checkoutReturn.ts pour le partage avec PaywallScreen.
 */
const HOME_HREF = '/(tabs)/accueil';

function leave(exit: CheckoutRouteExit) {
  if (exit === 'none') return; // le layout redirige vers la connexion
  if (exit === 'origin' && router.canGoBack()) {
    // L'écran d'origine est juste dessous : on retire la route (un replace le dupliquerait).
    router.back();
    return;
  }
  // Pas d'écran d'origine (app relancée par le lien) ou succès : accueil.
  // dismissTo revient à l'accueil s'il est dans la pile, sinon remplace la route.
  router.dismissTo(HOME_HREF);
}

export default function CheckoutReturnRoute() {
  const params = useLocalSearchParams<{ status?: string; session_id?: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const ret = parseCheckoutParams(params);
    const { checkEntitlement } = useAuthStore.getState();
    handleCheckoutRoute(ret, {
      userId,
      checkEntitlement,
      isActive: () => useAuthStore.getState().entitlement.active,
      alert: (title, message, onClose) =>
        Alert.alert(title, message, [{ text: 'Continuer', onPress: onClose }], { cancelable: false }),
    })
      .then(leave)
      .catch(() => leave('home'));
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ animation: 'none', gestureEnabled: false }} />
      <ActivityIndicator color={Colors.brand.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
  },
});
