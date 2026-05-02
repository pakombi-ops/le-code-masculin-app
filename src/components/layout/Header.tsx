import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '../../theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showBack = false, rightAction, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.center}>
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.right}>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress}>
            <Text style={styles.rightLabel}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  left: { width: 60 },
  center: { flex: 1, alignItems: 'center' },
  right: { width: 60, alignItems: 'flex-end' },
  title: { ...Typography.h4, color: Colors.text.primary },
  subtitle: { ...Typography.caption, color: Colors.text.secondary, marginTop: 2 },
  backBtn: { padding: Spacing.xs },
  backArrow: { fontSize: 22, color: Colors.brand.gold },
  rightLabel: { ...Typography.body, color: Colors.brand.gold },
});
