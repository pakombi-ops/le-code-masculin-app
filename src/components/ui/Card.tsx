import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'bordered' | 'gold';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = Spacing.base,
}) => {
  const containerStyle = [
    styles.base,
    styles[variant],
    { padding },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: Colors.background.secondary,
  },
  elevated: {
    backgroundColor: Colors.background.secondary,
    ...Shadow.md,
  },
  bordered: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  gold: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1.5,
    borderColor: Colors.brand.gold,
    ...Shadow.gold,
  },
});
