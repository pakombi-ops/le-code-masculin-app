import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Card } from '../../components/ui';
import { useTracker } from '../../hooks/useTracker';
import { getPillarById, PHASES } from '../../constants/pillars';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

const PHASE_INFO = [
  { number: 1, key: 'fondation' as const, label: 'FONDATION' },
  { number: 2, key: 'identite' as const, label: 'IDENTITÉ' },
  { number: 3, key: 'impact' as const, label: 'IMPACT' },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function TrackerScreen() {
    const isPremium = useAuthStore((state) => state.aiQuota?.is_premium ?? false);
  const {
    currentPhase,
    phasePillars,
    entries,
    todayPillarIds,
    weekScore,
    phaseScore,
    isLoading,
    error,
    checkPillar,
    startedAt,
  } = useTracker();

  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const activePhase = selectedPhase ?? currentPhase;
  const isEditable = activePhase === currentPhase;

  const phasePillarsForActive = PHASE_INFO.find((p) => p.number === activePhase)
    ? phaseIdsFor(activePhase)
    : [];

  function phaseIdsFor(phaseNumber: number): number[] {
    const map: Record<number, number[]> = {
      1: [1, 2, 7, 8],
      2: [3, 5, 6, 11],
      3: [4, 9, 10, 12],
    };
    return map[phaseNumber] ?? [];
  }

  const phaseStartDate = startedAt ? addDays(startedAt, (activePhase - 1) * 30) : null;

  if (isLoading) {
    return (
      <SafeScreen edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.brand.gold} size="large" />
        </View>
      </SafeScreen>
    );
  }

  if (error) {
    return (
      <SafeScreen edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Impossible de charger ton tracker.</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Tracker 90 Jours</Text>

          {/* Sélecteur de phase */}
          <View style={styles.phaseTabs}>
            {PHASE_INFO.map((p) => (
              <TouchableOpacity
                key={p.number}
                style={[styles.phaseTab, activePhase === p.number && styles.phaseTabActive]}
                onPress={() => setSelectedPhase(p.number)}
              >
                <Text style={[styles.phaseTabText, activePhase === p.number && styles.phaseTabTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Check-in du jour — uniquement si phase active = phase sélectionnée */}
          {isEditable ? (
            <Card style={styles.checkInCard} variant="bordered">
              <Text style={styles.sectionLabel}>Aujourd'hui</Text>
              <View style={styles.pillarGrid}>
                {phasePillars.map((pillarId) => {
                  const pillar = getPillarById(pillarId);
                  const isChecked = todayPillarIds.includes(pillarId);
                  return (
                                        <TouchableOpacity
                      key={pillarId}
                      style={[styles.pillarBtn, isChecked && styles.pillarBtnChecked]}
                      onPress={() => {
                        if (!isPremium) {
                          router.push('/feature-info/tracker');
                          return;
                        }
                        checkPillar(pillarId);
                      }}
                    >
                      <Text style={[styles.pillarBtnText, isChecked && styles.pillarBtnTextChecked]}>
                        {isChecked ? '✓ ' : ''}{pillar?.name ?? `Pilier ${pillarId}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          ) : (
            <Card style={styles.checkInCard} variant="bordered">
              <Text style={styles.readOnlyText}>
                Tu consultes une autre phase — pas de saisie possible ici.
              </Text>
            </Card>
          )}

          {/* Scores */}
          <View style={styles.scoresRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{weekScore}/28</Text>
              <Text style={styles.scoreLabel}>Semaine</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreValue}>{phaseScore}/120</Text>
              <Text style={styles.scoreLabel}>Phase</Text>
            </View>
          </View>

          {/* Grille 30 jours × 4 piliers de la phase active */}
          <Text style={styles.sectionLabel}>Grille — 30 jours</Text>
          <View style={styles.grid}>
            {phaseIdsFor(activePhase).map((pillarId) => {
              const pillar = getPillarById(pillarId);
              return (
                <View key={pillarId} style={styles.gridRow}>
                  <Text style={styles.gridRowLabel} numberOfLines={1}>
                    {pillar?.name ?? `P${pillarId}`}
                  </Text>
                  <View style={styles.gridCells}>
                    {Array.from({ length: 30 }, (_, dayIndex) => {
                      const cellDate = phaseStartDate ? addDays(phaseStartDate, dayIndex) : null;
                      const isFilled = cellDate
                        ? entries.some((e) => e.entryDate === cellDate && e.pillarId === pillarId)
                        : false;
                      return (
                        <View
                          key={dayIndex}
                          style={[styles.cell, isFilled && styles.cellFilled]}
                        />
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...Typography.body, color: Colors.text.muted },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  title: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing.lg },
  phaseTabs: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.lg },
  phaseTab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.background.secondary, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.default },
  phaseTabActive: { backgroundColor: Colors.brand.gold, borderColor: Colors.brand.gold },
  phaseTabText: { ...Typography.caption, color: Colors.text.muted },
  phaseTabTextActive: { color: Colors.text.inverse, fontWeight: '600' },
  checkInCard: { marginBottom: Spacing.lg },
  sectionLabel: { ...Typography.label, color: Colors.text.secondary, marginBottom: Spacing.md },
  pillarGrid: { gap: Spacing.sm },
  pillarBtn: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, borderRadius: Radius.md, backgroundColor: Colors.background.tertiary, borderWidth: 1, borderColor: Colors.border.default },
  pillarBtnChecked: { backgroundColor: Colors.brand.gold, borderColor: Colors.brand.gold },
  pillarBtnText: { ...Typography.body, color: Colors.text.primary },
  pillarBtnTextChecked: { color: Colors.text.inverse, fontWeight: '600' },
  readOnlyText: { ...Typography.body, color: Colors.text.muted, textAlign: 'center' },
  scoresRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  scoreBox: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, backgroundColor: Colors.background.secondary, borderRadius: Radius.md },
  scoreValue: { ...Typography.h4, color: Colors.brand.gold },
  scoreLabel: { ...Typography.caption, color: Colors.text.muted, marginTop: 2 },
  grid: { gap: Spacing.md },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  gridRowLabel: { width: 90, ...Typography.caption, color: Colors.text.secondary },
  gridCells: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  cell: { width: 16, height: 16, borderRadius: 3, backgroundColor: Colors.background.tertiary },
  cellFilled: { backgroundColor: Colors.brand.gold },
});