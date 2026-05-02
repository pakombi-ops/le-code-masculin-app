import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { ProgressBar, Badge } from '../../components/ui';
import { PILLARS, PHASES, type Pillar, type PillarPhase } from '../../constants/pillars';
import { getPillarProgress } from '../../constants/lessons';

type MockStatus = 'completed' | 'active' | 'locked';

const MOCK_STATUS: Record<number, MockStatus> = {
  1: 'completed', 2: 'active',
  3: 'locked', 4: 'locked', 5: 'locked', 6: 'locked',
  7: 'locked', 8: 'locked', 9: 'locked', 10: 'locked',
  11: 'locked', 12: 'locked',
};

export default function ProgrammeScreen() {
  const phases: PillarPhase[] = ['fondation', 'identite', 'impact'];

  const handlePillar = (pillar: Pillar) => {
    const status = MOCK_STATUS[pillar.id] ?? 'locked';
    if (status === 'locked') return;
    router.push({ pathname: '/pilier', params: { pillarId: String(pillar.id) } });
  };

  const renderPillarCard = (pillar: Pillar) => {
    const status = MOCK_STATUS[pillar.id] ?? 'locked';
    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';
    const isActive = status === 'active';
    const { completed, total } = getPillarProgress(pillar.id);
    const progress = total > 0 ? completed / total : 0;

    return (
      <TouchableOpacity
        key={pillar.id}
        style={[styles.pillarCard, isLocked && styles.pillarCardLocked, isActive && styles.pillarCardActive]}
        onPress={() => handlePillar(pillar)}
        disabled={isLocked}
        activeOpacity={0.8}
      >
        {/* Numéro */}
        <View style={[styles.pillarIconBg, { borderColor: isLocked ? Colors.border.default : pillar.color }]}>
          <Text style={[styles.pillarNum, { color: isLocked ? Colors.text.muted : pillar.color }]}>
            {pillar.id}
          </Text>
        </View>

        {/* Infos */}
        <View style={styles.pillarInfo}>
          <Text style={[styles.pillarName, isLocked && styles.textMuted]}>{pillar.name}</Text>
          <Text style={styles.pillarTagline} numberOfLines={1}>
            {isLocked ? `Semaines ${pillar.phaseWeeks.start}–${pillar.phaseWeeks.end}` : pillar.tagline}
          </Text>
          {isActive && total > 0 && (
            <ProgressBar progress={progress} height={3} color={pillar.color} style={styles.lessonProgress} />
          )}
        </View>

        {/* Badge */}
        <View style={styles.pillarBadge}>
          {isCompleted && <Badge label="✓ COMPLÉTÉ" variant="completed" />}
          {isActive && <Badge label="EN COURS" variant="active" />}
          {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Programme</Text>
          <View style={styles.globalProgress}>
            <Text style={styles.progressLabel}>Semaine 8 / 52</Text>
            <ProgressBar progress={8 / 52} height={4} style={{ marginTop: Spacing.xs }} />
          </View>
        </View>

        <View style={styles.content}>
          {phases.map(phaseKey => {
            const phase = PHASES[phaseKey];
            const phasePillars = PILLARS.filter(p => phase.pillars.includes(p.id));

            return (
              <View key={phaseKey} style={styles.phaseSection}>
                <View style={[styles.phaseHeader, { borderLeftColor: phase.color }]}>
                  <View>
                    <Text style={[styles.phaseLabel, { color: phase.color }]}>{phase.label}</Text>
                    <Text style={styles.phaseSubtitle}>{phase.subtitle}</Text>
                  </View>
                  {phaseKey !== 'fondation' && <Badge label="À VENIR" variant="locked" />}
                </View>
                <View style={styles.pillarsList}>
                  {phasePillars.map(renderPillarCard)}
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  headerTitle: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing.md },
  globalProgress: {},
  progressLabel: { ...Typography.label, color: Colors.text.secondary },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  phaseSection: { marginBottom: Spacing['2xl'] },
  phaseHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 3, paddingLeft: Spacing.md, marginBottom: Spacing.base,
  },
  phaseLabel: { ...Typography.label, fontSize: 14 },
  phaseSubtitle: { ...Typography.bodySmall, color: Colors.text.muted, marginTop: 2 },
  pillarsList: { gap: Spacing.sm },
  pillarCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg, padding: Spacing.base,
    borderWidth: 1, borderColor: Colors.border.default,
    gap: Spacing.md,
  },
  pillarCardActive: { borderColor: Colors.brand.gold, borderWidth: 1.5 },
  pillarCardLocked: { opacity: 0.55 },
  pillarIconBg: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background.tertiary,
  },
  pillarNum: { ...Typography.h4 },
  pillarInfo: { flex: 1 },
  pillarName: { ...Typography.h4, color: Colors.text.primary },
  pillarTagline: { ...Typography.bodySmall, color: Colors.text.secondary, marginTop: 2 },
  lessonProgress: { marginTop: Spacing.xs },
  pillarBadge: { alignItems: 'flex-end' },
  textMuted: { color: Colors.text.muted },
  lockIcon: { fontSize: 16, opacity: 0.6 },
});
