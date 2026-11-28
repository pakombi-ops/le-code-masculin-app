import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { useAuthStore } from '../../store/authStore';
import { useConsentStore } from '../../store/consentStore';
import { supabase } from '../../services/supabase';
import { CONSENT_LABELS, WITHDRAW_TEXT, ConsentPurpose } from '../../constants/consentTexts';
import { fetchConsentEvents, currentGrantDate, ConsentEvent, ConsentClient, CONSENT_PURPOSES } from '../../services/consents';
import { showConsentError } from '../../services/consentUi';

/**
 * ÉCRAN — Mes consentements (Profil › Mes données)
 * Deux accords séparés, chacun retirable. Au retrait : « Garder mes entrées »
 * ou « Tout supprimer » (journal et pacte, ou conversations du coach).
 * Donner l'accord se fait au premier usage de la fonction (journal, pacte, coach).
 */
export default function ConsentsScreen() {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const journal = useConsentStore((s) => s.journal);
  const coach = useConsentStore((s) => s.coach);
  const status = { journal, coach };
  const load = useConsentStore((s) => s.load);
  const withdraw = useConsentStore((s) => s.withdraw);
  const [events, setEvents] = useState<ConsentEvent[]>([]);
  const [busy, setBusy] = useState<ConsentPurpose | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    await load(userId);
    const list = await fetchConsentEvents(userId, supabase as unknown as ConsentClient);
    if (list) setEvents(list);
  }, [userId, load]);

  useEffect(() => { refresh(); }, [refresh]);

  const doWithdraw = async (purpose: ConsentPurpose, erase: boolean) => {
    setBusy(purpose);
    const ok = await withdraw(purpose, erase);
    setBusy(null);
    if (!ok) { showConsentError(); return; }
    await refresh();
  };

  const askWithdraw = (purpose: ConsentPurpose) => {
    Alert.alert(WITHDRAW_TEXT.title, WITHDRAW_TEXT.message(purpose), [
      { text: WITHDRAW_TEXT.keep, onPress: () => doWithdraw(purpose, false) },
      { text: WITHDRAW_TEXT.erase, style: 'destructive', onPress: () => doWithdraw(purpose, true) },
      { text: WITHDRAW_TEXT.cancel, style: 'cancel' },
    ]);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.text.secondary} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mes consentements</Text>
        <Text style={styles.body}>
          Ton journal, ton pacte et tes échanges avec le coach peuvent révéler des informations sur ta santé.
          Ils ne sont utilisés qu'avec ton accord, donné au premier usage de chaque fonction.
        </Text>

        {CONSENT_PURPOSES.map((purpose) => {
          const granted = status[purpose];
          const since = currentGrantDate(events, purpose);
          return (
            <View key={purpose} style={styles.card} testID={`consent-card-${purpose}`}>
              <Text style={styles.cardTitle}>{CONSENT_LABELS[purpose]}</Text>
              {granted === null ? (
                <ActivityIndicator color={Colors.brand.gold} />
              ) : granted ? (
                <>
                  <Text style={styles.body}>{since ? `Accord donné le ${formatDate(since)}.` : 'Accord donné.'}</Text>
                  <TouchableOpacity onPress={() => askWithdraw(purpose)} disabled={busy !== null} style={styles.withdraw}>
                    {busy === purpose
                      ? <ActivityIndicator color={Colors.status.error} />
                      : <Text style={styles.withdrawText}>Retirer mon accord</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.body}>
                  Pas d'accord en cours : il te sera demandé à la prochaine ouverture {purpose === 'coach' ? 'du coach' : 'du journal'}.
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.base, paddingBottom: Spacing['5xl'], gap: Spacing.base },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { ...Typography.body, color: Colors.text.secondary },
  title: { ...Typography.h2, color: Colors.text.primary },
  body: { ...Typography.body, color: Colors.text.secondary },
  card: { backgroundColor: Colors.background.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.base, gap: Spacing.sm },
  cardTitle: { ...Typography.label, color: Colors.text.primary },
  withdraw: { paddingVertical: Spacing.sm },
  withdrawText: { ...Typography.body, color: Colors.status.error },
});
