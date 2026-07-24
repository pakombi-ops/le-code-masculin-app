import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing } from '../../theme';

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(lineWidth, { toValue: 1, duration: 1000, useNativeDriver: false }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/(auth)/pacte');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        <View style={styles.circle}>
          <Text style={styles.monogram}>PC</Text>
        </View>
        <Text style={styles.brand}>PILIER CONSCIENT</Text>
        <View style={styles.divider} />
        <Text style={styles.appName}>LE CODE MASCULIN</Text>
      </Animated.View>
      <View style={styles.trackWrapper}>
        <Animated.View style={[styles.trackFill, {
          width: lineWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center' },
  circle: { width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.secondary, marginBottom: Spacing.xl },
  monogram: { ...Typography.h2, color: Colors.brand.gold, letterSpacing: 6 },
  brand: { ...Typography.labelSmall, color: Colors.brand.gold, letterSpacing: 8, marginBottom: Spacing.md },
  divider: { width: 36, height: 1, backgroundColor: Colors.brand.gold, marginBottom: Spacing.md },
  appName: { ...Typography.h3, color: Colors.text.primary, letterSpacing: 3 },
  trackWrapper: { position: 'absolute', bottom: 70, width: 100, height: 1.5, backgroundColor: Colors.border.subtle, borderRadius: 1, overflow: 'hidden' },
  trackFill: { height: 1.5, backgroundColor: Colors.brand.gold },
});
