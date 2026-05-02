import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { QUIZ_QUESTIONS, calculateScores } from '../../constants/quiz';

const TOTAL = QUIZ_QUESTIONS.length;

export default function QuizScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const q = QUIZ_QUESTIONS[currentIndex];

  const handleSelect = (id: 'A' | 'B' | 'C' | 'D') => {
    setSelected(id);
    Animated.timing(btnOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);

    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      if (currentIndex < TOTAL - 1) {
        setCurrentIndex(i => i + 1);
        setSelected(null);
        btnOpacity.setValue(0);
        fadeAnim.setValue(1);
      } else {
        const scores = calculateScores(newAnswers);
        router.replace({ pathname: '/(auth)/diagnostic-transition', params: { scores: JSON.stringify(scores) } });
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Barre de progression */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => currentIndex === 0 ? router.back() : setCurrentIndex(i => i - 1)} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {QUIZ_QUESTIONS.map((_, i) => (
            <View key={i} style={[styles.dot, i < currentIndex && styles.dotDone, i === currentIndex && styles.dotActive]} />
          ))}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.label}>DIAGNOSTIC PERSONNEL</Text>
      <Text style={styles.counter}>Question {currentIndex + 1} sur {TOTAL}</Text>

      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.question}>{q.question}</Text>
          <View style={styles.options}>
            {q.options.map(opt => {
              const isSelected = selected === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optCard, isSelected && styles.optSelected]}
                  onPress={() => handleSelect(opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.letter, isSelected && styles.letterSelected]}>
                    <Text style={[styles.letterTxt, isSelected && styles.letterTxtSelected]}>{opt.id}</Text>
                  </View>
                  <Text style={styles.optTxt}>{opt.text}</Text>
                  {isSelected && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.ctaArea, { opacity: btnOpacity }]} pointerEvents={selected ? 'auto' : 'none'}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.ctaTxt}>{currentIndex < TOTAL - 1 ? 'Continuer →' : 'Voir mon Code →'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary, paddingTop: 60 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backArrow: { fontSize: 22, color: Colors.brand.gold },
  dotsRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border.default },
  dotDone: { backgroundColor: Colors.brand.gold, opacity: 0.5 },
  dotActive: { width: 20, backgroundColor: Colors.brand.gold },
  label: { ...Typography.labelSmall, color: Colors.brand.gold, textAlign: 'center', marginBottom: 4 },
  counter: { ...Typography.bodySmall, color: Colors.text.muted, textAlign: 'center', marginBottom: Spacing['2xl'] },
  body: { flex: 1, paddingHorizontal: Spacing.xl },
  question: { ...Typography.h3, color: Colors.text.primary, textAlign: 'center', lineHeight: 34, marginBottom: Spacing['2xl'] },
  options: { gap: Spacing.sm },
  optCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.base, gap: Spacing.md },
  optSelected: { borderColor: Colors.brand.gold, borderWidth: 1.5, backgroundColor: Colors.background.tertiary },
  letter: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  letterSelected: { backgroundColor: Colors.brand.gold },
  letterTxt: { ...Typography.label, color: Colors.text.muted, fontSize: 12 },
  letterTxtSelected: { color: Colors.text.inverse },
  optTxt: { ...Typography.body, color: Colors.text.primary, flex: 1, lineHeight: 22 },
  check: { fontSize: 16, color: Colors.brand.gold },
  ctaArea: { paddingHorizontal: Spacing.xl, paddingBottom: 48, paddingTop: Spacing.base },
  ctaBtn: { backgroundColor: Colors.brand.gold, borderRadius: Radius.lg, paddingVertical: Spacing.base + 2, alignItems: 'center' },
  ctaTxt: { ...Typography.button, color: Colors.text.inverse },
});
