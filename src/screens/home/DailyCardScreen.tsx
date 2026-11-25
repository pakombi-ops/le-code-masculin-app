import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { usePillarPriority } from '../../hooks/usePillarPriority';
import { DAILY_CARDS } from '../../constants/dailyCards';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function DailyCardScreen() {
  const { topPillar, isLoading, error } = usePillarPriority();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Impossible de charger ta carte du jour.</Text>
      </View>
    );
  }

  if (!topPillar) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>Pas encore de diagnostic</Text>
        <Text style={styles.emptyBody}>
          Fais ton diagnostic des 12 piliers pour débloquer ta carte quotidienne.
        </Text>
        <Pressable style={styles.ctaButton} onPress={() => {/* navigation vers diagnostic — à câbler */}}>
          <Text style={styles.ctaText}>Commencer le diagnostic</Text>
        </Pressable>
      </View>
    );
  }

  const content = DAILY_CARDS[topPillar.pillarSlug];

  // Garde-fou : ne devrait plus se déclencher (12 piliers couverts),
  // mais évite un crash si pillarSlug sort un jour des 12 valeurs attendues.
  if (!content) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Contenu manquant pour le pilier "{topPillar.pillarSlug}".
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pillarLabel}>{content.pillarLabel}</Text>
      <Text style={styles.message}>{content.message}</Text>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Réflexion</Text>
      <Text style={styles.question}>{content.reflectionQuestion}</Text>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Action</Text>
      <Text style={styles.action}>{content.microAction}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  ctaButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ctaText: {
    ...typography.button,
    color: colors.navy,
  },
  pillarLabel: {
    ...typography.overline,
    color: colors.gold,
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  question: {
    ...typography.body,
    color: colors.textPrimary,
  },
  action: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
});
