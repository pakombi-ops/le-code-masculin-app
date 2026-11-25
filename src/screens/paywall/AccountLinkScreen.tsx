import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import TestimonialsSection from '../../components/TestimonialsSection';
import { supabase } from '../../supabase'; // ⚠️ ajuste le chemin selon ton arborescence réelle

/**
 * SCREEN — AccountLinkScreen
 * Remplace l'ancien PaywallScreen (RevenueCat, jamais branché).
 * Modèle réel : tout achat se fait sur pilierconscient.com.
 * Cet écran gère deux parcours après épuisement des 10 messages gratuits :
 *   1. L'homme a déjà acheté sur le site → relie son compte via POST /api/link-account
 *   2. L'homme n'a pas encore acheté → redirige vers le site
 *
 * Route réelle confirmée dans lcm-backend/routes/entitlements.js :
 *   POST /api/link-account  body: { email, supabaseUserId }
 *   réponse: { linked: true } ou { linked: false, reason: 'no_customer' | 'no_active_subscription' }
 */

const WEBSITE_URL = 'https://pilierconscient.com/programme';
const RAILWAY_BASE = 'https://lcm-backend-production-efd1.up.railway.app';
const LINK_ACCOUNT_URL = `${RAILWAY_BASE}/api/link-account`;

type ViewMode = 'choice' | 'link';

export default function AccountLinkScreen() {
  const [mode, setMode] = useState<ViewMode>('choice');
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleOpenWebsite = () => {
    Linking.openURL(WEBSITE_URL);
  };

  const handleCheckEntitlement = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      Alert.alert('Email invalide', 'Entre l\'adresse email utilisée lors de ton achat.');
      return;
    }

    setIsChecking(true);
    try {
      // Récupère l'utilisateur Supabase actuellement connecté
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('not_authenticated');
      }

      const response = await fetch(LINK_ACCOUNT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, supabaseUserId: user.id }),
      });

      const data = await response.json();

      if (data?.linked === true) {
        Alert.alert('Compte relié ✓', 'Ton abonnement est maintenant actif.', [
          { text: 'Continuer', onPress: () => router.back() },
        ]);
        return;
      }

      // Messages différenciés selon la raison retournée par le backend
      if (data?.reason === 'no_customer') {
        Alert.alert(
          'Aucun achat trouvé',
          'Cette adresse email ne correspond à aucun achat sur le site. Vérifie l\'orthographe ou utilise l\'email exact utilisé au moment du paiement.'
        );
      } else if (data?.reason === 'no_active_subscription') {
        Alert.alert(
          'Abonnement inactif',
          'Un compte existe avec cette adresse, mais aucun abonnement actif n\'y est associé. Contacte le support si tu penses qu\'il y a une erreur.'
        );
      } else {
        Alert.alert(
          'Erreur de vérification',
          'Impossible de vérifier ton abonnement pour le moment. Réessaie dans un instant.'
        );
      }
    } catch (err) {
      Alert.alert(
        'Erreur',
        'Impossible de vérifier ton abonnement. Vérifie ta connexion et réessaie.'
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeTxt}>←</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Tu as utilisé tes 10 messages offerts</Text>
          <Text style={styles.subtitle}>
            La transformation continue avec le programme complet.
          </Text>
        </View>

        {mode === 'choice' && (
          <>
            <View style={styles.benefits}>
              <Text style={styles.benefitTxt}>💬  Coaching illimité avec Prince Johann IA</Text>
              <Text style={styles.benefitTxt}>📚  Les 12 piliers et 52 semaines débloqués</Text>
              <Text style={styles.benefitTxt}>🔥  Suivi de progression et communauté</Text>
            </View>

            <View style={styles.ctaArea}>
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={handleOpenWebsite}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaTxt}>Découvrir le programme →</Text>
              </TouchableOpacity>
              <Text style={styles.ctaNote}>Ouvre pilierconscient.com</Text>

              <TouchableOpacity onPress={() => setMode('link')} style={styles.linkBtn}>
                <Text style={styles.linkTxt}>J'ai déjà un compte, relier mon abonnement</Text>
              </TouchableOpacity>
            </View>

            <TestimonialsSection />
          </>
        )}

        {mode === 'link' && (
          <View style={styles.linkArea}>
            <Text style={styles.linkTitle}>Relier ton abonnement</Text>
            <Text style={styles.linkSubtitle}>
              Entre l'adresse email utilisée lors de ton achat sur le site.
            </Text>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ton@email.com"
              placeholderTextColor={Colors.text.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isChecking}
            />

            <TouchableOpacity
              style={[styles.ctaBtn, isChecking && styles.ctaBtnDisabled]}
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

            <TouchableOpacity onPress={() => setMode('choice')} style={styles.linkBtn}>
              <Text style={styles.linkTxt}>← Retour</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.legal}>
          Besoin d'aide ? Contacte le support depuis la page d'activation du site.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  closeBtn: { position: 'absolute', top: 56, left: Spacing.xl, zIndex: 10, padding: Spacing.sm },
  closeTxt: { fontSize: 24, color: Colors.brand.gold },
  header: { alignItems: 'center', paddingTop: 100, paddingHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
  title: { ...Typography.h2, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', lineHeight: 24 },
  benefits: { paddingHorizontal: Spacing.xl, marginBottom: Spacing['2xl'], gap: Spacing.sm },
  benefitTxt: { ...Typography.body, color: Colors.text.primary, lineHeight: 28 },
  ctaArea: { paddingHorizontal: Spacing.xl, alignItems: 'center' },
  ctaBtn: { backgroundColor: Colors.brand.gold, borderRadius: Radius.lg, paddingVertical: Spacing.base + 2, alignItems: 'center', width: '100%', marginBottom: Spacing.sm, ...Shadow.gold },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaTxt: { ...Typography.button, color: Colors.text.inverse },
  ctaNote: { ...Typography.caption, color: Colors.text.muted, textAlign: 'center', marginBottom: Spacing.base },
  linkBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
  linkTxt: { ...Typography.bodySmall, color: Colors.text.muted, textDecorationLine: 'underline' },
  linkArea: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  linkTitle: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing.xs },
  linkSubtitle: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing.lg, lineHeight: 22 },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    color: Colors.text.primary,
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  legal: { ...Typography.caption, color: Colors.text.muted, textAlign: 'center', paddingHorizontal: Spacing.xl, marginTop: Spacing.xl, lineHeight: 18 },
});
