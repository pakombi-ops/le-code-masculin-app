import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

type BadgeVariant = 'active' | 'completed' | 'locked' | 'premium' | 'phase';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  color?: string; // surcharge de couleur (pour les phases)
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'active',
  style,
  color,
}) => {
  return (
    <View style={[styles.base, styles[variant], color ? { backgroundColor: color + '22', borderColor: color } : {}, style]}>
      <Text style={[styles.label, styles[`label_${variant}`], color ? { color } : {}]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  active: {
    backgroundColor: Colors.brand.gold + '22',
    borderColor: Colors.brand.gold,
  },
  completed: {
    backgroundColor: Colors.status.successBg,
    borderColor: Colors.status.success,
  },
  locked: {
    backgroundColor: Colors.background.tertiary,
    borderColor: Colors.border.default,
  },
  premium: {
    backgroundColor: Colors.brand.gold + '22',
    borderColor: Colors.brand.gold,
  },
  phase: {
    backgroundColor: Colors.background.tertiary,
    borderColor: Colors.border.active,
  },

  label: { ...Typography.labelSmall },
  label_active: { color: Colors.brand.gold },
  label_completed: { color: Colors.status.success },
  label_locked: { color: Colors.text.muted },
  label_premium: { color: Colors.brand.gold },
  label_phase: { color: Colors.text.primary },
});
