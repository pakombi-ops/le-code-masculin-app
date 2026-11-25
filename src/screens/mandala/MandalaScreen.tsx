import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Lock } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Card, ProgressBar } from '../../components/ui';
import { getPillarById } from '../../constants/pillars';
import { useAuthStore } from '../../store/authStore';
import {
  getUserMandala,
  updateMandalaSatellites,
  type UserMandala,
  type MandalaSatelliteGoal,
} from '../../services/supabase';

export default function MandalaScreen() {
  const user = useAuthStore((s) => s.user);
  const isPremium = useAuthStore((s) => s.aiQuota?.is_premium ?? false);
  const [mandalas, setMandalas] = useState<UserMandala[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activePillarId, setActivePillarId] = useState<number | null>(null);
  const [hideBlur, setHideBlur] = useState(false);

  // CHANGÉ : redirige vers l'écran d'explication au lieu du paywall direct
  const goToPaywall = useCallback(() => {
    setHideBlur(true);
    router.push('/feature-info/mandala');
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(false);
    const { data, error: err } = await getUserMandala(user.id);
    if (err || !data) {
      setError(true);
    } else {
      setMandalas(data);
      setActivePillarId((prev) => prev ?? data[0]?.pillar_id ?? null);
    }
    setIsLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setHideBlur(false);
      load();
    }, [load])
  );

  const toggleSatellite = async (mandala: UserMandala, satelliteId: string) => {
    if (!isPremium) {
      goToPaywall();
      return;
    }

    const previousGoals = mandala.satellite_goals;
    const updatedGoals: MandalaSatelliteGoal[] = mandala.satellite_goals.map((g) =>
      g.id === satelliteId
        ? { ...g, completed: !g.completed, completed_at: !g.completed ? new Date().toISOString() : null }
        : g
    );

    setMandalas((prev) =>
      prev.map((m) => (m.id === mandala.id ? { ...m, satellite_goals: updatedGoals } : m))
    );

    const { error: err } = await updateMandalaSatellites(mandala.id, updatedGoals);
    if (err) {
      setMandalas((prev) =>
        prev.map((m) => (m.id === mandala.id ? { ...m, satellite_goals: previousGoals } : m))
      );
    }
  };

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
          <Text style={styles.errorText}>Impossible de charger ton mandala.</Text>
        </View>
      </SafeScreen>
    );
  }

  if (mandalas.length === 0) {
    return (
      <SafeScreen edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Ton mandala se crée automatiquement après ton diagnostic des 12 Piliers.
          </Text>
        </View>
      </SafeScreen>
    );
  }

  const activeMandala = mandalas.find((m) => m.pillar_id === activePillarId) ?? mandalas[0];
  const pillar = getPillarById(activeMandala.pillar_id);
  const completedCount = activeMandala.satellite_goals.filter((g) => g.completed).length;
  const totalCount = activeMandala.satellite_goals.length;

  return (
    <SafeScreen edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Ton Mandala</Text>
          <Text style={styles.subtitle}>Tes 3 piliers prioritaires, un objectif, huit terrains d'action.</Text>

          <View style={styles.pillarTabs}>
            {mandalas.map((m) => {
              const p = getPillarById(m.pillar_id);
              const isActive = m.pillar_id === activeMandala.pillar_id;
              return (
                <TouchableOpacity
                  key={m.pillar_id}
                  style={[styles.pillarTab, isActive && styles.pillarTabActive]}
                  onPress={() => setActivePillarId(m.pillar_id)}
                >
                  <Text
                    style={[styles.pillarTabText, isActive && styles.pillarTabTextActive]}
                    numberOfLines={1}
                  >
                    {p?.name ?? `Pilier ${m.pillar_id}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Card style={styles.objectiveCard} variant="bordered">
            <Text style={styles.sectionLabel}>Objectif central</Text>
            <Text style={styles.objectiveText}>{activeMandala.central_objective}</Text>
            <View style={styles.progressRow}>
              <View style={{ flex: 1 }}>
                <ProgressBar
                  progress={totalCount > 0 ? completedCount / totalCount : 0}
                  color={pillar?.color ?? Colors.brand.gold}
                  height={6}
                />
              </View>
              <Text style={styles.progressLabel}>
                {completedCount}/{totalCount}
              </Text>
            </View>
          </Card>

          <Text style={styles.sectionLabel}>Terrains d'action</Text>
          <View style={styles.satelliteList}>
            {activeMandala.satellite_goals.map((goal, index) => {
              const isBlurred = !isPremium && index > 0 && !hideBlur;

              return (
                <View key={goal.id} style={styles.satelliteWrapper}>
                  <TouchableOpacity
                    style={[styles.satelliteCard, goal.completed && styles.satelliteCardChecked]}
                    onPress={() => toggleSatellite(activeMandala, goal.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.checkbox, goal.completed && styles.checkboxChecked]}>
                      {goal.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.satelliteTextArea}>
                      <Text style={[styles.satelliteTitle, goal.completed && styles.satelliteTitleChecked]}>
                        {goal.title}
                      </Text>
                      <Text style={styles.satelliteDescription}>{goal.description}</Text>
                    </View>
                  </TouchableOpacity>

                  {isBlurred && (
                    <>
                      <BlurView
                        intensity={25}
                        tint="dark"
                        experimentalBlurMethod="dimezisBlurView"
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />
                      <TouchableOpacity
                        style={styles.lockOverlay}
                        onPress={goToPaywall}
                        activeOpacity={0.8}
                      >
                        <Lock size={16} color={Colors.brand.gold} />
                        <Text style={styles.lockOverlayText}>Débloquer avec Premium</Text>
                      </TouchableOpacity>
                    </>
                  )}
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  errorText: { ...Typography.body, color: Colors.text.muted, textAlign: 'center' },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  title: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing.lg },
  pillarTabs: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.lg },
  pillarTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  pillarTabActive: { backgroundColor: Colors.brand.gold, borderColor: Colors.brand.gold },
  pillarTabText: { ...Typography.caption, color: Colors.text.muted },
  pillarTabTextActive: { color: Colors.text.inverse, fontWeight: '700' },
  objectiveCard: { marginBottom: Spacing.xl },
  sectionLabel: { ...Typography.label, color: Colors.text.secondary, marginBottom: Spacing.md },
  objectiveText: { ...Typography.bodyLarge, color: Colors.text.primary, marginBottom: Spacing.base, lineHeight: 26 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  progressLabel: { ...Typography.bodySmall, color: Colors.text.secondary, fontWeight: '600' },
  satelliteList: { gap: Spacing.sm },
  satelliteWrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(13, 13, 26, 0.1)',
  },
  lockOverlayText: { ...Typography.bodySmall, color: Colors.brand.gold, fontWeight: '600' },
  satelliteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.base,
  },
  satelliteCardChecked: { borderColor: Colors.status.success, backgroundColor: Colors.status.successBg },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.status.success, borderColor: Colors.status.success },
  checkmark: { fontSize: 14, color: Colors.text.inverse, fontWeight: '700' },
  satelliteTextArea: { flex: 1 },
  satelliteTitle: { ...Typography.body, color: Colors.text.primary, fontWeight: '600', marginBottom: 2 },
  satelliteTitleChecked: { color: Colors.status.success },
  satelliteDescription: { ...Typography.bodySmall, color: Colors.text.secondary, lineHeight: 20 },
});