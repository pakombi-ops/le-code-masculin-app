import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { CONSENT_TEXTS, ConsentPurpose } from '../../constants/consentTexts';

export const PRIVACY_URL = 'https://pilierconscient.com/politique-de-confidentialite/';

/**
 * Écran d'accord explicite, affiché au premier usage d'une fonction (journal +
 * pacte, ou coach). Case non cochée par défaut ; « J'accepte » n'est actif que
 * case cochée. « Pas maintenant » n'enregistre rien et n'ouvre pas la fonction.
 */
export function ConsentGate({
  purpose, onAccept, onDecline, busy = false, declineLabel = 'Pas maintenant',
}: {
  purpose: ConsentPurpose;
  onAccept: () => void;
  onDecline: () => void;
  busy?: boolean;
  declineLabel?: string;
}) {
  const text = CONSENT_TEXTS[purpose];
  const [checked, setChecked] = useState(false);
  const canAccept = checked && !busy;

  return (
    <ScrollView contentContainerStyle={styles.content} testID={`consent-gate-${purpose}`}>
      <Text style={styles.title}>{text.title}</Text>
      <Text style={styles.body}>{text.intro}</Text>

      <Text style={styles.subtitle}>Ce que nous en faisons</Text>
      {text.points.map((p) => (
        <View key={p} style={styles.point}>
          <Text style={styles.bullet}>•</Text>
          <Text style={[styles.body, styles.pointText]}>{p}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.checkRow}
        onPress={() => setChecked((v) => !v)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        testID={`consent-checkbox-${purpose}`}
        activeOpacity={0.8}
      >
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked && <Check size={14} color={Colors.text.inverse} strokeWidth={3} />}
        </View>
        <Text style={[styles.body, styles.checkText]}>{text.checkbox}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.accept, !canAccept && styles.acceptOff]}
        onPress={onAccept}
        disabled={!canAccept}
        testID={`consent-accept-${purpose}`}
        activeOpacity={0.85}
      >
        {busy ? <ActivityIndicator color={Colors.text.inverse} /> : <Text style={styles.acceptText}>J'accepte</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={onDecline} disabled={busy} style={styles.decline} testID={`consent-decline-${purpose}`}>
        <Text style={styles.declineText}>{declineLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.decline}>
        <Text style={styles.link}>Politique de confidentialité</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  title: { ...Typography.h2, color: Colors.text.primary },
  subtitle: { ...Typography.label, color: Colors.text.primary, marginTop: Spacing.sm },
  body: { ...Typography.body, color: Colors.text.secondary, lineHeight: 22 },
  point: { flexDirection: 'row', gap: Spacing.sm },
  bullet: { ...Typography.body, color: Colors.brand.gold },
  pointText: { flex: 1 },
  checkRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginTop: Spacing.md,
    padding: Spacing.base, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
  },
  box: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.brand.gold,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  boxChecked: { backgroundColor: Colors.brand.gold },
  checkText: { flex: 1, color: Colors.text.primary },
  accept: { backgroundColor: Colors.brand.gold, borderRadius: Radius.md, paddingVertical: Spacing.md + 2, alignItems: 'center', marginTop: Spacing.sm },
  acceptOff: { opacity: 0.4 },
  acceptText: { ...Typography.button, color: Colors.text.inverse },
  decline: { alignItems: 'center', paddingVertical: Spacing.sm },
  declineText: { ...Typography.body, color: Colors.text.secondary },
  link: { ...Typography.caption, color: Colors.text.muted, textDecorationLine: 'underline' },
});
