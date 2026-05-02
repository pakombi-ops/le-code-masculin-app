import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Card, Badge, ProgressBar } from '../../components/ui';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const { width } = Dimensions.get('window');
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * SCREEN 9 — Tableau de Bord (Home)
 * Streak, contenu du jour, raccourcis, citation.
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  // Données simulées — seront remplacées par Supabase
  const mockData = {
    prenom: user?.prenom ?? 'Marcus',
    streak: user?.streak?.currentStreak ?? 23,
    weekDays: [true, true, true, true, true, false, false],
    todayContent: {
      pillarId: 2,
      pillarName: 'Discipline',
      weekNumber: 8,
      lessonTitle: "L'engagement comme identité",
      lessonProgress: 0.65,
      lessonCurrent: 3,
      lessonTotal: 4,
    },
    remainingMessages: 8,
    quote: {
      text: 'La discipline est la liberté que tu te donnes à toi-même.',
      source: 'Le Code Masculin, Pilier 2',
    },
    weekProgress: 8 / 52,
  };

  const dateLabel = format(new Date(), "EEEE d MMMM", { locale: fr });
  const dateCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  return (
    <SafeScreen edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── En-tête ────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, {mockData.prenom} 👋</Text>
            <Text style={styles.date}>{dateCapitalized}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profil')}
          >
            <Text style={styles.avatarText}>
              {mockData.prenom.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* ── Streak ─────────────────────────────────────── */}
          <Card style={styles.streakCard} variant="gold">
            <View style={styles.streakTop}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakNumber}>{mockData.streak}</Text>
              <Text style={styles.streakLabel}>jours de suite</Text>
            </View>
            <View style={styles.weekRow}>
              {DAY_LABELS.map((day, idx) => (
                <View key={idx} style={styles.dayItem}>
                  <View
                    style={[
                      styles.dayCircle,
                      mockData.weekDays[idx] && styles.dayCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayDot,
                        mockData.weekDays[idx] && styles.dayDotActive,
                      ]}
                    >
                      {mockData.weekDays[idx] ? '✓' : ''}
                    </Text>
                  </View>
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* ── Contenu du jour ────────────────────────────── */}
          <Text style={styles.sectionTitle}>Contenu du jour</Text>
          <Card
            style={styles.contentCard}
            onPress={() => router.push('/(tabs)/programme')}
          >
            <Badge
              label={`PILIER ${mockData.todayContent.pillarId} · ${mockData.todayContent.pillarName.toUpperCase()}`}
              variant="active"
              style={styles.contentBadge}
            />
            <Text style={styles.contentWeek}>Semaine {mockData.todayContent.weekNumber}</Text>
            <Text style={styles.contentTitle}>{mockData.todayContent.lessonTitle}</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>
                Leçon {mockData.todayContent.lessonCurrent}/{mockData.todayContent.lessonTotal}
              </Text>
              <Text style={styles.progressPct}>
                {Math.round(mockData.todayContent.lessonProgress * 100)}%
              </Text>
            </View>
            <ProgressBar progress={mockData.todayContent.lessonProgress} style={styles.progressBar} />
            <TouchableOpacity style={styles.continueBtn} onPress={() => router.push('/(tabs)/programme')}>
              <Text style={styles.continueBtnText}>Continuer →</Text>
            </TouchableOpacity>
          </Card>

          {/* ── Raccourcis ─────────────────────────────────── */}
          <View style={styles.shortcuts}>
            {/* Prince Johann IA */}
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/coach')}
            >
              <Text style={styles.shortcutIcon}>💬</Text>
              <Text style={styles.shortcutTitle}>Prince Johann IA</Text>
              <Text style={styles.shortcutSub}>{mockData.remainingMessages} messages restants</Text>
            </TouchableOpacity>

            {/* Journal */}
            <TouchableOpacity style={styles.shortcutCard}>
              <Text style={styles.shortcutIcon}>📝</Text>
              <Text style={styles.shortcutTitle}>Mon journal</Text>
              <Text style={styles.shortcutSub}>Écrire aujourd'hui</Text>
            </TouchableOpacity>

            {/* Programme */}
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/bibliotheque')}
            >
              <Text style={styles.shortcutIcon}>📚</Text>
              <Text style={styles.shortcutTitle}>Bibliothèque</Text>
              <Text style={styles.shortcutSub}>Tes ressources</Text>
            </TouchableOpacity>
          </View>

          {/* ── Progression globale ────────────────────────── */}
          <Card style={styles.progressCard}>
            <View style={styles.progressGlobalRow}>
              <Text style={styles.progressGlobalTitle}>Progression programme</Text>
              <Text style={styles.progressGlobalPct}>Semaine 8/52</Text>
            </View>
            <ProgressBar progress={mockData.weekProgress} height={6} style={{ marginTop: Spacing.sm }} />
          </Card>

          {/* ── Citation du Code ───────────────────────────── */}
          <Card style={styles.quoteCard} variant="bordered">
            <Text style={styles.quoteLabel}>CITATION DU CODE</Text>
            <Text style={styles.quoteText}>"{mockData.quote.text}"</Text>
            <Text style={styles.quoteSource}>— {mockData.quote.source}</Text>
          </Card>

          <View style={{ height: Spacing['3xl'] }} />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  greeting: { ...Typography.h3, color: Colors.text.primary },
  date: { ...Typography.body, color: Colors.text.secondary, marginTop: 2 },
  avatarBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1.5, borderColor: Colors.brand.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.h4, color: Colors.brand.gold },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  sectionTitle: {
    ...Typography.label,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },

  // Streak
  streakCard: { marginBottom: 0 },
  streakTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  streakIcon: { fontSize: 28, marginRight: Spacing.sm },
  streakNumber: { ...Typography.number, color: Colors.brand.gold, marginRight: Spacing.sm },
  streakLabel: { ...Typography.bodyLarge, color: Colors.text.secondary },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayItem: { alignItems: 'center', gap: 4 },
  dayCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.background.tertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: Colors.brand.gold },
  dayDot: { fontSize: 14, color: Colors.text.muted },
  dayDotActive: { color: Colors.text.inverse },
  dayLabel: { ...Typography.caption, color: Colors.text.muted },

  // Contenu du jour
  contentCard: { marginBottom: 0 },
  contentBadge: { marginBottom: Spacing.sm },
  contentWeek: { ...Typography.caption, color: Colors.text.muted, marginBottom: Spacing.xs },
  contentTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.base },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  progressLabel: { ...Typography.bodySmall, color: Colors.text.secondary },
  progressPct: { ...Typography.bodySmall, color: Colors.brand.gold },
  progressBar: { marginBottom: Spacing.base },
  continueBtn: {
    backgroundColor: Colors.brand.gold,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  continueBtnText: { ...Typography.button, color: Colors.text.inverse },

  // Raccourcis
  shortcuts: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginBottom: 0,
  },
  shortcutCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  shortcutIcon: { fontSize: 22, marginBottom: Spacing.xs },
  shortcutTitle: { ...Typography.bodySmall, color: Colors.text.primary, fontWeight: '600', marginBottom: 2 },
  shortcutSub: { ...Typography.caption, color: Colors.text.muted },

  // Progression globale
  progressCard: { marginTop: Spacing.xl },
  progressGlobalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressGlobalTitle: { ...Typography.body, color: Colors.text.secondary, fontWeight: '600' },
  progressGlobalPct: { ...Typography.body, color: Colors.brand.gold, fontWeight: '600' },

  // Citation
  quoteCard: { marginTop: Spacing.base, padding: Spacing.lg },
  quoteLabel: { ...Typography.labelSmall, color: Colors.brand.gold, marginBottom: Spacing.md },
  quoteText: { ...Typography.quote, color: Colors.text.primary, marginBottom: Spacing.sm },
  quoteSource: { ...Typography.caption, color: Colors.text.muted },
});
