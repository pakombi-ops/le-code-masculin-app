import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '../../theme';

/**
 * SCREEN 1 — Splash Screen
 * Affiché 2s au lancement, puis redirect vers onboarding ou home.
 */
export default function SplashScreen() {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      // TODO : vérifier la session Supabase ici
      // Si session active → router.replace('/(tabs)/accueil')
      // Sinon → router.replace('/(auth)/onboarding')
      router.replace('/(auth)/onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#0D0D1A', '#1A1A2E', '#0D0D1A']}
      style={styles.container}
    >
      <Animated.View style={[styles.logoWrapper, { opacity, transform: [{ scale }] }]}>
        {/* Monogramme PC dans un cercle doré */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>PC</Text>
        </View>
        <Text style={styles.brandName}>PILIER CONSCIENT</Text>
        <View style={styles.divider} />
        <Text style={styles.appName}>LE CODE MASCULIN</Text>
      </Animated.View>

      {/* Barre de chargement */}
      <View style={styles.loadingBar}>
        <Animated.View style={[styles.loadingFill, { width: '100%' }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
  },
  logoWrapper: { alignItems: 'center' },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.background.secondary,
  },
  logoText: {
    ...Typography.h2,
    color: Colors.brand.gold,
    letterSpacing: 4,
  },
  brandName: {
    ...Typography.labelSmall,
    color: Colors.brand.gold,
    letterSpacing: 6,
    marginBottom: Spacing.md,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.brand.gold,
    marginBottom: Spacing.md,
  },
  appName: {
    ...Typography.h3,
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  loadingBar: {
    position: 'absolute',
    bottom: 60,
    width: 120,
    height: 2,
    backgroundColor: Colors.border.default,
    borderRadius: 1,
    overflow: 'hidden',
  },
  loadingFill: {
    height: 2,
    backgroundColor: Colors.brand.gold,
  },
});
