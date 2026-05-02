import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../theme';

interface SafeScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
}

/**
 * Wrapper de base pour tous les écrans.
 * Gère : StatusBar dark, SafeAreaInsets, fond navy.
 */
export const SafeScreen: React.FC<SafeScreenProps> = ({
  children,
  style,
  edges = ['top', 'bottom'],
  backgroundColor = Colors.background.primary,
}) => {
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor }]}
      edges={edges}
    >
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1 },
});
