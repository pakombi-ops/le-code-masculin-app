import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, Modal, TextInput, Linking, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Bell, Flame, Quote, KeyRound, Download, FileText, Lock,
  Info, Star, MessageCircle, LogOut, Crown, Gift, Sparkles,CheckSquare, Trash2,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { ProgressBar } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { getCompletedLessonIds, getOverallProgress } from '../../constants/progression';
import { updatePassword } from '../../services/supabase';
import { getNotificationPrefs, setNotificationPref } from '../../services/notifications';
import { exportUserData } from '../../services/dataExport';


const PRIVACY_URL = 'https://pilierconscient.com/politique-de-confidentialite/';
const TERMS_URL = 'https://pilierconscient.com/conditions-utilisation/'; // TODO: page a publier

function StatCard({ icon, value, label }: { icon?: React.ReactNode; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      {icon && <View style={styles.statIcon}>{icon}</View>}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SettingRow({ icon, label, value, onPress, isToggle, toggleValue, onToggle, isDestructive, loading, badge }: {
  icon: React.ReactNode; label: string; value?: string; onPress?: () => void;
  isToggle?: boolean; toggleValue?: boolean; onToggle?: (v: boolean) => void; isDestructive?: boolean; loading?: boolean;
  badge?: string;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={isToggle || loading} activeOpacity={0.7}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingLabelRow}>
        <Text style={[styles.settingLabel, isDestructive && styles.destructive]}>{label}</Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.settingRight}>
        {loading
          ? <ActivityIndicator size="small" color={Colors.brand.gold} />
          : isToggle && onToggle
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
  const insets = useSafeAreaInsets();
  const { user, streak, aiQuota, logout, userProgress } = useAuthStore();
  const [notifSession, setNotifSession] = useState(true);
  const [notifStreak, setNotifStreak] = useState(true);
  const [notifCitation, setNotifCitation] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getNotificationPrefs().then((prefs) => {
      setNotifSession(prefs.session);
      setNotifStreak(prefs.streak);
      setNotifCitation(prefs.citation);
    });
  }, []);

  const handleToggleSession = async (value: boolean) => {
    setNotifSession(value); // optimiste — corrige si la permission est refusee
    const prefs = await setNotificationPref('session', value);
    setNotifSession(prefs.session);
  };

  const handleToggleStreak = async (value: boolean) => {
    setNotifStreak(value);
    const prefs = await setNotificationPref('streak', value);
    setNotifStreak(prefs.streak);
  };

  const handleToggleCitation = async (value: boolean) => {
    setNotifCitation(value);
    const prefs = await setNotificationPref('citation', value);
    setNotifCitation(prefs.citation);
  };

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const prenom = user?.prenom || user?.name || 'Utilisateur';
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
    : 'Recemment';

  const handleLogout = () => {
    Alert.alert(
      'Se deconnecter',
      'Es-tu sur de vouloir te deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se deconnecter', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/(auth)/splash');
        }},
      ]
    );
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('8 caracteres minimum.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    setChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    setChangingPassword(false);

    if (error) {
      setPasswordError("Impossible de changer le mot de passe. Reessaie.");
      return;
    }

    setPasswordModalVisible(false);
    setNewPassword('');
    setConfirmNewPassword('');
    Alert.alert('C\'est fait', 'Ton mot de passe a ete mis a jour.');
  };

  const openPrivacy = () => {
    Linking.openURL(PRIVACY_URL).catch(() =>
      Alert.alert('Erreur', "Impossible d'ouvrir la page pour le moment.")
    );
  };

  const openTerms = () => {
    Linking.openURL(TERMS_URL).catch(() =>
      Alert.alert('Erreur', "Impossible d'ouvrir la page pour le moment.")
    );
  };

  const handleExportData = async () => {
    if (!user?.id) return;
    setExporting(true);
    try {
      await exportUserData(user.id);
    } catch (e) {
      Alert.alert('Erreur', "L'export n'a pas pu etre genere. Reessaie dans un instant.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeScreen edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{prenom.charAt(0).toUpperCase()}</Text>
            </View>
            {isPremium && (
              <View style={styles.avatarBadge}>
                <Sparkles size={12} color={Colors.text.inverse} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{prenom}</Text>
          <Text style={styles.niveau}>{niveau}</Text>
          <Text style={styles.since}>Membre depuis {memberSince}</Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        {/* Stats reelles */}
        <View style={styles.statsRow}>
          <StatCard icon={<Flame size={16} color={Colors.brand.gold} />} value={currentStreak} label="Jours de feu" />
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

                 {/* Tracker 90 Jours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suivi quotidien</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon={<CheckSquare size={18} color={Colors.text.secondary} />}
              label="Tracker 90 Jours"
              badge={!isPremium ? 'PREMIUM' : undefined}
              onPress={() => router.push('/tracker')}
            />
          </View>
        </View>

        {/* Abonnement */}
        {/* CORRIGE : le bouton "J'ai deja achete" ouvrait une modale
            avec son propre formulaire de liaison de compte (troisieme
            implementation du meme flux). Redirige maintenant vers
            l'ecran /paywall unique (hero, prix, features, temoignages,
            lien "relier mon compte" integre). */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon abonnement</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionLeft}>
              {isPremium
                ? <Crown size={28} color={Colors.brand.gold} />
                : <Gift size={28} color={Colors.text.muted} />}
              <View>
                <Text style={styles.subscriptionTier}>{isPremium ? 'Plan Premium' : 'Plan Gratuit'}</Text>
                <Text style={styles.subscriptionPrice}>
                  {isPremium ? '24,75 €/mois' : `${10 - messagesUsed} messages IA restants`}
                </Text>
              </View>
            </View>
            {!isPremium && (
              <TouchableOpacity onPress={() => router.push('/paywall')}>
                <Text style={styles.upgradeLink}>Voir les plans</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon={<Bell size={18} color={Colors.text.secondary} />}
              label="Nouveau contenu disponible"
              isToggle toggleValue={notifSession} onToggle={handleToggleSession}
            />
            <View style={styles.separator} />
            <SettingRow
              icon={<Flame size={18} color={Colors.text.secondary} />}
              label="Alerte streak en danger"
              isToggle toggleValue={notifStreak} onToggle={handleToggleStreak}
            />
            <View style={styles.separator} />
            <SettingRow
              icon={<Quote size={18} color={Colors.text.secondary} />}
              label="Citation hebdomadaire"
              isToggle toggleValue={notifCitation} onToggle={handleToggleCitation}
            />
          </View>
        </View>

        {/* Securite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Securite</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon={<KeyRound size={18} color={Colors.text.secondary} />}
              label="Changer le mot de passe"
              onPress={() => setPasswordModalVisible(true)}
            />
          </View>
        </View>

        {/* Donnees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes donnees</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon={<Download size={18} color={Colors.text.secondary} />}
              label="Exporter mes donnees"
              onPress={handleExportData}
              loading={exporting}
            />
            <View style={styles.separator} />
            <SettingRow
              icon={<Trash2 size={18} color={Colors.status.error} />}
              label="Supprimer mon compte"
              onPress={() => router.push('/supprimer-compte')}
              isDestructive
            />
            <View style={styles.separator} />
            <SettingRow
              icon={<FileText size={18} color={Colors.text.secondary} />}
              label="Conditions d'utilisation"
              onPress={openTerms}
            />
            <View style={styles.separator} />
            <SettingRow
              icon={<Lock size={18} color={Colors.text.secondary} />}
              label="Confidentialite"
              onPress={openPrivacy}
            />
          </View>
        </View>

        {/* A propos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A propos</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon={<Info size={18} color={Colors.text.secondary} />} label="Version" value="1.0.0" />
            <View style={styles.separator} />
            <SettingRow
              icon={<Star size={18} color={Colors.text.secondary} />}
              label="Noter l'app"
              onPress={() => Alert.alert('Merci !', 'Bientot disponible sur le Store.')}
            />
            <View style={styles.separator} />
            <SettingRow
              icon={<MessageCircle size={18} color={Colors.text.secondary} />}
              label="Support"
              onPress={() => Alert.alert('Support', 'support@pilierconscient.com')}
            />
          </View>
        </View>

        {/* Deconnexion */}
        <View style={[styles.section, { marginBottom: Spacing['5xl'] }]}>
          <View style={styles.settingsCard}>
            <SettingRow
              icon={<LogOut size={18} color={Colors.status.error} />}
              label="Se deconnecter"
              onPress={handleLogout}
              isDestructive
            />
          </View>
        </View>

        <Text style={styles.signature}>
          Pilier Conscient · Prince Johann Akombi{'\n'}Le Code Masculin v1.0
        </Text>
        {/* Dégagement dynamique : hauteur de la pill + marge + inset système */}
        <View style={{ height: 68 + 16 + insets.bottom + 16 }} />
      </ScrollView>

      <Modal visible={passwordModalVisible} transparent animationType="slide" onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
            <Text style={styles.modalSubtitle}>Choisis un nouveau mot de passe pour ton compte</Text>
            {passwordError ? <Text style={styles.modalError}>{passwordError}</Text> : null}
            <TextInput
              style={styles.modalInput}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={Colors.text.muted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirme le mot de passe"
              placeholderTextColor={Colors.text.muted}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword} disabled={changingPassword}>
              <Text style={styles.modalButtonText}>{changingPassword ? 'Mise a jour...' : 'Confirmer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setPasswordModalVisible(false); setPasswordError(''); setNewPassword(''); setConfirmNewPassword(''); }}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.background.secondary, borderWidth: 2, borderColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...Typography.h1, color: Colors.brand.gold },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background.primary },
  name: { ...Typography.h2, color: Colors.text.primary, marginBottom: 4 },
  niveau: { ...Typography.body, color: Colors.brand.gold, fontStyle: 'italic', marginBottom: 4 },
  since: { ...Typography.caption, color: Colors.text.muted },
  email: { ...Typography.caption, color: Colors.text.muted, marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingVertical: Spacing.lg, gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  statCard: { flex: 1, backgroundColor: Colors.background.secondary, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.default },
  statIcon: { marginBottom: 2 },
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
  subscriptionTier: { ...Typography.h4, color: Colors.text.primary },
  subscriptionPrice: { ...Typography.body, color: Colors.brand.gold },
  upgradeLink: { ...Typography.body, color: Colors.brand.gold, fontWeight: '600' },
  settingsCard: { backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md + 2, gap: Spacing.md },
  settingIcon: { width: 24, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { ...Typography.body, color: Colors.text.primary },
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
  modalError: { ...Typography.bodySmall, color: Colors.status.error, backgroundColor: Colors.status.errorBg, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.md },
  modalInput: { backgroundColor: Colors.background.tertiary, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text.primary, marginBottom: Spacing.md },
  modalButton: { backgroundColor: Colors.brand.gold, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.md },
  modalButtonText: { ...Typography.button, color: Colors.text.inverse },
  modalCancel: { ...Typography.body, color: Colors.text.muted, textAlign: 'center' },
    settingLabelRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  badge: { borderWidth: 1, borderColor: Colors.brand.gold, borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { ...Typography.caption, color: Colors.brand.gold, fontSize: 10, fontWeight: '700' },
});
