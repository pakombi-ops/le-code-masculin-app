import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, MessageCircle, PenLine, BookOpen, Compass, ChevronRight } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Card, Badge, ProgressBar } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { updateStreak, logDailyActivity, getWeekActivity, getLocalDateString } from '../../services/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getPillarById } from '../../constants/pillars';
import { getCompletedLessonIds, getCurrentActiveLesson, getDailyQuote, getOverallProgress, getNextUnlockDate, getLastCompletedLesson } from '../../constants/progression';
import { DailyCard } from '../../components/DailyCard';
import { DiscoverSection } from '../../components/DiscoverSection';

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, streak, aiQuota, isLoading, refreshStreak, userProgress } = useAuthStore();
  const [updating, setUpdating] = useState(false);
  const [weekActivityDates, setWeekActivityDates] = useState<string[]>([]);

  // Mettre à jour le streak + l'activité du jour à chaque ouverture du dashboard
  useEffect(() => {
    if (user?.id) {
      setUpdating(true);
      Promise.all([
        updateStreak(user.id),
        logDailyActivity(user.id),
      ])
        .then(() => Promise.all([
          refreshStreak(user.id),
          getWeekActivity(user.id),
        ]))
        .then(([, weekRes]) => {
          setWeekActivityDates(weekRes.data?.map((d: any) => d.activity_date) ?? []);
        })
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
  const completedIds = getCompletedLessonIds(userProgress);
  const currentLesson = getCurrentActiveLesson(completedIds, userProgress);
  const currentPillar = currentLesson ? getPillarById(currentLesson.pillarId) : null;
  const { completedWeeks, totalWeeks } = getOverallProgress(completedIds);
  const dailyQuote = getDailyQuote();
  const nextUnlock = !currentLesson ? getNextUnlockDate(completedIds, userProgress) : undefined;
  const lastCompleted = !currentLesson ? getLastCompletedLesson(completedIds, userProgress) : undefined;

  const daysUntilUnlock = nextUnlock
  ? Math.max(0, Math.ceil((nextUnlock.unlockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  : 0;

  // Générer les 7 jours de la semaine (lundi → dimanche) selon l'activité réelle
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayStr = getLocalDateString(d);
    return weekActivityDates.includes(dayStr);
  });

  if (isLoading) {
    return (
      <SafeScreen edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.brand.gold} size="large" />
          <Text style={styles.loadingTxt}>Chargement de ton Code...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour, {prenom}</Text>
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
          <Card style={styles.streakCard} variant="gold" onPress={() => router.push('/tracker')}>
            <View style={styles.streakTop}>
              <Flame size={28} color={Colors.brand.gold} fill={Colors.brand.gold} />
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

                  

          <View style={{ height: Spacing.lg }} />

          {/* Mandala — accès direct aux 3 piliers prioritaires */}
          <Card style={styles.mandalaCard} variant="bordered" onPress={() => router.push('/mandala')}>
            <View style={styles.mandalaRow}>
              <View style={styles.mandalaIconWrap}>
                <Compass size={22} color={Colors.brand.gold} />
              </View>
              <View style={styles.mandalaTextArea}>
                <Text style={styles.mandalaTitle}>Ton Mandala</Text>
                <Text style={styles.mandalaSub}>Tes 3 piliers prioritaires, un objectif chacun</Text>
              </View>
              <ChevronRight size={20} color={Colors.text.muted} />
            </View>
          </Card>

          <View style={{ height: Spacing.lg }} />
          <DailyCard />

                    
          {/* Contenu du jour */}
          <Text style={styles.sectionTitle}>Contenu du jour</Text>
        {currentLesson && currentPillar ? (
        <Card style={styles.contentCard} onPress={() => router.push('/(tabs)/programme')}>
        <Badge
          label={`PILIER ${currentPillar.id} · ${currentPillar.name.toUpperCase()}`}
          variant="active"
          style={styles.contentBadge}
        />
        <Text style={styles.contentWeek}>Semaine {currentLesson.weekNumber}</Text>
        <Text style={styles.contentTitle}>{currentLesson.title}</Text>
        <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => router.push({ pathname: '/lecon', params: { lessonId: currentLesson.id } })}
        >
        <Text style={styles.continueBtnText}>Continuer →</Text>
        </TouchableOpacity>
        </Card>
        ) : nextUnlock ? (
        <Card style={styles.contentCard}>
        <Text style={styles.contentWeek}>
        {lastCompleted ? `Dernière leçon : ${lastCompleted.title}` : 'Bien joué !'}
        </Text>
        <Text style={styles.contentTitle}>
        Prochaine leçon disponible dans {daysUntilUnlock} jour{daysUntilUnlock > 1 ? 's' : ''}
        </Text>
        <Text style={styles.contentWeek}>{nextUnlock.lesson.title}</Text>
        </Card>
        ) : (
  <Card style={styles.contentCard} onPress={() => router.push('/(tabs)/programme')}>
    <Text style={styles.contentTitle}>Aucune leçon active pour le moment</Text>
    <Text style={styles.contentWeek}>Reviens bientôt, ou consulte ton programme.</Text>
  </Card>
)}

          {/* Raccourcis */}
          <View style={styles.shortcuts}>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/coach')}
            >
              <MessageCircle size={22} color={Colors.brand.gold} style={styles.shortcutIcon} />
              <Text style={styles.shortcutTitle}>Prince Johann</Text>
              <Text style={styles.shortcutSub}>
                {isPremium ? 'Illimité ✦' : `${messagesRemaining} restants`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shortcutCard} onPress={() => router.push('/journal')}>
            <PenLine size={22} color={Colors.brand.gold} style={styles.shortcutIcon} />
            <Text style={styles.shortcutTitle}>Mon journal</Text>
            <Text style={styles.shortcutSub}>Écrire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/bibliotheque')}
            >
              <BookOpen size={22} color={Colors.brand.gold} style={styles.shortcutIcon} />
              <Text style={styles.shortcutTitle}>Bibliothèque</Text>
              <Text style={styles.shortcutSub}>Ressources</Text>
            </TouchableOpacity>
          </View>

          {/* Progression globale */}
          <Card style={styles.progressCard}>
          <View style={styles.progressGlobalRow}>
          <Text style={styles.progressGlobalTitle}>Progression programme</Text>
          <Text style={styles.progressGlobalPct}>Semaine {completedWeeks}/{totalWeeks}</Text>
          </View>
          <ProgressBar progress={completedWeeks / totalWeeks} height={6} style={{ marginTop: Spacing.sm }} />
          </Card>

          {/* Citation */}
          <Card style={styles.quoteCard} variant="bordered">
          <Text style={styles.quoteLabel}>CITATION DU CODE</Text>
          <Text style={styles.quoteText}>"{dailyQuote.text}"</Text>
          <Text style={styles.quoteSource}>— {dailyQuote.source}</Text>
          </Card>

          <DiscoverSection />

          {/* Dégagement dynamique : hauteur de la pill (68) + sa marge (16)
              + l'inset système réel de l'appareil + marge de respiration */}
          <View style={{ height: 68 + 16 + insets.bottom + 16 }} />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  loadingContainer: { flex: 1, backgroundColor: Colors.background.primary, alignItems: 'center', justifyContent: 'center', gap: Spacing.base },
  loadingTxt: { ...Typography.body, color: Colors.text.muted },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  greeting: { ...Typography.h3, color: Colors.text.primary },
  date: { ...Typography.body, color: Colors.text.secondary, marginTop: 2 },
  avatarBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.background.secondary, borderWidth: 1.5, borderColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.h4, color: Colors.brand.gold },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  sectionTitle: { ...Typography.label, color: Colors.text.secondary, marginBottom: Spacing.md, marginTop: Spacing.xl },
  streakCard: { marginBottom: 0 },
  streakTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.sm },
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
  mandalaCard: { marginBottom: 0, paddingVertical: Spacing.md },
  mandalaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mandalaIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  mandalaTextArea: { flex: 1 },
  mandalaTitle: { ...Typography.body, color: Colors.text.primary, fontWeight: '600', marginBottom: 2 },
  mandalaSub: { ...Typography.bodySmall, color: Colors.text.secondary },
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
  shortcutIcon: { marginBottom: Spacing.xs },
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