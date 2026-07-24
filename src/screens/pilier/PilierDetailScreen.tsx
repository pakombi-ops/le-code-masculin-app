import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { ProgressBar } from '../../components/ui';
import { getPillarById, PHASES } from '../../constants/pillars';
import { getWeeksForPillar, formatDuration, type Lesson, type Week, type LessonStatus } from '../../constants/lessons';
import { getCompletedLessonIds, getLessonStatus, getPillarProgressReal } from '../../constants/progression';
import { useAuthStore } from '../../store/authStore';

export default function PilierDetailScreen() {
  const { pillarId } = useLocalSearchParams<{ pillarId: string }>();
  const id = parseInt(pillarId ?? '1');
  const pillar = getPillarById(id);
  const weeks = getWeeksForPillar(id);
  const [activeTab, setActiveTab] = useState<'lecons' | 'apercu'>('lecons');
  const { user, userProgress, loadUserProgress } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadUserProgress(user.id);
    }, [user?.id])
  );

  const completedIds = getCompletedLessonIds(userProgress);
  const { completed, total } = getPillarProgressReal(id, completedIds);

  if (!pillar) return null;

  const phaseColor = PHASES[pillar.phase]?.color ?? Colors.brand.gold;

  const statusIcon = (status: LessonStatus) => {
    if (status === 'completed') return '✓';
    if (status === 'active') return '▶';
    return '🔒';
  };

  const statusStyle = (status: LessonStatus) => {
    if (status === 'completed') return styles.iconCompleted;
    if (status === 'active') return styles.iconActive;
    return styles.iconLocked;
  };

  const handleLesson = (lesson: Lesson, status: LessonStatus) => {
    if (status === 'locked') return;
    router.push({ pathname: '/lecon', params: { lessonId: lesson.id } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={[styles.pillarIconBg, { borderColor: phaseColor }]}>
          <Text style={[styles.pillarNum, { color: phaseColor }]}>{pillar.id}</Text>
        </View>

        <Text style={styles.pillarLabel}>PILIER {pillar.id}</Text>
        <Text style={styles.pillarName}>{pillar.name}</Text>
        <Text style={styles.pillarTagline}>{pillar.tagline}</Text>

        <View style={styles.progressArea}>
          <View style={styles.progressMeta}>
            <Text style={styles.progressTxt}>
              {weeks.length} semaine{weeks.length > 1 ? 's' : ''} · {total} leçons · {completed} complétées
            </Text>
            <Text style={[styles.progressPct, { color: phaseColor }]}>
              {total > 0 ? Math.round((completed / total) * 100) : 0}%
            </Text>
          </View>
          <ProgressBar progress={total > 0 ? completed / total : 0} color={phaseColor} height={5} />
        </View>
      </View>

      <View style={styles.tabs}>
        {(['lecons', 'apercu'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabTxt, activeTab === tab && styles.tabTxtActive]}>
              {tab === 'lecons' ? 'Leçons' : 'Aperçu'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {activeTab === 'lecons' && (
          <View style={styles.content}>
            {weeks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyTitle}>Contenu en cours de préparation</Text>
                <Text style={styles.emptyTxt}>
                  Les leçons de ce pilier seront disponibles quand tu l'atteins dans le programme.
                </Text>
              </View>
            ) : (
              weeks.map((week: Week) => (
                <View key={week.number} style={styles.weekSection}>
                  <View style={styles.weekHeader}>
                    <View style={[styles.weekLine, { backgroundColor: phaseColor }]} />
                    <Text style={styles.weekLabel}>SEMAINE {week.number}</Text>
                    <Text style={styles.weekTitle}>{week.title}</Text>
                  </View>

                  <View style={styles.lessonsList}>
                    {week.lessons.map((lesson: Lesson) => {
                      const status = getLessonStatus(lesson, completedIds, userProgress);
                      return (
                        <TouchableOpacity
                          key={lesson.id}
                          style={[
                            styles.lessonRow,
                            status === 'active' && styles.lessonRowActive,
                            status === 'locked' && styles.lessonRowLocked,
                          ]}
                          onPress={() => handleLesson(lesson, status)}
                          activeOpacity={status === 'locked' ? 1 : 0.8}
                        >
                          <View style={[styles.lessonIcon, statusStyle(status)]}>
                            <Text style={styles.lessonIconTxt}>{statusIcon(status)}</Text>
                          </View>

                          <View style={styles.lessonInfo}>
                            <Text
                              style={[styles.lessonTitle, status === 'locked' && styles.lessonTitleLocked]}
                              numberOfLines={2}
                            >
                              {lesson.title}
                            </Text>
                            <View style={styles.lessonMeta}>
                              <Text style={styles.lessonType}>
                                {lesson.type === 'audio' ? '🎧' : '▶️'} {lesson.type}
                              </Text>
                              <Text style={styles.lessonDuration}>{formatDuration(lesson.duration)}</Text>
                            </View>
                          </View>

                          {status === 'active' && (
                            <View style={[styles.ctaPill, { backgroundColor: phaseColor }]}>
                              <Text style={styles.ctaPillTxt}>Reprendre</Text>
                            </View>
                          )}
                          {status === 'completed' && <Text style={styles.completedCheck}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 40 }} />
          </View>
        )}

        {activeTab === 'apercu' && (
          <View style={styles.content}>
            <View style={styles.apercuCard}>
              <Text style={styles.apercuLabel}>PHILOSOPHIE DU PILIER</Text>
              <Text style={styles.apercuText}>{pillar.description}</Text>
            </View>

            <View style={styles.apercuCard}>
              <Text style={styles.apercuLabel}>PHASE</Text>
              <View style={[styles.phaseBadge, { borderColor: phaseColor }]}>
                <Text style={[styles.phaseTxt, { color: phaseColor }]}>
                  {PHASES[pillar.phase].label} — {PHASES[pillar.phase].subtitle}
                </Text>
              </View>
            </View>

            <View style={styles.apercuCard}>
              <Text style={styles.apercuLabel}>CE QUE TU VAS DÉVELOPPER</Text>
              {[
                'Une compréhension profonde de ce pilier',
                'Des défis concrets à appliquer chaque semaine',
                'Des outils pour mesurer ta progression',
                'Un ancrage durable dans ton identité',
              ].map((item, i) => (
                <View key={i} style={styles.apercuRow}>
                  <Text style={[styles.apercuBullet, { color: phaseColor }]}>▸</Text>
                  <Text style={styles.apercuItem}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { backgroundColor: Colors.background.secondary, paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  backBtn: { position: 'absolute', top: 56, left: Spacing.xl, padding: Spacing.sm },
  backArrow: { fontSize: 24, color: Colors.brand.gold },
  pillarIconBg: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.primary, marginBottom: Spacing.md },
  pillarNum: { ...Typography.h2 },
  pillarLabel: { ...Typography.labelSmall, color: Colors.text.muted, letterSpacing: 4, marginBottom: Spacing.xs },
  pillarName: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing.xs },
  pillarTagline: { ...Typography.body, color: Colors.text.secondary, fontStyle: 'italic', textAlign: 'center', marginBottom: Spacing.xl },
  progressArea: { width: '100%' },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  progressTxt: { ...Typography.bodySmall, color: Colors.text.secondary },
  progressPct: { ...Typography.bodySmall, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  tab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.brand.gold },
  tabTxt: { ...Typography.label, color: Colors.text.muted },
  tabTxtActive: { color: Colors.brand.gold },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  weekSection: { marginBottom: Spacing['2xl'] },
  weekHeader: { marginBottom: Spacing.md },
  weekLine: { width: 3, height: 16, borderRadius: 2, marginBottom: Spacing.xs },
  weekLabel: { ...Typography.labelSmall, color: Colors.text.muted, letterSpacing: 3, marginBottom: 2 },
  weekTitle: { ...Typography.h4, color: Colors.text.primary },
  lessonsList: { gap: Spacing.sm },
  lessonRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.md, gap: Spacing.md },
  lessonRowActive: { borderColor: Colors.brand.gold, borderWidth: 1.5, backgroundColor: Colors.background.tertiary },
  lessonRowLocked: { opacity: 0.55 },
  lessonIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconCompleted: { backgroundColor: Colors.status.successBg },
  iconActive: { backgroundColor: Colors.brand.gold },
  iconLocked: { backgroundColor: Colors.background.tertiary, borderWidth: 1, borderColor: Colors.border.default },
  lessonIconTxt: { fontSize: 14, color: Colors.text.primary },
  lessonInfo: { flex: 1 },
  lessonTitle: { ...Typography.body, color: Colors.text.primary, fontWeight: '600', marginBottom: 4 },
  lessonTitleLocked: { color: Colors.text.muted },
  lessonMeta: { flexDirection: 'row', gap: Spacing.md },
  lessonType: { ...Typography.caption, color: Colors.text.muted },
  lessonDuration: { ...Typography.caption, color: Colors.text.muted },
  ctaPill: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, flexShrink: 0 },
  ctaPillTxt: { ...Typography.caption, color: Colors.text.inverse, fontWeight: '700' },
  completedCheck: { fontSize: 16, color: Colors.status.success },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.h4, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.sm },
  emptyTxt: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', lineHeight: 24 },
  apercuCard: { backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.base, marginBottom: Spacing.base },
  apercuLabel: { ...Typography.labelSmall, color: Colors.brand.gold, marginBottom: Spacing.sm },
  apercuText: { ...Typography.body, color: Colors.text.secondary, lineHeight: 26 },
  phaseBadge: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, alignSelf: 'flex-start' },
  phaseTxt: { ...Typography.label },
  apercuRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  apercuBullet: { fontSize: 14, marginTop: 3 },
  apercuItem: { ...Typography.body, color: Colors.text.secondary, flex: 1, lineHeight: 24 },
});
