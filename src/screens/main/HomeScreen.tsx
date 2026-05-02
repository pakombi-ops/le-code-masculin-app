import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { Card, Badge, ProgressBar } from '../../components/ui/Components';
import SafeScreen from '../../components/layout/SafeScreen';
import { useAppStore } from '../../store/useAppStore';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function HomeScreen() {
  const { user, pillars, currentWeek } = useAppStore();
  const firstName = user?.firstName ?? 'Toi';
  const streak = user?.streak;
  const activePillar = pillars.find((p) => p.status === 'in_progress');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const todayDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const aiRemaining = user
    ? user.subscription.aiMessagesLimit - user.subscription.aiMessagesUsed
    : 0;

  return (
    <SafeScreen edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}, {firstName} 👋</Text>
            <Text style={styles.date}>{todayDate}</Text>
          </View>
          {/* Avatar */}
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{firstName[0]?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Streak Card */}
        <Card style={styles.streakCard} variant="gold">
          <View style={styles.streakTop}>
            <Text style={styles.streakFlame}>🔥</Text>
            <View>
              <Text style={styles.streakNumber}>{streak?.current ?? 0} jours de suite</Text>
              <Text style={styles.streakSub}>Record : {streak?.longest ?? 0} jours</Text>
            </View>
          </View>
          {/* Week view */}
          <View style={styles.weekRow}>
            {DAYS.map((day, idx) => {
              const active = streak?.weekActivity[idx] ?? false;
              const isToday = idx === (new Date().getDay() + 6) % 7;
              return (
                <View key={day} style={styles.dayContainer}>
                  <View style={[
                    styles.dayCircle,
                    active && styles.dayCircleActive,
                    isToday && !active && styles.dayCircleToday,
                  ]}>
                    {active && <Text style={styles.dayCheck}>✓</Text>}
                    {isToday && !active && <Text style={styles.dayDot}>·</Text>}
                  </View>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Contenu du jour */}
        {activePillar && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contenu du jour</Text>
            <Card style={styles.contentCard} onPress={() => {}}>
              <Badge label={`PILIER ${activePillar.id} · ${activePillar.name.toUpperCase()}`} />
              <Text style={styles.contentTitle} numberOfLines={2}>
                Semaine {currentWeek} : L'engagement comme identité
              </Text>
              <Text style={styles.contentSub}>Leçon 3/4 · 15 min</Text>
              <ProgressBar progress={activePillar.progress} style={styles.contentProgress} />
              <View style={styles.contentCta}>
                <Text style={styles.contentCtaText}>Continuer →</Text>
              </View>
            </Card>
          </View>
        )}

        {/* Quick access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accès rapide</Text>
          <View style={styles.quickRow}>
            <Card style={styles.quickCard} onPress={() => {}}>
              <Text style={styles.quickIcon}>◎</Text>
              <Text style={styles.quickLabel}>Prince Johann IA</Text>
              <Text style={styles.quickSub}>{aiRemaining} messages</Text>
            </Card>
            <Card style={styles.quickCard} onPress={() => {}}>
              <Text style={styles.quickIcon}>✍</Text>
              <Text style={styles.quickLabel}>Mon journal</Text>
              <Text style={styles.quickSub}>5 entrées</Text>
            </Card>
            <Card style={styles.quickCard} onPress={() => {}}>
              <Text style={styles.quickIcon}>≡</Text>
              <Text style={styles.quickLabel}>Bibliothèque</Text>
              <Text style={styles.quickSub}>3 ressources</Text>
            </Card>
          </View>
        </View>

        {/* Citation du jour */}
        <View style={styles.section}>
          <Card style={styles.quoteCard}>
            <Text style={styles.quoteLabel}>CITATION DU CODE</Text>
            <Text style={styles.quoteText}>
              "La discipline est la liberté que tu te donnes à toi-même."
            </Text>
            <Text style={styles.quoteAuthor}>— Le Code Masculin, Pilier 2</Text>
          </Card>
        </View>

        {/* Progression globale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progression globale</Text>
          <Card>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Semaine {currentWeek} / 52</Text>
              <Text style={styles.progressValue}>
                {Math.round((currentWeek / 52) * 100)}%
              </Text>
            </View>
            <ProgressBar progress={(currentWeek / 52) * 100} height={8} style={styles.globalProgress} />
            <View style={styles.phaseRow}>
              <Text style={styles.phaseLabel}>📍 Phase 1 — Fondation</Text>
              <Text style={styles.phaseWeeks}>Semaines 1–17</Text>
            </View>
          </Card>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.lg, gap: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { ...Typography.styles.heading2 },
  date: { ...Typography.styles.caption, color: Colors.text.tertiary, marginTop: Spacing.xs },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gold.subtle,
    borderWidth: 1.5, borderColor: Colors.gold.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: Colors.gold.primary, fontWeight: Typography.weight.bold, fontSize: Typography.size.md },

  streakCard: { gap: Spacing.base },
  streakTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  streakFlame: { fontSize: 32 },
  streakNumber: { ...Typography.styles.heading3 },
  streakSub: { ...Typography.styles.caption, color: Colors.text.tertiary },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  dayContainer: { alignItems: 'center', gap: Spacing.xs },
  dayCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.border.default,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: Colors.gold.primary, borderColor: Colors.gold.primary },
  dayCircleToday: { borderColor: Colors.gold.primary, borderWidth: 2 },
  dayCheck: { color: Colors.text.onGold, fontSize: 14, fontWeight: Typography.weight.bold },
  dayDot: { color: Colors.gold.primary, fontSize: 20 },
  dayLabel: { ...Typography.styles.caption, color: Colors.text.tertiary, fontSize: 10 },
  dayLabelToday: { color: Colors.gold.primary },

  section: { gap: Spacing.md },
  sectionTitle: { ...Typography.styles.heading3 },
  contentCard: { gap: Spacing.sm },
  contentTitle: { ...Typography.styles.heading3, lineHeight: 24 },
  contentSub: { ...Typography.styles.caption, color: Colors.text.tertiary },
  contentProgress: { marginTop: Spacing.xs },
  contentCta: { alignSelf: 'flex-end', marginTop: Spacing.xs },
  contentCtaText: { color: Colors.gold.primary, fontWeight: Typography.weight.semibold, fontSize: Typography.size.sm },

  quickRow: { flexDirection: 'row', gap: Spacing.md },
  quickCard: { flex: 1, alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.base },
  quickIcon: { fontSize: 24, color: Colors.gold.primary },
  quickLabel: { ...Typography.styles.caption, color: Colors.text.secondary, textAlign: 'center', fontWeight: Typography.weight.medium },
  quickSub: { ...Typography.styles.caption, color: Colors.text.tertiary, textAlign: 'center' },

  quoteCard: { borderLeftWidth: 3, borderLeftColor: Colors.gold.primary, gap: Spacing.sm },
  quoteLabel: { ...Typography.styles.label },
  quoteText: { ...Typography.styles.body, fontStyle: 'italic', color: Colors.text.primary, lineHeight: 24 },
  quoteAuthor: { ...Typography.styles.caption, color: Colors.gold.primary },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  progressLabel: { ...Typography.styles.bodyBold },
  progressValue: { color: Colors.gold.primary, fontWeight: Typography.weight.bold },
  globalProgress: { marginBottom: Spacing.md },
  phaseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phaseLabel: { ...Typography.styles.caption, color: Colors.text.secondary },
  phaseWeeks: { ...Typography.styles.caption, color: Colors.text.tertiary },
  bottomPad: { height: Spacing.xl },
});
