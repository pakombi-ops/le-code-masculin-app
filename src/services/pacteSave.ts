/**
 * Sauvegarde du pacte écrit pendant l'onboarding (avant ou après la création du compte).
 * L'accord « journal et pacte » est donné sur l'écran du pacte, avant d'écrire ;
 * il est enregistré côté base juste avant le pacte (la règle RLS refuse le pacte sans accord).
 * Sans accord : le pacte n'est pas enregistré.
 */
export interface PacteSaveDeps {
  grantJournalConsent: () => Promise<'ok' | 'error'>;
  savePacteEntry: (userId: string, content: string) => Promise<{ error: unknown }>;
}

export type PacteSaveResult = 'saved' | 'skipped_empty' | 'skipped_no_consent' | 'consent_error' | 'save_error';

export async function savePacteWithConsent(
  userId: string,
  pacteText: string,
  journalConsent: boolean,
  deps: PacteSaveDeps
): Promise<PacteSaveResult> {
  if (!pacteText || !pacteText.trim()) return 'skipped_empty';
  if (!journalConsent) return 'skipped_no_consent';
  if ((await deps.grantJournalConsent()) !== 'ok') return 'consent_error';
  const { error } = await deps.savePacteEntry(userId, pacteText);
  return error ? 'save_error' : 'saved';
}
