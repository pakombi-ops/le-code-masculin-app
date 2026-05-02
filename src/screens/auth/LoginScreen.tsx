import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Button, Input } from '../../components/ui';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { signIn } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';

/**
 * SCREEN 6 — Connexion
 * Email + mot de passe, Face ID, OAuth Apple/Google
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const setUser = useAuthStore((s) => s.setUser);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Merci de renseigner ton email et mot de passe.');
      return;
    }
    setIsLoading(true);
    setError('');
    const { data, error: authError } = await signIn(email, password);
    setIsLoading(false);
    if (authError) {
      setError('Email ou mot de passe incorrect. Réessaie.');
      return;
    }
    // TODO : charger le profil complet depuis Supabase et appeler setUser()
    router.replace('/(tabs)/accueil');
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>PC</Text>
            </View>
          </View>

          {/* Titre */}
          <Text style={styles.title}>Content de te revoir.</Text>
          <Text style={styles.subtitle}>Connecte-toi pour continuer ton Code.</Text>

          {/* Formulaire */}
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
            <Input
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <Button
              label="Se connecter"
              onPress={handleLogin}
              fullWidth
              isLoading={isLoading}
              style={styles.cta}
            />

            {/* Face ID */}
            <TouchableOpacity style={styles.biometricBtn}>
              <Text style={styles.biometricIcon}>⬡</Text>
              <Text style={styles.biometricText}>Connexion avec Face ID</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* OAuth */}
          <TouchableOpacity style={styles.oauthBtn}>
            <Text style={styles.oauthText}>  Continuer avec Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.oauthBtn, { marginTop: Spacing.sm }]}>
            <Text style={styles.oauthText}>G  Continuer avec Google</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}> S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  logoRow: { alignItems: 'center', marginTop: Spacing['3xl'], marginBottom: Spacing['2xl'] },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1.5, borderColor: Colors.brand.gold,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
  },
  logoText: { ...Typography.h4, color: Colors.brand.gold, letterSpacing: 3 },
  title: { ...Typography.h2, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing['2xl'] },
  form: { width: '100%' },
  errorBanner: {
    ...Typography.body,
    color: Colors.status.error,
    backgroundColor: Colors.status.errorBg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: Spacing.base, marginTop: -Spacing.sm },
  forgotText: { ...Typography.body, color: Colors.brand.gold },
  cta: { marginBottom: Spacing.base },
  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  biometricIcon: { fontSize: 22, color: Colors.brand.gold },
  biometricText: { ...Typography.body, color: Colors.text.secondary },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border.subtle },
  dividerText: { ...Typography.body, color: Colors.text.muted, marginHorizontal: Spacing.base },
  oauthBtn: {
    borderWidth: 1, borderColor: Colors.border.default,
    borderRadius: Radius.lg, paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  oauthText: { ...Typography.body, color: Colors.text.primary },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing['2xl'] },
  footerText: { ...Typography.body, color: Colors.text.secondary },
  footerLink: { ...Typography.body, color: Colors.brand.gold, fontWeight: '600' },
});
