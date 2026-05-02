import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView,
  Platform, Animated, Keyboard, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { addYears, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PacteScreen() {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const buttonOpacity  = useRef(new Animated.Value(0)).current;
  const buttonTranslate = useRef(new Animated.Value(20)).current;

  const returnDate = format(addYears(new Date(), 1), "d MMMM yyyy", { locale: fr });
  const wordCount  = text.trim().split(/\s+/).filter(Boolean).length;

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.trim().length > 10) {
      Animated.parallel([
        Animated.timing(buttonOpacity,   { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(buttonOpacity,   { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(buttonTranslate, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleSeal = async () => {
    Keyboard.dismiss();
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    // Stockage simple — sera remplacé par Supabase après connexion
    // SecureStore retiré pour compatibilité Expo Go
    router.push('/(auth)/quiz');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <Text style={styles.brandLabel}>LE CODE MASCULIN</Text>
          <View style={styles.brandLine} />
        </View>

        <Text style={styles.question}>Quel homme veux-tu être{'\n'}dans 12 mois ?</Text>

        <View style={[styles.inputWrapper, isFocused && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            placeholder="Écris librement. Personne ne lira ceci sauf toi — dans 365 jours."
            placeholderTextColor={Colors.text.muted}
            value={text}
            onChangeText={handleTextChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline
            textAlignVertical="top"
          />
          {wordCount > 0 && <Text style={styles.wordCount}>{wordCount} mots</Text>}
        </View>

        <Text style={styles.sealNote}>
          Ta réponse sera scellée et te sera renvoyée{'\n'}
          le <Text style={styles.sealDate}>{returnDate}</Text>.{'\n'}
          C'est un pacte avec toi-même.
        </Text>

        <Animated.View style={[styles.ctaWrapper, { opacity: buttonOpacity, transform: [{ translateY: buttonTranslate }] }]}>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleSeal} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Sceller mon pacte  →</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.skipBtn} onPress={() => router.push('/(auth)/quiz')}>
          <Text style={styles.skipText}>Je préfère ne pas répondre maintenant</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  brandRow: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  brandLabel: { ...Typography.labelSmall, color: Colors.brand.gold, letterSpacing: 6, marginBottom: Spacing.sm },
  brandLine: { width: 32, height: 1, backgroundColor: Colors.brand.gold },
  question: { ...Typography.h2, color: Colors.text.primary, textAlign: 'center', lineHeight: 42, marginBottom: Spacing['3xl'] },
  inputWrapper: { width: '100%', backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border.default, padding: Spacing.base, minHeight: 180, marginBottom: Spacing.xl },
  inputFocused: { borderColor: Colors.brand.gold },
  input: { ...Typography.bodyLarge, color: Colors.text.primary, lineHeight: 28, flex: 1, minHeight: 150 },
  wordCount: { ...Typography.caption, color: Colors.text.muted, alignSelf: 'flex-end', marginTop: Spacing.sm },
  sealNote: { ...Typography.bodySmall, color: Colors.text.muted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['3xl'] },
  sealDate: { color: Colors.brand.gold },
  ctaWrapper: { width: '100%', marginBottom: Spacing.lg },
  ctaBtn: { backgroundColor: Colors.brand.gold, borderRadius: Radius.lg, paddingVertical: Spacing.base + 2, alignItems: 'center' },
  ctaText: { ...Typography.button, color: Colors.text.inverse },
  skipBtn: { paddingVertical: Spacing.md },
  skipText: { ...Typography.bodySmall, color: Colors.text.muted, textDecorationLine: 'underline', textAlign: 'center' },
});
