import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { Card, Badge } from './ui';
import { usePillarPriority } from '../hooks/usePillarPriority';
import { DAILY_CARDS } from '../constants/dailyCards';
import { getPillarBySlug } from '../constants/pillars';

export function DailyCard() {
  const { topPillar, isLoading, error } = usePillarPriority();

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <ActivityIndicator color={Colors.brand.gold} />
      </Card>
    );
  }

  if (error) {
    return null;
  }

  if (!topPillar) {
    return (
      <Card style={styles.card} onPress={() => router.push('/(auth)/pacte')}>
        <Text style={styles.emptyTitle}>Ta carte du jour t'attend</Text>
        <Text style={styles.emptyBody}>
          Fais ton diagnostic des 12 Piliers pour la débloquer.
        </Text>
      </Card>
    );
  }

  const content = DAILY_CARDS[topPillar.pillarSlug];
  const pillar = getPillarBySlug(topPillar.pillarSlug);

  if (!content || !pillar) {
    return null;
  }

  return (
    <Card style={styles.card} variant="bordered">
      <Badge
        label={`PILIER ${pillar.id} · ${pillar.name.toUpperCase()}`}
        variant="active"
        style={styles.badge}
      />
      <Text style={styles.message}>{content.message}</Text>

      <View style={styles.divider} />

      <Text style={styles.label}>RÉFLEXION</Text>
      <Text style={styles.question}>{content.reflectionQuestion}</Text>

      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/journal')}>
        <Text style={styles.actionBtnText}>{content.microAction}</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 0 },
  badge: { marginBottom: Spacing.sm, alignSelf: 'flex-start' },
  message: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.base },
  divider: { height: 1, backgroundColor: Colors.border.subtle, marginVertical: Spacing.md },
  label: { ...Typography.labelSmall, color: Colors.text.muted, marginBottom: Spacing.xs },
  question: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing.md },
  actionBtn: { backgroundColor: Colors.brand.gold, borderRadius: Radius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, alignItems: 'center' },
  actionBtnText: { ...Typography.button, color: Colors.text.inverse, textAlign: 'center' },
  emptyTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.xs },
  emptyBody: { ...Typography.body, color: Colors.text.secondary },
});
