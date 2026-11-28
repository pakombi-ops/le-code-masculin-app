import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabase';
import {
  verifyDeletionPassword, deleteAccount, deletionFailureMessage, CONFIRMATION_WORD,
} from '../../services/accountDeletion';

/**
 * ÉCRAN — Supprimer mon compte
 * 1. Ce qui est effacé, ce qui est gardé ; résiliation immédiate annoncée.
 * 2. Mot de passe du compte (réauthentification).
 * 3. Saisie de « SUPPRIMER », puis suppression.
 */
type Step = 'info' | 'password' | 'confirm';

export default function DeleteAccountScreen() {
  const email = useAuthStore((s) => s.user?.email ?? '');
  const hasSubscription = useAuthStore((s) => s.entitlement.active || (s.aiQuota?.is_premium ?? false));
  const logout = useAuthStore((s) => s.logout);

  const [step, setStep] = useState<Step>('info');
  const [eraseCommunityText, setEraseCommunityText] = useState(true);
  const [password, setPassword] = useState('');
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);

  const checkPassword = async () => {
    setBusy(true);
    try {
      const result = await verifyDeletionPassword(email, password, supabase.auth as any);
      setPassword('');
      if (result === 'verified') {
        setWord('');
        setStep('confirm');
      } else {
        Alert.alert(
          result === 'invalid' ? 'Mot de passe incorrect' : 'Vérification impossible',
          result === 'invalid'
            ? 'Ce mot de passe ne correspond pas à ton compte.'
            : result === 'rate_limited'
              ? 'Trop de tentatives. Attends quelques minutes et réessaie.'
              : 'Vérifie ta connexion et réessaie.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmDeletion = async () => {
    if (word.trim() !== CONFIRMATION_WORD) return;
    setBusy(true);
    try {
      const result = await deleteAccount(
        { confirm: CONFIRMATION_WORD, eraseCommunityText },
        { getSession: () => supabase.auth.getSession() }
      );
      if (result.kind === 'deleted') {
        // Le compte n'existe plus : on ferme la session locale et on quitte.
        await logout().catch(() => {});
        Alert.alert('Compte supprimé', 'Ton compte et tes données ont été effacés.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/splash') },
        ], { cancelable: false });
        return;
      }
      if (result.kind === 'reauth_required' || result.kind === 'no_session') setStep('password');
      Alert.alert('Suppression impossible', deletionFailureMessage(result.kind));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()} disabled={busy}>
          <ChevronLeft size={22} color={Colors.text.secondary} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Supprimer mon compte</Text>

        {step === 'info' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ce qui est effacé, immédiatement et définitivement</Text>
              <Text style={styles.body}>
                Ton profil, ton journal, tes pactes, tes diagnostics, tes conversations avec le coach, ta progression,
                ton tracker et ton mandala. Ton compte sur le site pilierconscient.com et ton accès à la formation.
                Ton adresse dans notre liste d'emails.
              </Text>
              <Text style={[styles.cardTitle, styles.spaced]}>Ce qui est gardé</Text>
              <Text style={styles.body}>
                Tes paiements et factures chez Stripe, que la loi nous oblige à conserver.
              </Text>
            </View>

            {hasSubscription && (
              <View style={[styles.card, styles.warning]}>
                <Text style={styles.cardTitle}>Ton abonnement sera résilié immédiatement</Text>
                <Text style={styles.body}>
                  Sans remboursement de la période en cours. Si tu veux profiter de ta période déjà payée, résilie
                  seulement ton abonnement (Profil › Gérer mon abonnement) et reviens supprimer ton compte plus tard.
                </Text>
              </View>
            )}

            <View style={[styles.card, styles.row]}>
              <Text style={[styles.body, styles.rowText]}>Effacer aussi le texte de mes messages dans la communauté</Text>
              <Switch
                value={eraseCommunityText}
                onValueChange={setEraseCommunityText}
                trackColor={{ true: Colors.brand.gold, false: Colors.border.default }}
              />
            </View>
            <Text style={styles.hint}>
              {eraseCommunityText
                ? 'Tes messages afficheront « Message supprimé ».'
                : 'Tes messages resteront visibles, signés « Membre supprimé ».'}
            </Text>

            <Button label="Continuer" onPress={() => { setPassword(''); setStep('password'); }} busy={busy} disabled={!email} />
          </>
        )}

        {step === 'password' && (
          <>
            <Text style={styles.body}>Pour confirmer, saisis le mot de passe du compte {email}.</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              placeholder="Mot de passe"
              placeholderTextColor={Colors.text.muted}
            />
            <Button label="Valider" onPress={checkPassword} busy={busy} disabled={password.length === 0} />
            <Text style={styles.hint}>
              Mot de passe oublié ? Déconnecte-toi, puis choisis « Mot de passe oublié » sur l'écran de connexion.
            </Text>
          </>
        )}

        {step === 'confirm' && (
          <>
            <Text style={styles.body}>
              Dernière étape. Tape {CONFIRMATION_WORD} pour supprimer ton compte. Cette action est irréversible.
            </Text>
            <TextInput
              style={styles.input}
              value={word}
              onChangeText={setWord}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={CONFIRMATION_WORD}
              placeholderTextColor={Colors.text.muted}
            />
            <Button
              label="Supprimer définitivement"
              onPress={confirmDeletion}
              busy={busy}
              disabled={word.trim() !== CONFIRMATION_WORD}
              destructive
            />
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

function Button({ label, onPress, busy, disabled, destructive }: {
  label: string; onPress: () => void; busy: boolean; disabled?: boolean; destructive?: boolean;
}) {
  const off = busy || disabled;
  return (
    <TouchableOpacity
      style={[styles.button, destructive && styles.buttonDestructive, off && styles.buttonOff]}
      onPress={onPress}
      disabled={off}
      activeOpacity={0.8}
    >
      {busy
        ? <ActivityIndicator color={destructive ? Colors.text.primary : Colors.text.inverse} />
        : <Text style={[styles.buttonText, destructive && styles.buttonTextDestructive]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.base, paddingBottom: Spacing['5xl'], gap: Spacing.base },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...Typography.body, color: Colors.text.secondary },
  title: { ...Typography.h2, color: Colors.text.primary },
  card: { backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.base },
  warning: { borderColor: Colors.status.error, backgroundColor: Colors.status.errorBg },
  cardTitle: { ...Typography.label, color: Colors.text.primary, marginBottom: Spacing.sm },
  spaced: { marginTop: Spacing.base },
  body: { ...Typography.body, color: Colors.text.secondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  rowText: { flex: 1, color: Colors.text.primary },
  hint: { ...Typography.caption, color: Colors.text.muted, marginTop: -Spacing.sm },
  input: {
    ...Typography.bodyLarge, color: Colors.text.primary, backgroundColor: Colors.background.secondary,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border.default,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, letterSpacing: 2,
  },
  button: { backgroundColor: Colors.brand.gold, borderRadius: Radius.md, paddingVertical: Spacing.md + 2, alignItems: 'center' },
  buttonDestructive: { backgroundColor: Colors.status.error },
  buttonOff: { opacity: 0.4 },
  buttonText: { ...Typography.button, color: Colors.text.inverse },
  buttonTextDestructive: { color: Colors.text.primary },
  link: { ...Typography.body, color: Colors.text.gold, textAlign: 'center' },
});
