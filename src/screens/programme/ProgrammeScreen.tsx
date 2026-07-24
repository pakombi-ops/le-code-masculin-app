import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { ProgressBar, Badge } from '../../components/ui';
import { PILLARS, PHASES, type Pillar, type PillarPhase } from '../../constants/pillars';
import { useAuthStore } from '../../store/authStore';
import {
  getCompletedLessonIds,
  getPillarStatus,
  getPillarProgressReal,
  getOverallProgress,
} from '../../constants/progression';
import { PILLAR_ZERO } from '../../constants/pillars';
import { isModuleZeroCompleted } from '../../constants/progression';

export default function ProgrammeScreen() {
  const { user, entitlement, checkEntitlement, userProgress, loadUserProgress } = useAuthStore();
  const phases: PillarPhase[] = ['fondation', 'identite', 'impact'];

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        checkEntitlement(user.id);
        loadUserProgress(user.id);
      }
    }, [user?.id])
  );

  const completedIds = getCompletedLessonIds(userProgress);
  const { completedWeeks, totalWeeks } = getOverallProgress(completedIds);

  const handlePillar = (pillar: Pillar) => {
    const status = getPillarStatus(pillar.id, completedIds);
    if (status === 'locked') return;
    router.push({ pathname: '/pilier', params: { pillarId: String(pillar.id) } });
  };

  const renderPillarCard = (pillar: Pillar) => {
    const status = getPillarStatus(pillar.id, completedIds);
    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';
    const isActive = status === 'active';
    const { completed, total } = getPillarProgressReal(pillar.id, completedIds);
    const progress = total > 0 ? completed / total : 0;

    return (
      <TouchableOpacity
        key={pillar.id}
        style={[styles.pillarCard, isLocked && styles.pillarCardLocked, isActive && styles.pillarCardActive]}
        onPress={() => handlePillar(pillar)}
        disabled={isLocked}
        activeOpacity={0.8}
      >
        <View style={[styles.pillarIconBg, { borderColor: isLocked ? Colors.border.default : pillar.color }]}>
          <Text style={[styles.pillarNum, { color: isLocked ? Colors.text.muted : pillar.color }]}>
            {pillar.id}
          </Text>
        </View>

        <View style={styles.pillarInfo}>
          <Text style={[styles.pillarName, isLocked && styles.textMuted]}>{pillar.name}</Text>
          <Text style={styles.pillarTagline} numberOfLines={1}>
            {isLocked ? `Semaines ${pillar.phaseWeeks.start}–${pillar.phaseWeeks.end}` : pillar.tagline}
          </Text>
          {isActive && total > 0 && (
            <ProgressBar progress={progress} height={3} color={pillar.color} style={styles.lessonProgress} />
          )}
        </View>

        <View style={styles.pillarBadge}>
          {isCompleted && <Badge label="✓ COMPLÉTÉ" variant="completed" />}
          {isActive && <Badge label="EN COURS" variant="active" />}
          {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (!entitlement.active) {
    return (
      <View style={styles.container}>
        <View style={paywallStyles.container}>
          <Text style={paywallStyles.icon}>🔒</Text>
          <Text style={paywallStyles.title}>Le programme t'attend</Text>
          <Text style={paywallStyles.subtitle}>
            Débloque les 52 semaines et les 12 piliers du Code Masculin.
          </Text>
          <TouchableOpacity
            style={paywallStyles.ctaButton}
            onPress={() => Linking.openURL('https://pilierconscient.com/le-code-masculin-redeviens-lhomme-que-tu-sais-etre/')}
          >
            <Text style={paywallStyles.ctaText}>Voir les plans</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profil')}>
            <Text style={paywallStyles.linkText}>J'ai déjà acheté — lier mon compte</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Programme</Text>
          <View style={styles.globalProgress}>
            <Text style={styles.progressLabel}>Semaine {completedWeeks} / {totalWeeks}</Text>
            <ProgressBar progress={completedWeeks / totalWeeks} height={4} style={{ marginTop: Spacing.xs }} />
          </View>
        </View>

        <View style={styles.moduleZeroSection}>
  <TouchableOpacity
    style={[
      styles.pillarCard,
      isModuleZeroCompleted(completedIds) && styles.pillarCardLocked,
      !isModuleZeroCompleted(completedIds) && styles.pillarCardActive,
    ]}
    onPress={() => router.push({ pathname: '/pilier', params: { pillarId: '0' } })}
    activeOpacity={0.8}
  >
    <View style={[styles.pillarIconBg, { borderColor: PILLAR_ZERO.color }]}>
      <Text style={{ fontSize: 20 }}>🚩</Text>
    </View>
    <View style={styles.pillarInfo}>
      <Text style={styles.pillarName}>{PILLAR_ZERO.name}</Text>
      <Text style={styles.pillarTagline} numberOfLines={1}>{PILLAR_ZERO.tagline}</Text>
    </View>
    <View style={styles.pillarBadge}>
      {isModuleZeroCompleted(completedIds) ? (
        <Badge label="✓ COMPLÉTÉ" variant="completed" />
      ) : (
        <Badge label="COMMENCER ICI" variant="active" />
      )}
    </View>
  </TouchableOpacity>
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
  moduleZeroSection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
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

const paywallStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  icon: { fontSize: 48, marginBottom: Spacing.lg },
  title: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing.xl },
  ctaButton: { backgroundColor: Colors.brand.gold, borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  ctaText: { ...Typography.button, color: Colors.text.inverse },
  linkText: { ...Typography.body, color: Colors.brand.gold, textAlign: 'center' },
});
