/**
 * PAYWALL SCREEN
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme';
import Button from '../../components/ui/Button';
import SafeScreen from '../../components/layout/SafeScreen';
import { useAppStore } from '../../store/useAppStore';

export default function PaywallScreen() {
  const navigation = useNavigation();
  const { closePaywall, updateSubscription } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    // TODO: Intégrer RevenueCat pour les achats in-app
    // const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
    await new Promise((r) => setTimeout(r, 1500));
    updateSubscription(selectedPlan);
    setLoading(false);
    closePaywall();
    navigation.goBack();
  };

  return (
    <SafeScreen edges={['top', 'bottom']} scrollable>
      <View style={paywallStyles.container}>
        {/* Close */}
        <TouchableOpacity style={paywallStyles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={paywallStyles.closeText}>✕</Text>
        </TouchableOpacity>

        {/* Icon */}
        <View style={paywallStyles.iconContainer}>
          <Text style={paywallStyles.icon}>♔</Text>
        </View>

        <Text style={paywallStyles.title}>Continue avec{'\n'}Prince Johann</Text>
        <Text style={paywallStyles.subtitle}>
          Tu as utilisé tes 10 messages offerts. Passe à Premium pour un coaching illimité.
        </Text>

        {/* Benefits */}
        <View style={paywallStyles.benefits}>
          {[
            { icon: '◎', text: 'Accès illimité à Prince Johann IA' },
            { icon: '◫', text: 'Les 12 piliers et 52 semaines débloqués' },
            { icon: '⬡', text: 'Téléchargements hors-ligne inclus' },
            { icon: '✍', text: 'Journal personnel et suivi de progression' },
          ].map((b) => (
            <View key={b.text} style={paywallStyles.benefit}>
              <Text style={paywallStyles.benefitIcon}>{b.icon}</Text>
              <Text style={paywallStyles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Plan toggle */}
        <View style={paywallStyles.plans}>
          {/* Annual */}
          <TouchableOpacity
            style={[paywallStyles.planCard, selectedPlan === 'annual' && paywallStyles.planCardSelected]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={paywallStyles.planTop}>
              <View>
                <Text style={paywallStyles.planName}>Plan Annuel</Text>
                <Text style={paywallStyles.planPrice}>8,25 €<Text style={paywallStyles.planPer}> / mois</Text></Text>
              </View>
              <View style={paywallStyles.popularBadge}>
                <Text style={paywallStyles.popularText}>POPULAIRE</Text>
              </View>
            </View>
            <Text style={paywallStyles.planSub}>99 € facturés annuellement · Économise 80 €</Text>
          </TouchableOpacity>

          {/* Monthly */}
          <TouchableOpacity
            style={[paywallStyles.planCard, selectedPlan === 'monthly' && paywallStyles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text style={paywallStyles.planName}>Plan Mensuel</Text>
            <Text style={paywallStyles.planPrice}>14,90 €<Text style={paywallStyles.planPer}> / mois</Text></Text>
            <Text style={paywallStyles.planSub}>Sans engagement · Annulable à tout moment</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <Button
          label="Essayer 7 jours GRATUIT"
          onPress={handleSubscribe}
          loading={loading}
          fullWidth size="lg"
          style={paywallStyles.cta}
        />
        <Text style={paywallStyles.ctaSub}>
          {selectedPlan === 'annual' ? 'Puis 99 €/an' : 'Puis 14,90 €/mois'} · Annulable à tout moment
        </Text>

        {/* Testimonial */}
        <View style={paywallStyles.testimonial}>
          <Text style={paywallStyles.testimonialText}>
            "En 3 semaines avec Prince Johann IA, j'ai tenu mes engagements pour la première fois."
          </Text>
          <Text style={paywallStyles.testimonialAuthor}>— Thomas D., 32 ans · Paris</Text>
        </View>
      </View>
    </SafeScreen>
  );
}

// ─────────────────────────────────────────
// BIBLIOTHÈQUE SCREEN
// ─────────────────────────────────────────
export function BibliothequeScreen() {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const filters = ['Tous', 'PDFs', 'Audios', 'Ebooks'];

  const RESOURCES = [
    { id: '1', title: 'Guide Pilier 2', subtitle: 'Discipline Extrême', type: 'pdf', access: 'free', downloaded: true },
    { id: '2', title: 'Audio guidé — Pilier 1', subtitle: 'Force Intérieure · 12 min', type: 'audio', access: 'free', downloaded: false },
    { id: '3', title: 'Tracker 90 jours', subtitle: 'Annexe A du livre', type: 'pdf', access: 'free', downloaded: false },
    { id: '4', title: 'Guide de Transmission', subtitle: 'Transmettre le Code', type: 'ebook', access: 'premium', downloaded: false },
    { id: '5', title: 'Libérez-vous de l\'anxiété', subtitle: 'Ebook complet', type: 'ebook', access: 'premium', downloaded: false },
    { id: '6', title: 'Scripts pour situations difficiles', subtitle: 'Annexe B du livre', type: 'pdf', access: 'premium', downloaded: false },
  ];

  const typeIcon = (type: string) => ({ pdf: '📄', audio: '🎵', ebook: '📚', video: '▶' }[type] ?? '📄');

  return (
    <SafeScreen edges={['top']} scrollable>
      <View style={biblioStyles.container}>
        <Text style={biblioStyles.title}>Bibliothèque</Text>

        {/* Filters */}
        <View style={biblioStyles.filters}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[biblioStyles.filterChip, activeFilter === f && biblioStyles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[biblioStyles.filterText, activeFilter === f && biblioStyles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Resources grid */}
        <View style={biblioStyles.grid}>
          {RESOURCES.map((r) => (
            <TouchableOpacity key={r.id} style={biblioStyles.resourceCard}>
              <Text style={biblioStyles.resourceIcon}>{typeIcon(r.type)}</Text>
              <Text style={biblioStyles.resourceTitle} numberOfLines={2}>{r.title}</Text>
              <Text style={biblioStyles.resourceSub} numberOfLines={1}>{r.subtitle}</Text>
              <View style={biblioStyles.resourceFooter}>
                {r.access === 'premium' ? (
                  <View style={biblioStyles.premiumBadge}>
                    <Text style={biblioStyles.premiumText}>PREMIUM</Text>
                  </View>
                ) : r.downloaded ? (
                  <Text style={biblioStyles.downloadedText}>✓ Téléchargé</Text>
                ) : (
                  <Text style={biblioStyles.downloadText}>Télécharger</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeScreen>
  );
}

// ─────────────────────────────────────────
// PROFIL SCREEN
// ─────────────────────────────────────────
export function ProfilScreen() {
  const { user, logout, toggleDarkMode, isDarkMode } = useAppStore();
  const firstName = user?.firstName ?? 'Utilisateur';

  const SETTINGS = [
    { icon: '🌙', label: 'Mode sombre', toggle: true, value: isDarkMode, onToggle: toggleDarkMode },
    { icon: '🔔', label: 'Notifications', toggle: false },
    { icon: '🔒', label: 'Sécurité · Face ID activé', toggle: false },
    { icon: '📤', label: 'Exporter mes données', toggle: false },
    { icon: '📋', label: "Conditions d'utilisation", toggle: false },
  ];

  return (
    <SafeScreen edges={['top']} scrollable padded>
      <View style={profilStyles.container}>
        {/* Avatar */}
        <View style={profilStyles.avatarSection}>
          <View style={profilStyles.avatar}>
            <Text style={profilStyles.avatarInitial}>{firstName[0]?.toUpperCase()}</Text>
          </View>
          <Text style={profilStyles.name}>{firstName}</Text>
          <Text style={profilStyles.since}>Membre depuis mars 2026</Text>
        </View>

        {/* Stats */}
        <View style={profilStyles.stats}>
          {[
            { value: String(user?.streak.current ?? 0), label: 'Jours streak' },
            { value: '8/52', label: 'Semaines' },
            { value: '2/12', label: 'Piliers actifs' },
          ].map((s) => (
            <View key={s.label} style={profilStyles.statCard}>
              <Text style={profilStyles.statValue}>{s.value}</Text>
              <Text style={profilStyles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Abonnement */}
        <View style={profilStyles.section}>
          <Text style={profilStyles.sectionTitle}>Mon abonnement</Text>
          <View style={profilStyles.subscriptionCard}>
            <Text style={profilStyles.subIcon}>♔</Text>
            <View style={profilStyles.subInfo}>
              <Text style={profilStyles.subPlan}>
                {user?.subscription.plan === 'free' ? 'Plan Gratuit' : 'Plan Mensuel'}
              </Text>
              <Text style={profilStyles.subDetail}>
                {user?.subscription.plan === 'free'
                  ? `${user.subscription.aiMessagesLimit - user.subscription.aiMessagesUsed} messages restants`
                  : '14,90 €/mois · Prochain débit: 28 mai 2026'}
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={profilStyles.manageLink}>Gérer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={profilStyles.section}>
          <Text style={profilStyles.sectionTitle}>Paramètres</Text>
          <View style={profilStyles.settingsList}>
            {SETTINGS.map((s) => (
              <TouchableOpacity key={s.label} style={profilStyles.settingRow}>
                <Text style={profilStyles.settingIcon}>{s.icon}</Text>
                <Text style={profilStyles.settingLabel}>{s.label}</Text>
                <Text style={profilStyles.settingArrow}>›</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={profilStyles.settingRow} onPress={logout}>
              <Text style={profilStyles.settingIcon}>🚪</Text>
              <Text style={[profilStyles.settingLabel, { color: Colors.semantic.error }]}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={profilStyles.version}>Le Code Masculin v1.0 · Pilier Conscient</Text>
      </View>
    </SafeScreen>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────
const paywallStyles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing['2xl'], paddingBottom: Spacing['3xl'], gap: Spacing.lg, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: Spacing.lg, right: Spacing.screenPadding, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: Colors.text.tertiary, fontSize: 18 },
  iconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.gold.subtle, borderWidth: 2, borderColor: Colors.gold.border, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 32, color: Colors.gold.primary },
  title: { ...Typography.styles.displayMedium, textAlign: 'center', lineHeight: 42 },
  subtitle: { ...Typography.styles.body, textAlign: 'center', color: Colors.text.secondary },
  benefits: { width: '100%', gap: Spacing.md },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  benefitIcon: { fontSize: 20, color: Colors.gold.primary, width: 28, textAlign: 'center' },
  benefitText: { ...Typography.styles.body, flex: 1 },
  plans: { width: '100%', gap: Spacing.md },
  planCard: { backgroundColor: Colors.background.secondary, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.base, gap: Spacing.sm },
  planCardSelected: { borderColor: Colors.gold.primary, borderWidth: 1.5, ...Shadows.gold },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planName: { ...Typography.styles.caption, color: Colors.text.secondary, marginBottom: Spacing.xs },
  planPrice: { ...Typography.styles.heading2, color: Colors.text.primary },
  planPer: { ...Typography.styles.body, color: Colors.text.tertiary },
  planSub: { ...Typography.styles.caption, color: Colors.text.tertiary },
  popularBadge: { backgroundColor: Colors.gold.primary, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  popularText: { fontSize: 9, fontWeight: Typography.weight.bold, color: Colors.text.onGold, letterSpacing: 0.8 },
  cta: { marginTop: Spacing.sm },
  ctaSub: { ...Typography.styles.caption, color: Colors.text.tertiary, textAlign: 'center' },
  testimonial: { backgroundColor: Colors.background.secondary, borderRadius: Radii.lg, borderLeftWidth: 3, borderLeftColor: Colors.gold.primary, padding: Spacing.base, gap: Spacing.sm, width: '100%' },
  testimonialText: { ...Typography.styles.body, fontStyle: 'italic', color: Colors.text.secondary },
  testimonialAuthor: { ...Typography.styles.caption, color: Colors.gold.primary },
});

const biblioStyles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.lg, paddingBottom: Spacing['2xl'], gap: Spacing.lg },
  title: { ...Typography.styles.displayMedium },
  filters: { flexDirection: 'row', gap: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radii.full, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default },
  filterChipActive: { backgroundColor: Colors.gold.subtle, borderColor: Colors.gold.border },
  filterText: { ...Typography.styles.caption, color: Colors.text.secondary },
  filterTextActive: { color: Colors.gold.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  resourceCard: { width: '47%', backgroundColor: Colors.background.secondary, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.base, gap: Spacing.sm },
  resourceIcon: { fontSize: 28 },
  resourceTitle: { ...Typography.styles.bodyBold },
  resourceSub: { ...Typography.styles.caption, color: Colors.text.tertiary },
  resourceFooter: { marginTop: Spacing.xs },
  premiumBadge: { backgroundColor: Colors.gold.subtle, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.gold.border },
  premiumText: { fontSize: 9, fontWeight: Typography.weight.bold, color: Colors.gold.primary, letterSpacing: 0.8 },
  downloadedText: { ...Typography.styles.caption, color: Colors.semantic.success },
  downloadText: { ...Typography.styles.caption, color: Colors.gold.primary },
});

const profilStyles = StyleSheet.create({
  container: { paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'], gap: Spacing.xl },
  avatarSection: { alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.gold.subtle, borderWidth: 2, borderColor: Colors.gold.border, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: Typography.weight.bold, color: Colors.gold.primary },
  name: { ...Typography.styles.heading2 },
  since: { ...Typography.styles.caption, color: Colors.text.tertiary },
  stats: { flexDirection: 'row', gap: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.background.secondary, borderRadius: Radii.lg, padding: Spacing.base, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border.default },
  statValue: { ...Typography.styles.heading2, color: Colors.gold.primary },
  statLabel: { ...Typography.styles.caption, color: Colors.text.tertiary, textAlign: 'center' },
  section: { gap: Spacing.md },
  sectionTitle: { ...Typography.styles.heading3 },
  subscriptionCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.background.secondary, borderRadius: Radii.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.gold.border },
  subIcon: { fontSize: 24, color: Colors.gold.primary },
  subInfo: { flex: 1, gap: Spacing.xs },
  subPlan: { ...Typography.styles.bodyBold },
  subDetail: { ...Typography.styles.caption, color: Colors.text.tertiary },
  manageLink: { color: Colors.gold.primary, fontWeight: Typography.weight.semibold, fontSize: Typography.size.sm },
  settingsList: { backgroundColor: Colors.background.secondary, borderRadius: Radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border.default },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  settingIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  settingLabel: { ...Typography.styles.body, flex: 1 },
  settingArrow: { color: Colors.text.tertiary, fontSize: 18 },
  version: { ...Typography.styles.caption, color: Colors.text.tertiary, textAlign: 'center' },
});
