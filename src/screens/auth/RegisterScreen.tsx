import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Button, Input } from '../../components/ui';
import { signUp, verifySignupOtp, saveDiagnosticResults, recomputePillarPriority } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';

type Step = 'form' | 'code';

export default function RegisterScreen() {
  const { scores } = useLocalSearchParams<{ scores: string }>();
  const [step, setStep] = useState<Step>('form');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();
  const { pacteText, quizScores, reset } = useOnboardingStore();

  const handleRegister = async () => {
    if (!prenom.trim()) { setError('Ajoute ton prénom.'); return; }
    if (!email.trim()) { setError('Ajoute ton email.'); return; }
    if (password.length < 8) { setError('Mot de passe : 8 caractères minimum.'); return; }

    setError('');
    setIsLoading(true);

    const { data, error: authError } = await signUp(email.trim(), password, prenom.trim());

    if (authError) {
      setIsLoading(false);
      setError(authError.message);
      return;
    }

    // Supabase renvoie un user sans erreur si l'email existe déjà (anti-énumération)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setIsLoading(false);
      setError('Ce compte existe déjà. Connecte-toi ou réinitialise ton mot de passe.');
      return;
    }

    setIsLoading(false);
    setStep('code');
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError('Entre le code reçu par email.');
      return;
    }

    setError('');
    setIsLoading(true);

    const { data, error: verifyError } = await verifySignupOtp(email.trim(), code.trim());

    if (verifyError) {
      setIsLoading(false);
      setError('Code incorrect ou expiré. Vérifie ou redemande un code.');
      return;
    }

    const userId = data.user?.id ?? '';

    // À ce stade, verifyOtp a créé une vraie session Supabase — auth.uid() fonctionnera.
    setUser({
      id: userId,
      prenom: prenom.trim(),
      email: email.trim(),
      name: prenom.trim(),
      niveau: "L'Homme qui Cherche",
      created_at: new Date().toISOString(),
    });

    // Sauvegarde du diagnostic + calcul des 3 piliers prioritaires.
    // Best effort : un échec ici ne bloque pas la création de compte,
    // mais laisse l'utilisateur sans carte quotidienne tant que rien ne relance le calcul.
    // Fallback sur le param URL `scores` si le store a été vidé (app relancée entre le quiz et l'inscription).
    const scoresToSave = quizScores ?? (scores ? JSON.parse(scores) : null);

    if (userId && scoresToSave) {
      const { error: saveError } = await saveDiagnosticResults(userId, scoresToSave);
      if (saveError) {
        console.error('Échec sauvegarde diagnostic:', saveError);
      } else {
        const { error: rpcError } = await recomputePillarPriority(userId);
        if (rpcError) {
          console.error('Échec calcul priorité piliers:', rpcError);
        }
      }
    }

    reset();

    setIsLoading(false);
    router.replace('/(tabs)/accueil');
  };

  const handleResend = async () => {
    setError('');
    setIsLoading(true);
    const { error: authError } = await signUp(email.trim(), password, prenom.trim());
    setIsLoading(false);
    if (authError) {
      setError("Impossible de renvoyer le code pour le moment.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'form' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Sauvegarde ton diagnostic</Text>
              <Text style={styles.subtitle}>
                Crée ton compte pour ne pas perdre ton Code de départ et ton pacte du 12 mois.
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={[styles.stepDot, styles.stepDotDone]} />
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
            </View>
            <View style={styles.stepLabels}>
              <Text style={styles.stepLabel}>Diagnostic</Text>
              <Text style={[styles.stepLabel, styles.stepLabelActive]}>Compte</Text>
            </View>

            <View style={styles.form}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Input
                label="Prénom"
                placeholder="Ton prénom"
                value={prenom}
                onChangeText={setPrenom}
                autoCapitalize="words"
              />
              <Input
                label="Email"
                placeholder="ton@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Mot de passe"
                placeholder="8 caractères minimum"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <View style={styles.privacyRow}>
                <Text style={styles.privacyIcon}>🔒</Text>
                <Text style={styles.privacyText}>
                  Ton pacte et ton diagnostic sont chiffrés. Prince Johann ne partage aucune donnée.
                </Text>
              </View>

              <Button
                label="Créer mon compte"
                onPress={handleRegister}
                fullWidth
                isLoading={isLoading}
              />
            </View>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Déjà un compte ?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}> Se connecter</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 'code' && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Vérifie ton email</Text>
              <Text style={styles.subtitle}>
                On t'a envoyé un code à {email.trim()}. Entre-le pour activer ton compte.
              </Text>
            </View>

            <View style={styles.form}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Input
                label="Code de vérification"
                placeholder="123456"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />

              <Button
                label="Confirmer mon compte"
                onPress={handleVerifyCode}
                fullWidth
                isLoading={isLoading}
              />

              <TouchableOpacity onPress={handleResend} style={{ marginTop: Spacing.base }}>
                <Text style={styles.loginLink}>Renvoyer le code</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 70 },
  header: { marginBottom: Spacing['2xl'] },
  title: { ...Typography.h2, color: Colors.text.primary, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.text.secondary, lineHeight: 24 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, paddingHorizontal: Spacing['2xl'] },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border.default },
  stepDotDone: { backgroundColor: Colors.brand.gold, opacity: 0.6 },
  stepDotActive: { backgroundColor: Colors.brand.gold },
  stepLine: { flex: 1, height: 1.5, backgroundColor: Colors.brand.gold, opacity: 0.4 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
  stepLabel: { ...Typography.caption, color: Colors.text.muted },
  stepLabelActive: { color: Colors.brand.gold },
  form: { width: '100%', marginBottom: Spacing.xl },
  errorText: { ...Typography.bodySmall, color: Colors.status.error, backgroundColor: Colors.status.errorBg, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.base },
  privacyRow: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.background.secondary, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xl, alignItems: 'flex-start' },
  privacyIcon: { fontSize: 14, marginTop: 1 },
  privacyText: { ...Typography.caption, color: Colors.text.muted, flex: 1, lineHeight: 18 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing['2xl'] },
  loginText: { ...Typography.body, color: Colors.text.secondary },
  loginLink: { ...Typography.body, color: Colors.brand.gold, fontWeight: '600' },
});