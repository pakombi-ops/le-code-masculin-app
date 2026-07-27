import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, Modal, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { ProgressBar } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { getCompletedLessonIds, getOverallProgress } from '../../constants/progression';

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({ icon, label, value, onPress, isToggle, toggleValue, onToggle, isDestructive }: {
  icon: string; label: string; value?: string; onPress?: () => void;
  isToggle?: boolean; toggleValue?: boolean; onToggle?: (v: boolean) => void; isDestructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={isToggle} activeOpacity={0.7}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={[styles.settingLabel, isDestructive && styles.destructive]}>{label}</Text>
      <View style={styles.settingRight}>
        {isToggle && onToggle
          ? <Switch value={toggleValue} onValueChange={onToggle} trackColor={{ false: Colors.border.default, true: Colors.brand.gold }} thumbColor={Colors.text.primary} />
          : value
            ? <Text style={styles.settingValue}>{value}</Text>
            : !isDestructive
              ? <Text style={styles.chevron}>›</Text>
              : null}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfilScreen() {
  const { user, streak, aiQuota, logout, linkPurchaseAccount, userProgress } = useAuthStore();
  const [darkMode, setDarkMode] = useState(true);
  const [notifSession, setNotifSession] = useState(true);
  const [notifStreak, setNotifStreak] = useState(true);
  const [notifCitation, setNotifCitation] = useState(true);
  const [faceId, setFaceId] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);

  const prenom = user?.prenom ?? user?.name ?? 'Utilisateur';
  const email = user?.email ?? '';
  const niveau = user?.niveau ?? "L'Homme qui Cherche";
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;
  const isPremium = aiQuota?.is_premium ?? false;
  const messagesUsed = aiQuota?.messages_used ?? 0;
  const completedIds = getCompletedLessonIds(userProgress);
  const { completedWeeks, totalWeeks } = getOverallProgress(completedIds);
  const progressPercent = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : 'Récemment';

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Es-tu sûr de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/(auth)/splash');
        }},
      ]
    );
  };

  const handleLinkAccount = async () => {
    if (!linkEmail.trim() || !user?.id) return;
    setLinking(true);
    const result = await linkPurchaseAccount(linkEmail.trim(), user.id);
    setLinking(false);

    if (result.linked) {
      Alert.alert('Compte lié !', 'Ton accès premium est maintenant actif.');
      setLinkModalVisible(false);
      setLinkEmail('');
    } else if (result.reason === 'no_customer') {
      Alert.alert('Introuvable', "Aucun achat trouvé avec cet email. Vérifie l'orthographe ou achète un plan sur pilierconscient.com.");
    } else if (result.reason === 'no_active_subscription') {
      Alert.alert("Pas d'abonnement actif", "Cet email existe mais n'a pas d'abonnement actif actuellement.");
    } else {
      Alert.alert('Erreur', 'Impossible de vérifier ton achat pour le moment.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{prenom.charAt(0).toUpperCase()}</Text>
            </View>
            {isPremium && (
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeTxt}>✦</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{prenom}</Text>
          <Text style={styles.niveau}>{niveau}</Text>
          <Text style={styles.since}>Membre depuis {memberSince}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        {/* Stats réelles */}
        <View style={styles.statsRow}>
          <StatCard value={`🔥 ${currentStreak}`} label="Jours de feu" />
          <StatCard value={`${longestStreak}`} label="Record streak" />
         <StatCard value={isPremium ? '∞' : `${Math.max(0, 10 - messagesUsed)}/10`} label="Messages IA" />
        </View>

        {/* Progression */}
        <View style={styles.section}>
          <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progression programme</Text>
          <Text style={styles.progressPct}>Semaine {completedWeeks}/{totalWeeks}</Text>
          </View>
          <ProgressBar progress={completedWeeks / totalWeeks} height={6} />
          <Text style={styles.progressSub}>{progressPercent}% accompli · Continue !</Text>
        </View>

        {/* Abonnement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon abonnement</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionLeft}>
              <Text style={styles.subscriptionIcon}>{isPremium ? '👑' : '🆓'}</Text>
              <View>
                <Text style={styles.subscriptionTier}>{isPremium ? 'Plan Premium' : 'Plan Gratuit'}</Text>
                <Text style={styles.subscriptionPrice}>
                  {isPremium ? '24,75 €/mois' : `${10 - messagesUsed} messages IA restants`}
                </Text>
              </View>
            </View>
            {!isPremium && (
              <TouchableOpacity onPress={() => setLinkModalVisible(true)}>
                <Text style={styles.upgradeLink}>J'ai déjà acheté</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Apparence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apparence</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon="🌙" label="Mode sombre" isToggle toggleValue={darkMode} onToggle={setDarkMode} />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon="🔔" label="Rappel de session" isToggle toggleValue={notifSession} onToggle={setNotifSession} />
            <View style={styles.separator} />
            <SettingRow icon="🔥" label="Alerte streak en danger" isToggle toggleValue={notifStreak} onToggle={setNotifStreak} />
            <View style={styles.separator} />
            <SettingRow icon="✦" label="Citation hebdomadaire" isToggle toggleValue={notifCitation} onToggle={setNotifCitation} />
          </View>
        </View>

        {/* Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon="⬡" label="Face ID / Empreinte" isToggle toggleValue={faceId} onToggle={setFaceId} />
            <View style={styles.separator} />
            <SettingRow icon="🔑" label="Changer le mot de passe" onPress={() => Alert.alert('Bientôt disponible')} />
          </View>
        </View>

        {/* Données */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes données</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon="📤" label="Exporter mes données" onPress={() => Alert.alert('Export', 'Bientôt disponible.')} />
            <View style={styles.separator} />
            <SettingRow icon="📋" label="Conditions d'utilisation" onPress={() => Alert.alert('CGU', 'pilierconscient.com/cgu')} />
            <View style={styles.separator} />
            <SettingRow icon="🔒" label="Confidentialité" onPress={() => Alert.alert('Confidentialité', 'pilierconscient.com/privacy')} />
          </View>
        </View>

        {/* À propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon="ℹ️" label="Version" value="1.0.0" />
            <View style={styles.separator} />
            <SettingRow icon="⭐" label="Noter l'app" onPress={() => Alert.alert('Merci !', 'Bientôt disponible sur le Store.')} />
            <View style={styles.separator} />
            <SettingRow icon="💬" label="Support" onPress={() => Alert.alert('Support', 'support@pilierconscient.com')} />
          </View>
        </View>

        {/* Déconnexion */}
        <View style={[styles.section, { marginBottom: Spacing['5xl'] }]}>
          <View style={styles.settingsCard}>
            <SettingRow icon="🚪" label="Se déconnecter" onPress={handleLogout} isDestructive />
          </View>
        </View>

        <Text style={styles.signature}>
          Pilier Conscient · Prince Johann Akombi{'\n'}Le Code Masculin v1.0
        </Text>
      </ScrollView>

      <Modal visible={linkModalVisible} transparent animationType="slide" onRequestClose={() => setLinkModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Lier ton compte</Text>
            <Text style={styles.modalSubtitle}>Entre l'email utilisé lors de ton achat sur pilierconscient.com</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ton@email.com"
              placeholderTextColor={Colors.text.muted}
              value={linkEmail}
              onChangeText={setLinkEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleLinkAccount} disabled={linking}>
              <Text style={styles.modalButtonText}>{linking ? 'Vérification...' : 'Vérifier'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLinkModalVisible(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.background.secondary, borderWidth: 2, borderColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...Typography.h1, color: Colors.brand.gold },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background.primary },
  avatarBadgeTxt: { fontSize: 10, color: Colors.text.inverse },
  name: { ...Typography.h2, color: Colors.text.primary, marginBottom: 4 },
  niveau: { ...Typography.body, color: Colors.brand.gold, fontStyle: 'italic', marginBottom: 4 },
  since: { ...Typography.caption, color: Colors.text.muted },
  email: { ...Typography.caption, color: Colors.text.muted, marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingVertical: Spacing.lg, gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  statCard: { flex: 1, backgroundColor: Colors.background.secondary, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.default },
  statValue: { ...Typography.h4, color: Colors.text.primary, marginBottom: 2 },
  statLabel: { ...Typography.caption, color: Colors.text.muted, textAlign: 'center' },
  section: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  sectionTitle: { ...Typography.label, color: Colors.text.secondary, marginBottom: Spacing.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressLabel: { ...Typography.body, color: Colors.text.secondary },
  progressPct: { ...Typography.body, color: Colors.brand.gold, fontWeight: '700' },
  progressSub: { ...Typography.caption, color: Colors.text.muted, marginTop: Spacing.xs },
  subscriptionCard: { backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.brand.gold, padding: Spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subscriptionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  subscriptionIcon: { fontSize: 28 },
  subscriptionTier: { ...Typography.h4, color: Colors.text.primary },
  subscriptionPrice: { ...Typography.body, color: Colors.brand.gold },
  upgradeLink: { ...Typography.body, color: Colors.brand.gold, fontWeight: '600' },
  settingsCard: { backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md + 2, gap: Spacing.md },
  settingIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  settingLabel: { ...Typography.body, color: Colors.text.primary, flex: 1 },
  settingRight: { alignItems: 'flex-end' },
  settingValue: { ...Typography.body, color: Colors.text.muted },
  chevron: { fontSize: 20, color: Colors.text.muted },
  destructive: { color: Colors.status.error },
  separator: { height: 1, backgroundColor: Colors.border.subtle, marginLeft: 52 },
  signature: { ...Typography.caption, color: Colors.text.muted, textAlign: 'center', paddingVertical: Spacing['2xl'], lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background.secondary, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  modalTitle: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing.sm },
  modalSubtitle: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing.lg },
  modalInput: { backgroundColor: Colors.background.tertiary, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text.primary, marginBottom: Spacing.lg },
  modalButton: { backgroundColor: Colors.brand.gold, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.md },
  modalButtonText: { ...Typography.button, color: Colors.text.inverse },
  modalCancel: { ...Typography.body, color: Colors.text.muted, textAlign: 'center' },
});