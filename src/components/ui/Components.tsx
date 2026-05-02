/**
 * COMPOSANTS UI RÉUTILISABLES
 * Card · Badge · Input · ProgressBar
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../theme';

// ─────────────────────────────────────────
// CARD
// ─────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'locked' | 'gold';
  padding?: keyof typeof Spacing;
}

export function Card({ children, style, onPress, variant = 'default', padding = 'base' }: CardProps) {
  const cardStyle = [
    styles.card,
    styles[`card_${variant}`],
    { padding: Spacing[padding] },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.85}>
        {children}
        {variant === 'locked' && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
      {variant === 'locked' && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────
type BadgeVariant = 'gold' | 'success' | 'error' | 'locked' | 'info' | 'premium';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'gold', size = 'sm', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], styles[`badge_size_${size}`], style]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`], size === 'md' && styles.badgeTextMd]}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  error?: string;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  rightIcon,
  style,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.inputWrapper, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightIcon && <View style={styles.inputRightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
}

// ─────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────
interface ProgressBarProps {
  progress: number;       // 0 à 100
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  height = 6,
  color = Colors.gold.primary,
  backgroundColor = Colors.background.tertiary,
  showLabel = false,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={[styles.progressWrapper, style]}>
      <View style={[styles.progressTrack, { height, backgroundColor }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${clampedProgress}%`, height, backgroundColor: color },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.progressLabel}>{Math.round(clampedProgress)}%</Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────
interface DividerProps {
  label?: string;
  style?: ViewStyle;
}

export function Divider({ label, style }: DividerProps) {
  if (!label) {
    return <View style={[styles.divider, style]} />;
  }
  return (
    <View style={[styles.dividerWithLabel, style]}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────
const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  card_default: {},
  card_elevated: {
    ...Shadows.md,
    borderColor: Colors.border.subtle,
  },
  card_locked: {
    opacity: 0.65,
    overflow: 'hidden',
  },
  card_gold: {
    borderColor: Colors.gold.border,
    borderWidth: 1.5,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 13, 26, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.lg,
  },
  lockIcon: {
    fontSize: 20,
  },

  // Badge
  badge: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badge_size_sm: { paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  badge_size_md: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  badge_gold: { backgroundColor: Colors.gold.subtle, borderWidth: 1, borderColor: Colors.gold.border },
  badge_success: { backgroundColor: Colors.semantic.successSubtle },
  badge_error: { backgroundColor: Colors.semantic.errorSubtle },
  badge_locked: { backgroundColor: Colors.border.default },
  badge_info: { backgroundColor: 'rgba(74, 144, 217, 0.15)' },
  badge_premium: { backgroundColor: Colors.gold.subtle, borderWidth: 1, borderColor: Colors.gold.border },
  badgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  badgeTextMd: { fontSize: Typography.size.sm },
  badgeText_gold: { color: Colors.gold.primary },
  badgeText_success: { color: Colors.semantic.success },
  badgeText_error: { color: Colors.semantic.error },
  badgeText_locked: { color: Colors.text.tertiary },
  badgeText_info: { color: Colors.semantic.info },
  badgeText_premium: { color: Colors.gold.primary },

  // Input
  inputWrapper: { gap: Spacing.sm },
  inputLabel: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
    fontWeight: Typography.weight.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.input,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    height: 52,
    paddingHorizontal: Spacing.base,
  },
  inputFocused: {
    borderColor: Colors.gold.primary,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: Colors.semantic.error,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: Typography.size.base,
  },
  inputRightIcon: {
    marginLeft: Spacing.sm,
  },
  inputErrorText: {
    ...Typography.styles.caption,
    color: Colors.semantic.error,
  },

  // ProgressBar
  progressWrapper: { gap: Spacing.xs },
  progressTrack: {
    width: '100%',
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: Radii.full,
  },
  progressLabel: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
    alignSelf: 'flex-end',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border.default,
    marginVertical: Spacing.base,
  },
  dividerWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.base,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.default,
  },
  dividerLabel: {
    ...Typography.styles.caption,
    color: Colors.text.tertiary,
  },
});
