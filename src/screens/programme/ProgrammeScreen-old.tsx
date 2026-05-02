import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Card, Badge, ProgressBar } from '../../components/ui';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { PILLARS, PHASES, type Pillar, type PillarPhase } from '../../constants/pillars';

type MockPillarStatus = 'completed' | 'active' | 'locked';

// Données simulées de progression
const MOCK_PROGRESS: Record<number, { status: MockPillarStatus; progress: number }> = {
  1: { status: 'completed', progress: 1 },
  2: { status: 'active', progress: 0.65 },
  7: { status: 'locked', progress: 0 },
  8: { status: 'locked', progress: 0 },
  3: { status: 'locked', progress: 0 },
  5: { status: 'locked', progress: 0 },
  6: { status: 'locked', progress: 0 },
  11: { status: 'locked', progress: 0 },
  4: { status: 'locked', progress: 0 },
  9: { status: 'locked', progress: 0 },
  10: { status: 'locked', progress: 0 },
  12: { status: 'locked', progress: 0 },
};

/**
 * SCREEN 10 — Programme (12 Piliers vue liste)
 */
export default function ProgrammeScreen() {
  const phases: PillarPhase[] = ['fondation', 'identite', 'impact'];

  const renderPillarCard = (pillar: Pillar) => {
    const progress = MOCK_PROGRESS[pillar.id] ?? { status: 'locked' as MockPillarStatus, progress: 0 };
    const isLocked = progress.status === 'locked';
    const isCompleted = progress.status === 'completed';
    const isActive = progress.status === 'active';

    return (
      <TouchableOpacity
        key={pillar.id}
        style={[styles.pillarCard, isLocked && styles.pillarCardLocked]}
        disabled={isLocked}
        activeOpacity={0.8}
      >
        {/* Numéro + icône */}
        <View style={[styles.pillarIconBg, { borderColor: isLocked ? Colors.border.default : pillar.color }]}>
          <Text style={[styles.pillarNum, { color: isLocked ? Colors.text.muted : pillar.color }]}>
            {pillar.id}
          </Text>
        </View>

        {/* Contenu */}
        <View style={styles.pillarInfo}>
          <Text style={[styles.pillarName, isLocked && styles.textMuted]}>
            {pillar.name}
          </Text>
          <Text style={styles.pillarTagline} numberOfLines={1}>
            {isLocked ? `${pillar.phaseWeeks.start}–${pillar.phaseWeeks.end} semaines` : pillar.tagline}
          </Text>
          {isActive && (
            <ProgressBar
              progress={progress.progress}
              height={3}
              style={{ marginTop: Spacing.sm }}
            />
          )}
        </View>

        {/* Badge statut */}
        <View style={styles.pillarStatus}>
          {isCompleted && <Badge label="✓ COMPLÉTÉ" variant="completed" />}
          {isActive && <Badge label="EN COURS" variant="active" />}
          {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeScreen edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── En-tête ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Programme</Text>
          <View style={styles.globalProgress}>
            <Text style={styles.progressLabel}>Semaine 8 / 52</Text>
            <ProgressBar progress={8 / 52} height={4} style={{ marginTop: Spacing.xs }} />
          </View>
        </View>

        <View style={styles.content}>
          {phases.map((phaseKey) => {
            const phase = PHASES[phaseKey];
            const phasePillars = PILLARS.filter((p) => phase.pillars.includes(p.id));
            const isPhaseActive = phaseKey === 'fondation';
            const isPhaseUpcoming = phaseKey !== 'fondation';

            return (
              <View key={phaseKey} style={styles.phaseSection}>
                {/* En-tête de phase */}
                <View style={[styles.phaseHeader, { borderLeftColor: phase.color }]}>
                  <View>
                    <Text style={[styles.phaseLabel, { color: phase.color }]}>
                      {phase.label}
                    </Text>
                    <Text style={styles.phaseSubtitle}>{phase.subtitle}</Text>
                  </View>
                  {isPhaseUpcoming && (
                    <Badge label="À VENIR" variant="locked" />
                  )}
                </View>

                {/* Cartes des piliers */}
                <View style={styles.pillarsList}>
                  {phasePillars.map(renderPillarCard)}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
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
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1, borderColor: Colors.border.default,
    gap: Spacing.md,
  },
  pillarCardLocked: { opacity: 0.55 },
  pillarIconBg: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background.tertiary,
  },
  pillarNum: { ...Typography.h4 },
  pillarInfo: { flex: 1 },
  pillarName: { ...Typography.h4, color: Colors.text.primary },
  pillarTagline: { ...Typography.bodySmall, color: Colors.text.secondary, marginTop: 2 },
  pillarStatus: { alignItems: 'flex-end' },
  textMuted: { color: Colors.text.muted },
  lockIcon: { fontSize: 16, opacity: 0.6 },
});
