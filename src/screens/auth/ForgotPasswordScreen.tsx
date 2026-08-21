import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Button, Input } from '../../components/ui';
import { requestPasswordReset, verifyPasswordResetOtp, updatePassword } from '../../services/supabase';

type Step = 'email' | 'code' | 'success';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async () => {
    if (!email.trim()) {
      setError('Entre ton adresse email.');
      return;
    }
    setIsLoading(true);
    setError('');

    const { error: requestError } = await requestPasswordReset(email.trim());
    setIsLoading(false);

    if (requestError) {
      setError("Impossible d'envoyer le code pour le moment. Réessaie.");
      return;
    }

    setStep('code');
  };

  const handleVerifyAndReset = async () => {
    if (!code.trim() || !newPassword || !confirmPassword) {
      setError('Remplis tous les champs.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    setError('');

    const { error: verifyError } = await verifyPasswordResetOtp(email.trim(), code.trim());

    if (verifyError) {
      setIsLoading(false);
      setError('Code incorrect ou expiré. Vérifie ou redemande un code.');
      return;
    }

    const { error: updateError } = await updatePassword(newPassword);
    setIsLoading(false);

    if (updateError) {
      setError("Impossible de mettre à jour le mot de passe. Réessaie.");
      return;
    }

    setStep('success');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {step === 'email' && (
          <>
            <Text style={styles.title}>Mot de passe oublié</Text>
            <Text style={styles.subtitle}>
              Entre ton adresse email, on t'envoie un code de vérification.
            </Text>

            <View style={styles.form}>
              {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
              <Input
                label="Email"
                placeholder="ton@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button
                label="Envoyer le code"
                onPress={handleRequestCode}
                fullWidth
                isLoading={isLoading}
                style={styles.cta}
              />
            </View>
          </>
        )}

        {step === 'code' && (
          <>
            <Text style={styles.title}>Vérifie ton email</Text>
            <Text style={styles.subtitle}>
              Entre le code reçu par email et choisis ton nouveau mot de passe.
            </Text>

            <View style={styles.form}>
              {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
              <Input
                label="Code de vérification"
                placeholder="123456"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />
              <Input
                label="Nouveau mot de passe"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Input
                label="Confirme le mot de passe"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <Button
                label="Réinitialiser le mot de passe"
                onPress={handleVerifyAndReset}
                fullWidth
                isLoading={isLoading}
                style={styles.cta}
              />
              <TouchableOpacity onPress={() => setStep('email')}>
                <Text style={styles.linkText}>Renvoyer le code</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 'success' && (
          <>
            <Text style={styles.title}>C'est fait !</Text>
            <Text style={styles.subtitle}>
              Ton mot de passe a été mis à jour. Tu peux maintenant te connecter.
            </Text>
            <Button
              label="Retour à la connexion"
              onPress={() => router.replace('/(auth)/login')}
              fullWidth
              style={styles.cta}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  backBtn: { marginTop: Spacing['3xl'], marginBottom: Spacing.lg, width: 40 },
  backArrow: { fontSize: 24, color: Colors.brand.gold },
  title: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.text.secondary, marginBottom: Spacing['2xl'], lineHeight: 22 },
  form: { width: '100%' },
  errorBanner: { ...Typography.body, color: Colors.status.error, backgroundColor: Colors.status.errorBg, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.base, textAlign: 'center' },
  cta: { marginTop: Spacing.base, marginBottom: Spacing.base },
  linkText: { ...Typography.body, color: Colors.brand.gold, textAlign: 'center' },
});