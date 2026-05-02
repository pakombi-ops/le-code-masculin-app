import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ProgrammeStackParamList, Pillar } from '../../types';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import { Badge, ProgressBar } from '../../components/ui/Components';
import SafeScreen from '../../components/layout/SafeScreen';
import { useAppStore } from '../../store/useAppStore';

type Nav = StackNavigationProp<ProgrammeStackParamList, 'ProgrammeHome'>;

const PHASES = [
  { key: 'fondation', label: 'FONDATION', weeks: 'Semaines 1–17', pillarIds: [1, 2, 7, 8] },
  { key: 'identite', label: 'IDENTITÉ', weeks: 'Semaines 18–34', pillarIds: [3, 5, 6, 11] },
  { key: 'impact', label: 'IMPACT', weeks: 'Semaines 35–52', pillarIds: [4, 9, 10, 12] },
];

function PillarCard({ pillar, onPress }: { pillar: Pillar; onPress: () => void }) {
  const isLocked = pillar.status === 'locked';
  const isCompleted = pillar.status === 'completed';

  return (
    <TouchableOpacity
      style={[styles.pillarCard, isLocked && styles.pillarCardLocked]}
      onPress={!isLocked ? onPress : undefined}
      activeOpacity={isLocked ? 1 : 0.8}
    >
      {/* Left — color bar */}
      <View style={[styles.pillarColorBar, { backgroundColor: pillar.color }]} />

      {/* Content */}
      <View style={styles.pillarContent}>
        <View style={styles.pillarHeader}>
          <Text style={[styles.pillarNumber, isLocked && styles.textLocked]}>
            Pilier {pillar.id}
          </Text>
          {isCompleted && <Badge label="COMPLÉTÉ" variant="success" />}
          {pillar.status === 'in_progress' && <Badge label="EN COURS" variant="gold" />}
          {isLocked && <Badge label="VERROUILLÉ" variant="locked" />}
        </View>
        <Text style={[styles.pillarName, isLocked && styles.textLocked]}>{pillar.name}</Text>
        <Text style={[styles.pillarTagline, isLocked && styles.textLocked]} numberOfLines={1}>
          {pillar.tagline}
        </Text>
        {!isLocked && (
          <ProgressBar
            progress={pillar.progress}
            height={4}
            color={pillar.color}
            style={styles.pillarProgress}
          />
        )}
      </View>

      {/* Right — lock or arrow */}
      <Text style={[styles.pillarArrow, isLocked && styles.textLocked]}>
        {isLocked ? '🔒' : '›'}
      </Text>
    </TouchableOpacity>
  );
}

export default function ProgrammeScreen() {
  const navigation = useNavigation<Nav>();
  const { pillars, currentWeek } = useAppStore();
  const globalProgress = Math.round((currentWeek / 52) * 100);

  return (
    <SafeScreen edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mon Programme</Text>
          <View style={styles.globalProgress}>
            <View style={styles.globalProgressLabels}>
              <Text style={styles.globalProgressTitle}>Semaine {currentWeek} / 52</Text>
              <Text style={styles.globalProgressPct}>{globalProgress}%</Text>
            </View>
            <ProgressBar progress={globalProgress} height={6} />
          </View>
        </View>

        {/* Phases */}
        {PHASES.map((phase) => {
          const phasePillars = pillars.filter((p) => phase.pillarIds.includes(p.id));
          const phaseCompleted = phasePillars.every((p) => p.status === 'completed');
          const phaseActive = phasePillars.some((p) => p.status === 'in_progress');

          return (
            <View key={phase.key} style={styles.phaseSection}>
              <View style={styles.phaseHeader}>
                <View>
                  <Text style={[styles.phaseLabel, phaseActive && styles.phaseLabelActive]}>
                    {phase.label}
                  </Text>
                  <Text style={styles.phaseWeeks}>{phase.weeks}</Text>
                </View>
                {phaseCompleted && <Badge label="COMPLÉTÉE" variant="success" size="md" />}
                {phaseActive && !phaseCompleted && <Badge label="EN COURS" variant="gold" size="md" />}
              </View>

              {phasePillars.map((pillar) => (
                <PillarCard
                  key={pillar.id}
                  pillar={pillar}
                  onPress={() => navigation.navigate('PillarDetail', { pillarId: pillar.id })}
                />
              ))}
            </View>
          );
        })}

        {/* Graduation */}
        <View style={styles.graduationCard}>
          <Text style={styles.graduationIcon}>🏆</Text>
          <Text style={styles.graduationTitle}>Semaine 52 — Graduation</Text>
          <Text style={styles.graduationSub}>
            Guide de Transmission + Certificat du Code Masculin
          </Text>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.lg, gap: Spacing.xl },
  header: { gap: Spacing.base },
  title: { ...Typography.styles.displayMedium },
  globalProgress: { gap: Spacing.sm },
  globalProgressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  globalProgressTitle: { ...Typography.styles.bodyBold },
  globalProgressPct: { color: Colors.gold.primary, fontWeight: Typography.weight.bold },

  phaseSection: { gap: Spacing.md },
  phaseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phaseLabel: { ...Typography.styles.label, color: Colors.text.tertiary },
  phaseLabelActive: { color: Colors.gold.primary },
  phaseWeeks: { ...Typography.styles.caption, color: Colors.text.tertiary, marginTop: Spacing.xs },

  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  pillarCardLocked: { opacity: 0.55 },
  pillarColorBar: { width: 4, alignSelf: 'stretch' },
  pillarContent: { flex: 1, padding: Spacing.base, gap: Spacing.xs },
  pillarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pillarNumber: { ...Typography.styles.caption, color: Colors.text.tertiary, fontWeight: Typography.weight.semibold },
  pillarName: { ...Typography.styles.bodyBold },
  pillarTagline: { ...Typography.styles.caption, color: Colors.text.secondary },
  pillarProgress: { marginTop: Spacing.xs },
  pillarArrow: { paddingRight: Spacing.base, fontSize: 20, color: Colors.gold.primary },
  textLocked: { color: Colors.text.tertiary },

  graduationCard: {
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.gold.border,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  graduationIcon: { fontSize: 40 },
  graduationTitle: { ...Typography.styles.bodyBold, textAlign: 'center' },
  graduationSub: { ...Typography.styles.caption, color: Colors.text.secondary, textAlign: 'center' },
});
