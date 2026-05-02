import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { ProgressBar } from '../../components/ui';

// ── Données simulées (sera connecté à Supabase en Phase 4) ────────────────────
const MOCK_USER = {
  prenom: 'Marcus',
  email: 'marcus@email.com',
  membre_depuis: 'Mars 2026',
  niveau: "L'Homme qui Construit",
  subscription: { tier: 'monthly', label: 'Plan Mensuel', price: '14,90 €/mois', next: '28 mai 2026' },
  stats: { streak: 23, semaines: 8, piliers_actifs: 2, messages_ia: 7 },
  progress: { semaines: 8, total: 52 },
};

// ── Composants ────────────────────────────────────────────────────────────────

function Avatar({ prenom }: { prenom: string }) {
  return (
    <View style={styles.avatarWrapper}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarInitial}>{prenom.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.avatarBadge}>
        <Text style={styles.avatarBadgeTxt}>✦</Text>
      </View>
    </View>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SettingRow({
  icon, label, value, onPress, isToggle, toggleValue, onToggle, isDestructive,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  isDestructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={isToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={[styles.settingLabel, isDestructive && styles.destructive]}>{label}</Text>
      <View style={styles.settingRight}>
        {isToggle && onToggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: Colors.border.default, true: Colors.brand.gold }}
            thumbColor={Colors.text.primary}
          />
        ) : value ? (
          <Text style={styles.settingValue}>{value}</Text>
        ) : !isDestructive ? (
          <Text style={styles.chevron}>›</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function ProfilScreen() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifSession, setNotifSession] = useState(true);
  const [notifStreak, setNotifStreak] = useState(true);
  const [notifCitation, setNotifCitation] = useState(true);
  const [faceId, setFaceId] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Es-tu sûr de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => router.replace('/(auth)/pacte'),
        },
      ]
    );
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Gérer mon abonnement',
      'Redirigé vers la gestion via Apple/Google Store',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── En-tête ── */}
        <View style={styles.header}>
          <Avatar prenom={MOCK_USER.prenom} />
          <Text style={styles.name}>{MOCK_USER.prenom}</Text>
          <Text style={styles.niveau}>{MOCK_USER.niveau}</Text>
          <Text style={styles.since}>Membre depuis {MOCK_USER.membre_depuis}</Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatCard value={`🔥 ${MOCK_USER.stats.streak}`} label="Jours de feu" />
          <StatCard value={`${MOCK_USER.stats.semaines}/52`} label="Semaines" />
          <StatCard value={`${MOCK_USER.stats.piliers_actifs}/12`} label="Piliers" />
          <StatCard value={MOCK_USER.stats.messages_ia} label="Messages IA" />
        </View>

        {/* ── Progression globale ── */}
        <View style={styles.section}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progression du programme</Text>
            <Text style={styles.progressPct}>
              {Math.round((MOCK_USER.progress.semaines / MOCK_USER.progress.total) * 100)}%
            </Text>
          </View>
          <ProgressBar
            progress={MOCK_USER.progress.semaines / MOCK_USER.progress.total}
            height={6}
          />
          <Text style={styles.progressSub}>
            Semaine {MOCK_USER.progress.semaines} sur {MOCK_USER.progress.total}
          </Text>
        </View>

        {/* ── Abonnement ── */}
        <View style={styles.section}>
          <SectionTitle title="Mon abonnement" />
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionLeft}>
              <Text style={styles.subscriptionIcon}>👑</Text>
              <View>
                <Text style={styles.subscriptionTier}>{MOCK_USER.subscription.label}</Text>
                <Text style={styles.subscriptionPrice}>{MOCK_USER.subscription.price}</Text>
                <Text style={styles.subscriptionNext}>
                  Prochain débit : {MOCK_USER.subscription.next}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleManageSubscription}>
              <Text style={styles.manageLink}>Gérer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Apparence ── */}
        <View style={styles.section}>
          <SectionTitle title="Apparence" />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="🌙"
              label="Mode sombre"
              isToggle
              toggleValue={darkMode}
              onToggle={setDarkMode}
            />
          </View>
        </View>

        {/* ── Notifications ── */}
        <View style={styles.section}>
          <SectionTitle title="Notifications" />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="🔔"
              label="Rappel de session"
              isToggle
              toggleValue={notifSession}
              onToggle={setNotifSession}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="🔥"
              label="Alerte streak en danger"
              isToggle
              toggleValue={notifStreak}
              onToggle={setNotifStreak}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="✦"
              label="Citation hebdomadaire"
              isToggle
              toggleValue={notifCitation}
              onToggle={setNotifCitation}
            />
          </View>
        </View>

        {/* ── Sécurité ── */}
        <View style={styles.section}>
          <SectionTitle title="Sécurité" />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="⬡"
              label="Face ID / Empreinte"
              isToggle
              toggleValue={faceId}
              onToggle={setFaceId}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="🔑"
              label="Changer le mot de passe"
              onPress={() => Alert.alert('Bientôt disponible')}
            />
          </View>
        </View>

        {/* ── Données ── */}
        <View style={styles.section}>
          <SectionTitle title="Mes données" />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="📤"
              label="Exporter mes données"
              onPress={() => Alert.alert('Export', 'Un email te sera envoyé avec tes données dans 24h.')}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="📋"
              label="Conditions d'utilisation"
              onPress={() => Alert.alert('CGU', 'pilierconscient.com/cgu')}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="🔒"
              label="Confidentialité"
              onPress={() => Alert.alert('Confidentialité', 'pilierconscient.com/privacy')}
            />
          </View>
        </View>

        {/* ── À propos ── */}
        <View style={styles.section}>
          <SectionTitle title="À propos" />
          <View style={styles.settingsCard}>
            <SettingRow icon="ℹ️" label="Version" value="1.0.0" />
            <View style={styles.separator} />
            <SettingRow
              icon="⭐"
              label="Noter l'app"
              onPress={() => Alert.alert('Merci !', 'Redirection vers le Store...')}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="💬"
              label="Contacter le support"
              onPress={() => Alert.alert('Support', 'support@pilierconscient.com')}
            />
          </View>
        </View>

        {/* ── Déconnexion ── */}
        <View style={[styles.section, { marginBottom: Spacing['5xl'] }]}>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="🚪"
              label="Se déconnecter"
              onPress={handleLogout}
              isDestructive
            />
          </View>
        </View>

        {/* Signature */}
        <Text style={styles.signature}>
          Pilier Conscient · Prince Johann Akombi{'\n'}
          Le Code Masculin v1.0
        </Text>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.background.secondary,
    borderWidth: 2, borderColor: Colors.brand.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { ...Typography.h1, color: Colors.brand.gold },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.brand.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background.primary,
  },
  avatarBadgeTxt: { fontSize: 10, color: Colors.text.inverse },
  name: { ...Typography.h2, color: Colors.text.primary, marginBottom: 4 },
  niveau: { ...Typography.body, color: Colors.brand.gold, fontStyle: 'italic', marginBottom: 4 },
  since: { ...Typography.caption, color: Colors.text.muted },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  statValue: { ...Typography.h4, color: Colors.text.primary, marginBottom: 2 },
  statLabel: { ...Typography.caption, color: Colors.text.muted, textAlign: 'center' },

  // Sections
  section: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  sectionTitle: {
    ...Typography.label,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },

  // Progression
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: { ...Typography.body, color: Colors.text.secondary },
  progressPct: { ...Typography.body, color: Colors.brand.gold, fontWeight: '700' },
  progressSub: { ...Typography.caption, color: Colors.text.muted, marginTop: Spacing.xs },

  // Abonnement
  subscriptionCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.brand.gold,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  subscriptionIcon: { fontSize: 28 },
  subscriptionTier: { ...Typography.h4, color: Colors.text.primary },
  subscriptionPrice: { ...Typography.body, color: Colors.brand.gold },
  subscriptionNext: { ...Typography.caption, color: Colors.text.muted, marginTop: 2 },
  manageLink: { ...Typography.body, color: Colors.brand.gold, fontWeight: '600' },

  // Settings
  settingsCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
  },
  settingIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  settingLabel: { ...Typography.body, color: Colors.text.primary, flex: 1 },
  settingRight: { alignItems: 'flex-end' },
  settingValue: { ...Typography.body, color: Colors.text.muted },
  chevron: { fontSize: 20, color: Colors.text.muted },
  destructive: { color: Colors.status.error },
  separator: { height: 1, backgroundColor: Colors.border.subtle, marginLeft: 52 },

  // Signature
  signature: {
    ...Typography.caption,
    color: Colors.text.muted,
    textAlign: 'center',
    paddingVertical: Spacing['2xl'],
    lineHeight: 20,
  },
});
