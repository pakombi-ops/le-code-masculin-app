import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing } from '../../theme';

const STEPS = [
  'Traitement de tes 8 réponses',
  'Identification de tes 3 piliers prioritaires',
  'Construction de ton Code de départ',
];

export default function DiagnosticTransitionScreen() {
  const { scores } = useLocalSearchParams<{ scores: string }>();
  const [visibleSteps, setVisibleSteps] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.timing(progress, { toValue: 1, duration: 2200, delay: 300, useNativeDriver: false }).start();

    setTimeout(() => setVisibleSteps(1), 600);
    setTimeout(() => setVisibleSteps(2), 1100);
    setTimeout(() => setVisibleSteps(3), 1600);

    const t = setTimeout(() => {
      router.replace({ pathname: '/(auth)/resultats', params: { scores } });
    }, 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        <View style={styles.circle}>
          <Text style={styles.monogram}>PC</Text>
        </View>
        <Text style={styles.title}>Prince Johann analyse{'\n'}ton profil...</Text>
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={i} style={[styles.stepRow, { opacity: visibleSteps > i ? 1 : 0 }]}>
              <Text style={styles.diamond}>✦</Text>
              <Text style={styles.stepTxt}>{step}</Text>
            </View>
          ))}
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, {
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '85%'] }),
          }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  content: { alignItems: 'center', width: '100%' },
  circle: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.secondary, marginBottom: Spacing['3xl'] },
  monogram: { ...Typography.h4, color: Colors.brand.gold, letterSpacing: 4 },
  title: { ...Typography.bodyLarge, color: Colors.text.primary, fontStyle: 'italic', textAlign: 'center', lineHeight: 30, marginBottom: Spacing['3xl'] },
  steps: { gap: Spacing.lg, marginBottom: Spacing['4xl'], width: '100%' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  diamond: { fontSize: 14, color: Colors.brand.gold },
  stepTxt: { ...Typography.body, color: Colors.text.secondary },
  track: { width: 160, height: 2, backgroundColor: Colors.border.subtle, borderRadius: 1, overflow: 'hidden' },
  fill: { height: 2, backgroundColor: Colors.brand.gold },
});
