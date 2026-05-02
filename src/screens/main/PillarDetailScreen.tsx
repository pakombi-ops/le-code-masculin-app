/**
 * PILLAR DETAIL SCREEN
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp, RouteProp } from '@react-navigation/stack';
import type { ProgrammeStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { Badge, ProgressBar } from '../../components/ui/Components';
import SafeScreen from '../../components/layout/SafeScreen';
import { useAppStore } from '../../store/useAppStore';

type Nav = StackNavigationProp<ProgrammeStackParamList, 'PillarDetail'>;
type Route = RouteProp<ProgrammeStackParamList, 'PillarDetail'>;

const DEMO_LESSONS = [
  { id: 'l1', title: 'Ton corps, ton premier domaine', duration: '18 min', status: 'completed' as const, type: 'video' as const },
  { id: 'l2', title: "Construire l'identité disciplinée", duration: '22 min', status: 'completed' as const, type: 'video' as const },
  { id: 'l3', title: 'Le protocole matinal', duration: '15 min', status: 'in_progress' as const, type: 'video' as const },
  { id: 'l4', title: 'Tenir ses engagements publics', duration: '20 min', status: 'locked' as const, type: 'video' as const },
  { id: 'l5', title: 'La discipline émotionnelle', duration: '25 min', status: 'locked' as const, type: 'audio' as const },
  { id: 'l6', title: 'Semaine de consolidation', duration: '10 min', status: 'locked' as const, type: 'reading' as const },
];

const TABS = ['Leçons', 'Exercices', 'Ressources'];

export default function PillarDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { pillars } = useAppStore();
  const [activeTab, setActiveTab] = useState(0);

  const pillar = pillars.find((p) => p.id === route.params.pillarId);
  if (!pillar) return null;

  const typeIcon = (type: string) => ({
    video: '▶', audio: '🎵', reading: '📄', exercise: '✍',
  }[type] ?? '▶');

  const statusColor = (status: string) => ({
    completed: Colors.semantic.success,
    in_progress: Colors.gold.primary,
    locked: Colors.text.tertiary,
    available: Colors.text.secondary,
  }[status] ?? Colors.text.tertiary);

  return (
    <SafeScreen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Programme</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={[styles.hero, { borderColor: pillar.color }]}>
          <View style={[styles.pillarIconCircle, { backgroundColor: pillar.color + '22', borderColor: pillar.color + '66' }]}>
            <Text style={[styles.pillarIconNumber, { color: pillar.color }]}>{pillar.id}</Text>
          </View>
          <Badge label={`PILIER ${pillar.id}`} />
          <Text style={styles.pillarName}>{pillar.name}</Text>
          <Text style={styles.pillarTagline}>{pillar.tagline}</Text>

          <View style={styles.heroStats}>
            <Text style={styles.stat}>4 semaines</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.stat}>16 leçons</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={[styles.stat, { color: Colors.gold.primary }]}>
              {pillar.progress}% complété
            </Text>
          </View>
          <ProgressBar progress={pillar.progress} height={6} color={pillar.color} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === idx && styles.tabActive]}
              onPress={() => setActiveTab(idx)}
            >
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leçons */}
        {activeTab === 0 && (
          <View style={styles.lessons}>
            {DEMO_LESSONS.map((lesson, idx) => (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonRow,
                  lesson.status === 'in_progress' && styles.lessonRowActive,
                  lesson.status === 'locked' && styles.lessonRowLocked,
                ]}
                onPress={() =>
                  lesson.status !== 'locked' &&
                  navigation.navigate('LessonPlayer', { lessonId: lesson.id, moduleId: pillar.id })
                }
                activeOpacity={lesson.status === 'locked' ? 1 : 0.8}
              >
                <View style={[styles.lessonIcon, { borderColor: statusColor(lesson.status) }]}>
                  <Text style={[styles.lessonIconText, { color: statusColor(lesson.status) }]}>
                    {lesson.status === 'completed' ? '✓' : lesson.status === 'locked' ? '🔒' : typeIcon(lesson.type)}
                  </Text>
                </View>
                <View style={styles.lessonInfo}>
                  <Text
                    style={[
                      styles.lessonTitle,
                      lesson.status === 'locked' && styles.lessonTitleLocked,
                    ]}
                    numberOfLines={1}
                  >
                    {lesson.title}
                  </Text>
                  <Text style={styles.lessonMeta}>{lesson.duration}</Text>
                </View>
                {lesson.status === 'in_progress' && (
                  <Text style={styles.continueBtn}>Reprendre</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Exercices tab (placeholder) */}
        {activeTab === 1 && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Les exercices pratiques seront affichés ici — défi hebdomadaire, journal de bord et visualisations.
            </Text>
          </View>
        )}

        {/* Ressources tab (placeholder) */}
        {activeTab === 2 && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              PDF résumé, audio guidé et ressources complémentaires pour ce pilier.
            </Text>
          </View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeScreen>
  );
}

// ─────────────────────────────────────────
// LESSON PLAYER SCREEN
// ─────────────────────────────────────────
import type { RouteProp as RNRouteProp } from '@react-navigation/native';
type LessonRoute = RNRouteProp<ProgrammeStackParamList, 'LessonPlayer'>;

export function LessonPlayerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<LessonRoute>();
  const [activeTab, setActiveTab] = useState(0);

  const LESSON_TABS = ['Résumé', 'Exercice', 'Notes'];

  return (
    <SafeScreen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Leçon 3/4</Text>
        </TouchableOpacity>

        {/* Video player area */}
        <View style={playerStyles.videoContainer}>
          <View style={playerStyles.videoPlaceholder}>
            <Text style={playerStyles.playBtn}>▶</Text>
            <Text style={playerStyles.videoTitle}>Le protocole matinal</Text>
          </View>

          {/* Scrubber */}
          <View style={playerStyles.controls}>
            <Text style={playerStyles.timeText}>7:23</Text>
            <View style={playerStyles.scrubberTrack}>
              <View style={playerStyles.scrubberFill} />
              <View style={playerStyles.scrubberThumb} />
            </View>
            <Text style={playerStyles.timeText}>15:41</Text>
          </View>

          <View style={playerStyles.controlBtns}>
            <TouchableOpacity><Text style={playerStyles.controlBtn}>⟨⟨ 15</Text></TouchableOpacity>
            <TouchableOpacity style={playerStyles.pauseBtn}>
              <Text style={playerStyles.pauseIcon}>⏸</Text>
            </TouchableOpacity>
            <TouchableOpacity><Text style={playerStyles.controlBtn}>15 ⟩⟩</Text></TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={playerStyles.info}>
          <Text style={playerStyles.lessonTitle}>Le protocole matinal</Text>
          <View style={playerStyles.meta}>
            <Badge label="PILIER 2 · DISCIPLINE" />
            <Text style={playerStyles.metaText}>Semaine 6</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {LESSON_TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === idx && styles.tabActive]}
              onPress={() => setActiveTab(idx)}
            >
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 0 && (
          <View style={playerStyles.content}>
            <Text style={playerStyles.contentBody}>
              Dans cette leçon, tu vas construire un protocole matinal sur mesure — 3 à 5 pratiques à enchaîner chaque matin avant de regarder ton téléphone ou d'interagir avec le monde.{'\n\n'}
              Le matin est le seul moment de la journée où tu contrôles totalement ton environnement. Utilise-le.
            </Text>
          </View>
        )}

        {activeTab === 1 && (
          <View style={playerStyles.exerciseCard}>
            <Text style={playerStyles.exerciseTitle}>Défi de la semaine</Text>
            <Text style={playerStyles.exerciseBody}>
              Définis ton rituel matinal en 3 étapes et applique-le 7 jours de suite. Note tes observations chaque soir dans ton journal.
            </Text>
            <TouchableOpacity style={playerStyles.markDone}>
              <Text style={playerStyles.markDoneText}>✓ Marquer comme fait</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 2 && (
          <View style={playerStyles.notes}>
            <Text style={playerStyles.notesPlaceholder}>
              Tes notes personnelles sur cette leçon...
            </Text>
          </View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.lg, gap: Spacing.lg },
  back: { alignSelf: 'flex-start', paddingBottom: Spacing.sm },
  backText: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  hero: {
    alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.xl, padding: Spacing.xl,
    borderWidth: 1,
  },
  pillarIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  pillarIconNumber: { fontSize: 28, fontWeight: Typography.weight.bold },
  pillarName: { ...Typography.styles.displayMedium, textAlign: 'center' },
  pillarTagline: { ...Typography.styles.body, textAlign: 'center', color: Colors.text.secondary },
  heroStats: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  stat: { ...Typography.styles.caption, color: Colors.text.secondary },
  statDot: { color: Colors.text.tertiary },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radii.sm },
  tabActive: { backgroundColor: Colors.background.tertiary },
  tabText: { ...Typography.styles.caption, color: Colors.text.tertiary, fontWeight: Typography.weight.medium },
  tabTextActive: { color: Colors.text.primary },
  lessons: { gap: Spacing.sm },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.md, padding: Spacing.base,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  lessonRowActive: { borderColor: Colors.gold.border },
  lessonRowLocked: { opacity: 0.5 },
  lessonIcon: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  lessonIconText: { fontSize: 16 },
  lessonInfo: { flex: 1, gap: Spacing.xs },
  lessonTitle: { ...Typography.styles.bodyBold },
  lessonTitleLocked: { color: Colors.text.tertiary },
  lessonMeta: { ...Typography.styles.caption, color: Colors.text.tertiary },
  continueBtn: {
    color: Colors.gold.primary, fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    borderWidth: 1, borderColor: Colors.gold.border,
    borderRadius: Radii.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  placeholder: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.lg, padding: Spacing.xl, alignItems: 'center',
  },
  placeholderText: { ...Typography.styles.body, textAlign: 'center', color: Colors.text.secondary },
});

const playerStyles = StyleSheet.create({
  videoContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.xl, overflow: 'hidden', gap: 0,
  },
  videoPlaceholder: {
    height: 200, backgroundColor: '#0A0A18',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
  },
  playBtn: { fontSize: 40, color: Colors.gold.primary },
  videoTitle: { ...Typography.styles.caption, color: Colors.text.secondary },
  controls: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.base,
  },
  timeText: { ...Typography.styles.caption, color: Colors.text.tertiary, minWidth: 36 },
  scrubberTrack: {
    flex: 1, height: 4, backgroundColor: Colors.background.tertiary,
    borderRadius: 2, overflow: 'visible',
  },
  scrubberFill: { width: '48%', height: 4, backgroundColor: Colors.gold.primary, borderRadius: 2 },
  scrubberThumb: {
    position: 'absolute', left: '48%', top: -5,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.gold.primary,
  },
  controlBtns: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: Spacing['2xl'], padding: Spacing.base, paddingTop: 0,
  },
  controlBtn: { color: Colors.text.secondary, fontSize: Typography.size.sm },
  pauseBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gold.subtle,
    borderWidth: 1, borderColor: Colors.gold.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pauseIcon: { fontSize: 20, color: Colors.gold.primary },
  info: { gap: Spacing.md },
  lessonTitle: { ...Typography.styles.heading2 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { ...Typography.styles.caption, color: Colors.text.tertiary },
  content: { backgroundColor: Colors.background.secondary, borderRadius: Radii.lg, padding: Spacing.base },
  contentBody: { ...Typography.styles.body, lineHeight: 24 },
  exerciseCard: {
    backgroundColor: Colors.gold.subtle, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.gold.border, padding: Spacing.base, gap: Spacing.md,
  },
  exerciseTitle: { ...Typography.styles.heading3, color: Colors.gold.primary },
  exerciseBody: { ...Typography.styles.body, color: Colors.text.secondary },
  markDone: {
    borderWidth: 1, borderColor: Colors.gold.border, borderRadius: Radii.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  markDoneText: { color: Colors.gold.primary, fontWeight: Typography.weight.semibold },
  notes: {
    backgroundColor: Colors.background.secondary, borderRadius: Radii.lg,
    padding: Spacing.base, minHeight: 160,
  },
  notesPlaceholder: { ...Typography.styles.body, color: Colors.text.tertiary, fontStyle: 'italic' },
});
