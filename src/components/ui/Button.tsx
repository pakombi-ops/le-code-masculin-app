import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  haptic = true,
}) => {
  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || isLoading) && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.text.inverse : Colors.brand.gold}
        />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // ── Variants ──────────────────────────────────────────
  primary: {
    backgroundColor: Colors.brand.gold,
    ...Shadow.gold,
  },
  secondary: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.brand.gold,
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  destructive: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.status.error,
  },

  // ── Tailles ───────────────────────────────────────────
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  size_md: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md + 2 },
  size_lg: { paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.base + 2 },

  // ── Labels ────────────────────────────────────────────
  label: { ...Typography.button },
  label_primary: { color: Colors.text.inverse },
  label_secondary: { color: Colors.brand.gold },
  label_ghost: { color: Colors.brand.gold },
  label_destructive: { color: Colors.status.error },

  labelSize_sm: { ...Typography.buttonSmall },
  labelSize_md: { ...Typography.button },
  labelSize_lg: { ...Typography.button, fontSize: 17 },
});
