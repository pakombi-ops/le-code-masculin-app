/**
 * Sauvegarde du pacte écrit pendant l'inscription (avant ou après la création du compte).
 * L'accord « journal et pacte » est donné sur l'écran du pacte, avant d'écrire.
 * Son heure réelle, prise sur le téléphone, est écrite en base à la création du
 * compte, juste avant le pacte (la règle RLS refuse le pacte sans accord).
 *   - accord donné : il est enregistré, même si le pacte a été laissé vide ;
 *   - pas d'accord : rien n'est enregistré, ni accord ni pacte.
 */
export interface PacteSaveDeps {
  grantJournalConsent: (acceptedAt: string) => Promise<'ok' | 'error'>;
  savePacteEntry: (userId: string, content: string) => Promise<{ error: unknown }>;
}

export type PacteSaveResult = 'saved' | 'consent_only' | 'skipped_no_consent' | 'consent_error' | 'save_error';

export async function savePacteWithConsent(
  userId: string,
  pacteText: string,
  journalConsentAt: string | null,
  deps: PacteSaveDeps
): Promise<PacteSaveResult> {
  if (!journalConsentAt) return 'skipped_no_consent';
  if ((await deps.grantJournalConsent(journalConsentAt)) !== 'ok') return 'consent_error';
  if (!pacteText || !pacteText.trim()) return 'consent_only';
  const { error } = await deps.savePacteEntry(userId, pacteText);
  return error ? 'save_error' : 'saved';
}
