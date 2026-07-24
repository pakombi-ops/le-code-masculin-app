import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';

/**
 * SCREEN — Paywall
 * Mode démo tant que RevenueCat n'est pas configuré.
 * Remplace les DEMO_PLANS par getOfferings() une fois RevenueCat prêt.
 */

const DEMO_PLANS = [
  { id: 'annual', label: 'PLAN ANNUEL', price: '99 €', period: '/an', monthly: '8,25 €/mois', popular: true },
  { id: 'monthly', label: 'PLAN MENSUEL', price: '14,90 €', period: '/mois', monthly: null, popular: false },
];

const BENEFITS = [
  '💬  Coaching illimité avec Prince Johann IA',
  '📚  Les 12 piliers et 52 semaines débloqués',
  '📥  Téléchargements hors-ligne inclus',
  '🔥  Suivi de progression et streak',
];

export default function PaywallScreen() {
  const [selected, setSelected] = useState('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = () => {
    Alert.alert(
      '🔜 Paiements bientôt disponibles',
      'Configure ton compte RevenueCat et Google Play Console pour activer les paiements réels.',
      [{ text: 'OK' }]
    );
  };

  const handleRestore = () => {
    Alert.alert('Restaurer', 'Fonctionnalité disponible après configuration RevenueCat.');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeTxt}>←</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>Continue avec Prince Johann</Text>
          <Text style={styles.subtitle}>
            Tu as utilisé tes 10 messages offerts.{'\n'}
            La transformation continue à chaque conversation.
          </Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.benefitTxt}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {DEMO_PLANS.map(plan => (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, selected === plan.id && styles.planCardSelected]}
              onPress={() => setSelected(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularTxt}>⭐ POPULAIRE</Text>
                </View>
              )}
              <Text style={styles.planLabel}>{plan.label}</Text>
              <Text style={styles.planPrice}>
                {plan.price}<Text style={styles.planPeriod}>{plan.period}</Text>
              </Text>
              {plan.monthly && (
                <Text style={styles.planMonthly}>≈ {plan.monthly}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.ctaArea}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handlePurchase}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaTxt}>Essayer 7 jours GRATUIT →</Text>
          </TouchableOpacity>
          <Text style={styles.ctaNote}>Puis facturation automatique · Annulable à tout moment</Text>
          <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
            <Text style={styles.restoreTxt}>Restaurer mes achats</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testimonial}>
          <Text style={styles.testimonialTxt}>
            "En 3 semaines avec Prince Johann IA, j'ai enfin tenu mes engagements."
          </Text>
          <Text style={styles.testimonialAuthor}>— Thomas, 32 ans, Lyon</Text>
        </View>

        <Text style={styles.legal}>
          En continuant, tu acceptes nos Conditions d'utilisation.
          L'abonnement se renouvelle automatiquement sauf annulation 24h avant la fin de la période.
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
  crown: { fontSize: 48, marginBottom: Spacing.lg },
  title: { ...Typography.h2, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', lineHeight: 24 },
  benefits: { paddingHorizontal: Spacing.xl, marginBottom: Spacing['2xl'], gap: Spacing.sm },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  benefitTxt: { ...Typography.body, color: Colors.text.primary, lineHeight: 28 },
  plans: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.xl },
  planCard: { backgroundColor: Colors.background.secondary, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.xl, alignItems: 'center', position: 'relative' },
  planCardSelected: { borderColor: Colors.brand.gold, borderWidth: 2, ...Shadow.gold },
  popularBadge: { position: 'absolute', top: -12, backgroundColor: Colors.brand.gold, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 3 },
  popularTxt: { ...Typography.caption, color: Colors.text.inverse, fontWeight: '700' },
  planLabel: { ...Typography.label, color: Colors.text.muted, marginBottom: Spacing.sm },
  planPrice: { ...Typography.number, color: Colors.text.primary },
  planPeriod: { ...Typography.h3, color: Colors.text.secondary },
  planMonthly: { ...Typography.bodySmall, color: Colors.status.success, marginTop: Spacing.xs },
  ctaArea: { paddingHorizontal: Spacing.xl, alignItems: 'center' },
  ctaBtn: { backgroundColor: Colors.brand.gold, borderRadius: Radius.lg, paddingVertical: Spacing.base + 2, alignItems: 'center', width: '100%', marginBottom: Spacing.sm, ...Shadow.gold },
  ctaTxt: { ...Typography.button, color: Colors.text.inverse },
  ctaNote: { ...Typography.caption, color: Colors.text.muted, textAlign: 'center', marginBottom: Spacing.base },
  restoreBtn: { paddingVertical: Spacing.sm },
  restoreTxt: { ...Typography.bodySmall, color: Colors.text.muted, textDecorationLine: 'underline' },
  testimonial: { marginHorizontal: Spacing.xl, marginTop: Spacing.xl, borderLeftWidth: 2, borderLeftColor: Colors.brand.gold, paddingLeft: Spacing.md },
  testimonialTxt: { ...Typography.body, color: Colors.text.secondary, fontStyle: 'italic' },
  testimonialAuthor: { ...Typography.caption, color: Colors.text.muted, marginTop: Spacing.xs },
  legal: { ...Typography.caption, color: Colors.text.muted, textAlign: 'center', paddingHorizontal: Spacing.xl, marginTop: Spacing.xl, lineHeight: 18 },
});
