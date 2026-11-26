import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Linking, Image,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sparkles, Check } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { startAppCheckout } from '../../services/appCheckout';
import {
  CheckoutReturn, markCheckoutStarted, markCheckoutEnded, parseCheckoutUrl,
  claimCheckoutReturn, presentCheckoutReturn,
} from '../../services/checkoutReturn';

const GENERIC_CHECKOUT_ERROR = "Impossible de démarrer l'essai pour le moment. Réessaie dans un instant.";

/**
 * SCREEN — PaywallScreen (src/screens/paywall/PaywallScreen.tsx)
 * Structure inspirée de Moonly : hero plein écran, grille de bénéfices,
 * bandeau de preuve sociale, carrousel de témoignages avec photos, CTA collant.
 *
 * CTA principal : démarre l'essai gratuit directement dans l'app (checkout
 * Stripe ouvert dans un navigateur intégré, retour via deep link). Aucun
 * achat in-app natif — reste un paiement web classique, juste rapatrié
 * dans l'app pour l'expérience utilisateur.
 *
 * Deux parcours annexes conservés :
 *   1. Déjà acheté sur le site → relier le compte via POST /api/link-account
 *      (jeton Supabase : le serveur cherche l'achat avec l'email confirmé du compte)
 *   2. Préférence pour le site → lien secondaire discret
 *
 * Photos requises dans assets/testimonials/ : nicolas.jpg, yannick.jpg, florent.jpg
 */

const WEBSITE_URL = 'https://pilierconscient.com/le-code-masculin-redeviens-lhomme-que-tu-sais-etre/';

const FEATURES = [
  'Coaching IA illimité',
  '12 Piliers complets',
  '52 semaines de programme',
  'Communauté des Hommes',
  'Journal stoïcien',
  'Tracker de progression',
  'Défis hebdomadaires',
  'Bibliothèque de ressources',
];

const STATS = [
  { value: '65 200', label: 'HOMMES\nENGAGÉS' },
  { value: '590', label: 'AVIS' },
  { value: '12', label: 'PILIERS' },
];

const TESTIMONIALS = [
  {
    name: 'Nicolas M.R.',
    location: 'France',
    quote: "Le Code Masculin m'a donné une structure claire là où j'improvisais depuis des années.",
    photo: require('../../../assets/testimonials/nicolas.jpg'),
  },
  {
    name: 'Yannick A.F.',
    location: 'Belgique',
    quote: "Ce qui change tout, c'est le suivi quotidien. Je ne me contente plus de savoir — je fais.",
    photo: require('../../../assets/testimonials/yannick.jpg'),
  },
  {
    name: 'Florent Dessaint',
    location: 'Québec',
    quote: "Un programme direct, sans discours creux. Chaque pilier m'a forcé à regarder ce que j'évitais.",
    photo: require('../../../assets/testimonials/florent.jpg'),
  },
];

type ViewMode = 'main' | 'link';
type PlanId = 'monthly' | 'annual';

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ViewMode>('main');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [isChecking, setIsChecking] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const authUser = useAuthStore((s) => s.user);

  const handleOpenWebsite = () => {
    Linking.openURL(WEBSITE_URL);
  };

  const goToLogin = () => router.replace('/(auth)/login');

  const handleStartTrial = async () => {
    if (isStartingTrial) return;

    setIsStartingTrial(true);
    try {
      const redirectUrl = ExpoLinking.createURL('checkout-return');

      const checkout = await startAppCheckout(
        { plan: selectedPlan, prenom: authUser?.prenom ?? '', redirectUrl },
        { getSession: () => supabase.auth.getSession() }
      );

      if (checkout.kind === 'no_session' || checkout.kind === 'unauthorized') {
        Alert.alert('Session expirée', 'Session expirée, reconnecte-toi.', [
          { text: 'Se reconnecter', onPress: goToLogin },
        ]);
        return;
      }
      if (checkout.kind === 'bad_request') {
        Alert.alert('Erreur', checkout.message ?? GENERIC_CHECKOUT_ERROR);
        return;
      }
      if (checkout.kind !== 'ok') {
        Alert.alert('Erreur', GENERIC_CHECKOUT_ERROR);
        return;
      }

      // La session intercepte le retour ; sur Android, Expo Router reçoit aussi
      // le lien et ouvre app/checkout-return.tsx, qui se retire et nous laisse
      // l'alerte (voir src/services/checkoutReturn.ts).
      markCheckoutStarted();
      let result: WebBrowser.WebBrowserAuthSessionResult;
      let fromRoute: CheckoutReturn | null = null;
      try {
        result = await WebBrowser.openAuthSessionAsync(checkout.url, redirectUrl);
      } finally {
        fromRoute = markCheckoutEnded();
      }

      // Retour transmis par la session, sinon celui reçu par la route
      // (navigateur fermé avant que la session ne voie le lien).
      const ret = result.type === 'success' ? parseCheckoutUrl(result.url) : fromRoute;
      if (!ret || !claimCheckoutReturn(ret)) return; // fermé sans retour, ou déjà traité

      // On n'accorde rien localement : on relit l'état côté serveur.
      const { user, checkEntitlement } = useAuthStore.getState();
      const outcome = await presentCheckoutReturn(ret, {
        userId: user?.id,
        checkEntitlement,
        isActive: () => useAuthStore.getState().entitlement.active,
        alert: (title, message, onClose) =>
          Alert.alert(title, message, [{ text: 'Continuer', onPress: onClose }], { cancelable: false }),
      });
      // Succès : on quitte le paywall. Annulation : on y reste pour réessayer.
      if (outcome === 'activated' || outcome === 'pending') router.back();
    } catch (err) {
      Alert.alert('Erreur de connexion', 'Vérifie ta connexion et réessaie.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleCheckEntitlement = async () => {
    setIsChecking(true);
    try {
      const result = await useAuthStore.getState().linkPurchaseAccount();
      const forEmail = 'email' in result && result.email ? ` pour ${result.email}` : '';

      switch (result.kind) {
        case 'linked':
          Alert.alert('Compte relié', 'Ton abonnement est maintenant actif.', [
            { text: 'Continuer', onPress: () => router.back() },
          ]);
          break;
        case 'no_customer':
          Alert.alert(
            'Aucun achat trouvé',
            `Aucun achat n'est associé à ton compte${forEmail}. Si tu as payé avec une autre adresse email, contacte le support depuis la page d'activation du site.`
          );
          break;
        case 'no_active_subscription':
          Alert.alert(
            'Abonnement inactif',
            `Un achat existe${forEmail}, mais aucun abonnement actif n'y est associé.`
          );
          break;
        case 'email_not_confirmed':
          Alert.alert('Email non confirmé', "Confirme d'abord l'adresse email de ton compte, puis réessaie.");
          break;
        case 'no_session':
        case 'unauthorized':
          Alert.alert('Session expirée', 'Session expirée, reconnecte-toi.', [
            { text: 'Se reconnecter', onPress: goToLogin },
          ]);
          break;
        default:
          Alert.alert('Erreur de vérification', 'Vérifie ta connexion et réessaie dans un instant.');
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeScreen edges={['top']} backgroundColor={Colors.brand.navy}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

        {/* HERO */}
        <View style={styles.hero}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <X size={22} color={Colors.text.inverse} />
          </TouchableOpacity>

          <View style={styles.heroIconWrap}>
            <Sparkles size={40} color={Colors.brand.gold} />
          </View>

          <View style={styles.logoRow}>
            <Text style={styles.logoTxt}>Le Code Masculin</Text>
            <View style={styles.plusBadge}>
              <Text style={styles.plusBadgeTxt}>PREMIUM</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Ta transformation{'\n'}continue</Text>
          <Text style={styles.heroSubtitle}>
            Coaching illimité, les 12 piliers débloqués, et le suivi qui fait tenir tes engagements.
          </Text>
        </View>

        {mode === 'main' && (
          <>
            {/* PRICING — sélectionnable, détermine le plan de l'essai */}
            <View style={styles.pricingSection}>
              <TouchableOpacity
                style={[styles.priceCard, selectedPlan === 'monthly' && styles.priceCardSelected]}
                onPress={() => setSelectedPlan('monthly')}
                activeOpacity={0.85}
              >
                {selectedPlan === 'monthly' && (
                  <View style={styles.selectedCheck}>
                    <Check size={12} color={Colors.brand.navy} strokeWidth={3} />
                  </View>
                )}
                <Text style={styles.priceLabel}>MENSUEL</Text>
                <Text style={styles.priceValue}>29 €<Text style={styles.pricePeriod}>/mois</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.priceCard, styles.priceCardHighlight, selectedPlan === 'annual' && styles.priceCardSelected]}
                onPress={() => setSelectedPlan('annual')}
                activeOpacity={0.85}
              >
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeTxt}>MEILLEURE VALEUR</Text>
                </View>
                {selectedPlan === 'annual' && (
                  <View style={styles.selectedCheck}>
                    <Check size={12} color={Colors.brand.navy} strokeWidth={3} />
                  </View>
                )}
                <Text style={styles.priceLabel}>ANNUEL</Text>
                <Text style={styles.priceValue}>297 €<Text style={styles.pricePeriod}>/an</Text></Text>
              </TouchableOpacity>
            </View>

            {/* FEATURES */}
            <View style={styles.featuresBox}>
              <Text style={styles.sectionTitle}>Ce qui est inclus</Text>
              <View style={styles.featuresGrid}>
                {FEATURES.map((f, i) => (
                  <View key={i} style={styles.featurePill}>
                    <Text style={styles.featurePillTxt}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* STATS */}
            <View style={styles.statsRow}>
              {STATS.map((s, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* TESTIMONIALS */}
            <View style={styles.testimonialsBox}>
              <Text style={styles.sectionTitle}>Ils ont fait le pas</Text>
              {TESTIMONIALS.map((t, i) => (
                <View key={i} style={styles.testimonialCard}>
                  <Text style={styles.testimonialQuote}>"{t.quote}"</Text>
                  <View style={styles.testimonialFooter}>
                    <Image source={t.photo} style={styles.testimonialPhoto} />
                    <View>
                      <Text style={styles.testimonialAuthor}>{t.name}</Text>
                      <Text style={styles.testimonialLocation}>{t.location}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={() => setMode('link')} style={styles.linkBtn}>
              <Text style={styles.linkTxt}>J'ai déjà un compte, relier mon abonnement</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenWebsite} style={styles.linkBtn}>
              <Text style={styles.linkTxtMuted}>Ou continuer sur le site</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'link' && (
          <View style={styles.linkArea}>
            <Text style={styles.linkTitle}>Relier ton abonnement</Text>
            <Text style={styles.linkSubtitle}>
              {authUser?.email
                ? `On cherche ton achat sur le site avec l'adresse de ton compte : ${authUser.email}.`
                : "On cherche ton achat sur le site avec l'adresse email de ton compte."}
            </Text>

            <TouchableOpacity
              style={[styles.ctaBtnInline, isChecking && styles.ctaBtnDisabled]}
              onPress={handleCheckEntitlement}
              disabled={isChecking}
              activeOpacity={0.85}
            >
              {isChecking ? (
                <ActivityIndicator color={Colors.text.inverse} />
              ) : (
                <Text style={styles.ctaTxt}>Vérifier mon abonnement</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode('main')} style={styles.linkBtn}>
              <Text style={styles.linkTxt}>← Retour</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* CTA COLLANT EN BAS */}
      {mode === 'main' && (
        <View style={[styles.stickyFooter, { paddingBottom: Spacing.xl + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.ctaBtn, isStartingTrial && styles.ctaBtnDisabled]}
            onPress={handleStartTrial}
            activeOpacity={0.9}
            disabled={isStartingTrial}
          >
            {isStartingTrial ? (
              <ActivityIndicator color={Colors.text.inverse} />
            ) : (
              <Text style={styles.ctaTxt}>Démarrer mon essai gratuit →</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.ctaNote}>Carte requise · Aucun débit avant la fin de l'essai</Text>
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  hero: {
    backgroundColor: Colors.brand.navy,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  closeBtn: { alignSelf: 'flex-start', padding: Spacing.sm, marginBottom: Spacing.lg },
  heroIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(200, 150, 60, 0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  logoTxt: { ...Typography.label, color: Colors.text.inverse },
  plusBadge: { backgroundColor: Colors.brand.gold, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  plusBadgeTxt: { fontSize: 10, fontWeight: '700', color: Colors.brand.navy, letterSpacing: 0.5 },
  heroTitle: {
    ...Typography.h1,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  heroSubtitle: { ...Typography.body, color: 'rgba(245, 240, 232, 0.8)', lineHeight: 22 },

  pricingSection: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  priceCard: {
    flex: 1, backgroundColor: Colors.background.secondary, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.lg,
  },
  priceCardHighlight: { borderColor: Colors.brand.gold, borderWidth: 2 },
  priceCardSelected: { borderColor: Colors.brand.gold, borderWidth: 2, backgroundColor: Colors.background.tertiary },
  selectedCheck: {
    position: 'absolute', top: Spacing.sm, right: Spacing.sm,
    width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.brand.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  priceBadge: { position: 'absolute', top: -10, left: Spacing.md, backgroundColor: Colors.brand.gold, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  priceBadgeTxt: { fontSize: 9, fontWeight: '700', color: Colors.brand.navy },
  priceLabel: { ...Typography.caption, color: Colors.text.muted, marginBottom: Spacing.xs },
  priceValue: { ...Typography.h3, color: Colors.text.primary },
  pricePeriod: { ...Typography.bodySmall, color: Colors.text.secondary },

  sectionTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.md },
  featuresBox: { paddingHorizontal: Spacing.xl, marginTop: Spacing['2xl'] },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  featurePill: { backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  featurePillTxt: { ...Typography.bodySmall, color: Colors.text.secondary },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.background.secondary, marginHorizontal: Spacing.xl, marginTop: Spacing['2xl'], borderRadius: Radius.lg, paddingVertical: Spacing.lg, borderWidth: 1, borderColor: Colors.border.default },
  statItem: { alignItems: 'center' },
  statValue: { ...Typography.h3, color: Colors.brand.gold },
  statLabel: { ...Typography.caption, color: Colors.text.muted, textAlign: 'center', marginTop: 4, lineHeight: 14 },

  testimonialsBox: { paddingHorizontal: Spacing.xl, marginTop: Spacing['2xl'] },
  testimonialCard: { backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.lg, marginBottom: Spacing.sm },
  testimonialQuote: { ...Typography.body, color: Colors.text.primary, fontStyle: 'italic', marginBottom: Spacing.md, lineHeight: 22 },
  testimonialFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  testimonialPhoto: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.brand.gold },
  testimonialAuthor: { ...Typography.bodySmall, color: Colors.text.primary, fontWeight: '600' },
  testimonialLocation: { ...Typography.caption, color: Colors.text.muted },

  linkBtn: { paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  linkTxt: { ...Typography.bodySmall, color: Colors.text.muted, textDecorationLine: 'underline' },
  linkTxtMuted: { ...Typography.caption, color: Colors.text.muted },

  linkArea: { paddingHorizontal: Spacing.xl, marginTop: Spacing['2xl'] },
  linkTitle: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing.xs },
  linkSubtitle: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing.lg, lineHeight: 22 },
  input: {
    backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border.default, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base,
    color: Colors.text.primary, ...Typography.body, marginBottom: Spacing.lg,
  },
  ctaBtnInline: { backgroundColor: Colors.brand.gold, borderRadius: Radius.lg, paddingVertical: Spacing.base + 2, alignItems: 'center', ...Shadow.gold },
  ctaBtnDisabled: { opacity: 0.6 },

  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.background.primary, borderTopWidth: 1, borderTopColor: Colors.border.subtle,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xl,
  },
  ctaBtn: { backgroundColor: Colors.brand.gold, borderRadius: Radius.lg, paddingVertical: Spacing.base + 2, alignItems: 'center', ...Shadow.gold },
  ctaTxt: { ...Typography.button, color: Colors.text.inverse },
  ctaNote: { ...Typography.caption, color: Colors.text.muted, textAlign: 'center', marginTop: Spacing.sm },
});
