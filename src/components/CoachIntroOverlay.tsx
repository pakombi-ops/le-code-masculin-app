import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { FEATURE_EXPLANATIONS } from '../constants/featureExplanations';
import { FeatureExplanationSections } from './FeatureExplanationSections';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

interface CoachIntroOverlayProps {
  onContinue: (dontShowAgain: boolean) => void;
}

export function CoachIntroOverlay({ onContinue }: CoachIntroOverlayProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const content = FEATURE_EXPLANATIONS['coach-ia'];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FeatureExplanationSections content={content} />
        <View style={{ height: 140 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setDontShowAgain((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
            {dontShowAgain && <Check size={14} color={Colors.text.inverse} />}
          </View>
          <Text style={styles.checkboxLabel}>Ne plus afficher cet écran</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => onContinue(dontShowAgain)}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.primary },
  scrollContent: { padding: Spacing.lg },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    padding: Spacing.lg,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkboxChecked: { backgroundColor: Colors.brand.gold, borderColor: Colors.brand.gold },
  checkboxLabel: { ...Typography.body, color: Colors.text.secondary },
  continueBtn: {
    backgroundColor: Colors.brand.gold,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.gold,
  },
  continueBtnText: { ...Typography.button, color: Colors.text.inverse },
});