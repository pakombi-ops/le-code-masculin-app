import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Card, Badge, ProgressBar } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { updateStreak } from '../../services/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function HomeScreen() {
  const { user, streak, aiQuota, isLoading, refreshStreak } = useAuthStore();
  const [updating, setUpdating] = useState(false);

  // Mettre à jour le streak à chaque ouverture du dashboard
  useEffect(() => {
    if (user?.id) {
      setUpdating(true);
      updateStreak(user.id)
        .then(() => refreshStreak(user.id))
        .finally(() => setUpdating(false));
    }
  }, [user?.id]);

  const dateLabel = format(new Date(), "EEEE d MMMM", { locale: fr });
  const dateCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  const prenom = user?.prenom ?? user?.name ?? 'Ami';
  const currentStreak = streak?.current_streak ?? 0;
  const messagesUsed = aiQuota?.messages_used ?? 0;
  const messagesRemaining = Math.max(0, 10 - messagesUsed);
  const isPremium = aiQuota?.is_premium ?? false;

  // Générer les 7 jours de la semaine
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const lastActivity = streak?.last_activity_date;
    return lastActivity ? dayStr <= lastActivity : false;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.brand.gold} size="large" />
        <Text style={styles.loadingTxt}>Chargement de ton Code...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, {prenom} 👋</Text>
            <Text style={styles.date}>{dateCapitalized}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profil')}
          >
            <Text style={styles.avatarText}>
              {prenom.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Streak — Feu Intérieur */}
          <Card style={styles.streakCard} variant="gold">
            <View style={styles.streakTop}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <View>
                <Text style={styles.streakLabel}>
                  {currentStreak <= 1 ? 'jour de feu' : 'jours de suite'}
                </Text>
                {currentStreak === 0 && (
                  <Text style={styles.streakSub}>Commence aujourd'hui</Text>
                )}
              </View>
            </View>
            <View style={styles.weekRow}>
              {DAY_LABELS.map((day, idx) => (
                <View key={idx} style={styles.dayItem}>
                  <View style={[styles.dayCircle, weekDays[idx] && styles.dayCircleActive]}>
                    <Text style={[styles.dayDot, weekDays[idx] && styles.dayDotActive]}>
                      {weekDays[idx] ? '✓' : ''}
                    </Text>
                  </View>
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Contenu du jour */}
          <Text style={styles.sectionTitle}>Contenu du jour</Text>
          <Card style={styles.contentCard} onPress={() => router.push('/(tabs)/programme')}>
            <Badge label="PILIER 2 · DISCIPLINE" variant="active" style={styles.contentBadge} />
            <Text style={styles.contentWeek}>Semaine 5</Text>
            <Text style={styles.contentTitle}>L'engagement comme identité</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Leçon 3/4</Text>
              <Text style={styles.progressPct}>65%</Text>
            </View>
            <ProgressBar progress={0.65} style={styles.progressBar} />
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => router.push('/(tabs)/programme')}
            >
              <Text style={styles.continueBtnText}>Continuer →</Text>
            </TouchableOpacity>
          </Card>

          {/* Raccourcis */}
          <View style={styles.shortcuts}>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/coach')}
            >
              <Text style={styles.shortcutIcon}>💬</Text>
              <Text style={styles.shortcutTitle}>Prince Johann</Text>
              <Text style={styles.shortcutSub}>
                {isPremium ? 'Illimité ✦' : `${messagesRemaining} restants`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard}>
              <Text style={styles.shortcutIcon}>📝</Text>
              <Text style={styles.shortcutTitle}>Mon journal</Text>
              <Text style={styles.shortcutSub}>Écrire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/bibliotheque')}
            >
              <Text style={styles.shortcutIcon}>📚</Text>
              <Text style={styles.shortcutTitle}>Bibliothèque</Text>
              <Text style={styles.shortcutSub}>Ressources</Text>
            </TouchableOpacity>
          </View>

          {/* Progression globale */}
          <Card style={styles.progressCard}>
            <View style={styles.progressGlobalRow}>
              <Text style={styles.progressGlobalTitle}>Progression programme</Text>
              <Text style={styles.progressGlobalPct}>Semaine 5/52</Text>
            </View>
            <ProgressBar progress={5 / 52} height={6} style={{ marginTop: Spacing.sm }} />
          </Card>

          {/* Citation */}
          <Card style={styles.quoteCard} variant="bordered">
            <Text style={styles.quoteLabel}>CITATION DU CODE</Text>
            <Text style={styles.quoteText}>
              "La discipline est la liberté que tu te donnes à toi-même."
            </Text>
            <Text style={styles.quoteSource}>— Le Code Masculin, Pilier 2</Text>
          </Card>

          <View style={{ height: Spacing['3xl'] }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  loadingContainer: { flex: 1, backgroundColor: Colors.background.primary, alignItems: 'center', justifyContent: 'center', gap: Spacing.base },
  loadingTxt: { ...Typography.body, color: Colors.text.muted },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  greeting: { ...Typography.h3, color: Colors.text.primary },
  date: { ...Typography.body, color: Colors.text.secondary, marginTop: 2 },
  avatarBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.background.secondary, borderWidth: 1.5, borderColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.h4, color: Colors.brand.gold },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  sectionTitle: { ...Typography.label, color: Colors.text.secondary, marginBottom: Spacing.md, marginTop: Spacing.xl },
  streakCard: { marginBottom: 0 },
  streakTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.sm },
  streakIcon: { fontSize: 28 },
  streakNumber: { ...Typography.number, color: Colors.brand.gold },
  streakLabel: { ...Typography.bodyLarge, color: Colors.text.secondary },
  streakSub: { ...Typography.caption, color: Colors.text.muted },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayItem: { alignItems: 'center', gap: 4 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { backgroundColor: Colors.brand.gold },
  dayDot: { fontSize: 14, color: Colors.text.muted },
  dayDotActive: { color: Colors.text.inverse },
  dayLabel: { ...Typography.caption, color: Colors.text.muted },
  contentCard: { marginBottom: 0 },
  contentBadge: { marginBottom: Spacing.sm },
  contentWeek: { ...Typography.caption, color: Colors.text.muted, marginBottom: Spacing.xs },
  contentTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.base },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  progressLabel: { ...Typography.bodySmall, color: Colors.text.secondary },
  progressPct: { ...Typography.bodySmall, color: Colors.brand.gold },
  progressBar: { marginBottom: Spacing.base },
  continueBtn: { backgroundColor: Colors.brand.gold, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  continueBtnText: { ...Typography.button, color: Colors.text.inverse },
  shortcuts: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  shortcutCard: { flex: 1, backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border.default },
  shortcutIcon: { fontSize: 22, marginBottom: Spacing.xs },
  shortcutTitle: { ...Typography.bodySmall, color: Colors.text.primary, fontWeight: '600', marginBottom: 2 },
  shortcutSub: { ...Typography.caption, color: Colors.text.muted },
  progressCard: { marginTop: Spacing.xl },
  progressGlobalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressGlobalTitle: { ...Typography.body, color: Colors.text.secondary, fontWeight: '600' },
  progressGlobalPct: { ...Typography.body, color: Colors.brand.gold, fontWeight: '600' },
  quoteCard: { marginTop: Spacing.base, padding: Spacing.lg },
  quoteLabel: { ...Typography.labelSmall, color: Colors.brand.gold, marginBottom: Spacing.md },
  quoteText: { ...Typography.quote, color: Colors.text.primary, marginBottom: Spacing.sm },
  quoteSource: { ...Typography.caption, color: Colors.text.muted },
});
