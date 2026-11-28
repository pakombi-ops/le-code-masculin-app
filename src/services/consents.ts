/**
 * SERVICE — consents (src/services/consents.ts)
 * Consentements explicites, enregistrés côté base (migration 2026-11-28-consents.sql) :
 *   - has_consent(p_user_id, p_purpose)       → accord en cours ?
 *   - grant_consent(p_purpose, p_text_version) → accord (date posée par la base)
 *   - withdraw_consent(p_purpose, p_erase)     → retrait, avec ou sans effacement
 * La base refuse aussi l'écriture du journal et du pacte sans accord (RLS), et
 * le backend refuse le coach (403 consent_required) : l'app n'est pas le seul garde-fou.
 */
import { CONSENT_TEXTS, ConsentPurpose } from '../constants/consentTexts';

type RpcError = { message?: string; code?: string } | null;
export interface ConsentClient {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: RpcError }>;
  from: (table: string) => any;
}

export const CONSENT_PURPOSES: ConsentPurpose[] = ['journal', 'coach'];

export type ConsentStatus = Record<ConsentPurpose, boolean>;

export async function fetchConsentStatus(userId: string, client: ConsentClient): Promise<ConsentStatus | null> {
  if (!userId) return null;
  try {
    const results = await Promise.all(
      CONSENT_PURPOSES.map((purpose) => client.rpc('has_consent', { p_user_id: userId, p_purpose: purpose }))
    );
    if (results.some((r) => r.error)) return null;
    return { journal: results[0].data === true, coach: results[1].data === true };
  } catch {
    return null;
  }
}

export async function grantConsent(purpose: ConsentPurpose, client: ConsentClient): Promise<'ok' | 'error'> {
  try {
    const { error } = await client.rpc('grant_consent', { p_purpose: purpose, p_text_version: CONSENT_TEXTS[purpose].version });
    return error ? 'error' : 'ok';
  } catch {
    return 'error';
  }
}

export async function withdrawConsent(purpose: ConsentPurpose, erase: boolean, client: ConsentClient): Promise<'ok' | 'error'> {
  try {
    const { error } = await client.rpc('withdraw_consent', { p_purpose: purpose, p_erase: erase });
    return error ? 'error' : 'ok';
  } catch {
    return 'error';
  }
}

export type ConsentEvent = { purpose: ConsentPurpose; action: 'granted' | 'withdrawn'; created_at: string };

/** Date du dernier accord en cours, pour l'affichage (null si pas d'accord en cours). */
export function currentGrantDate(events: ConsentEvent[], purpose: ConsentPurpose): string | null {
  const mine = events
    .filter((e) => e.purpose === purpose)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
  const last = mine[mine.length - 1];
  return last && last.action === 'granted' ? last.created_at : null;
}

export async function fetchConsentEvents(userId: string, client: ConsentClient): Promise<ConsentEvent[] | null> {
  try {
    const { data, error } = await client
      .from('user_consents')
      .select('purpose, action, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    return error || !Array.isArray(data) ? null : (data as ConsentEvent[]);
  } catch {
    return null;
  }
}

/** Erreur Supabase due à une règle RLS (accord absent ou retiré). */
export function isConsentDenied(error: { code?: string; message?: string } | null | undefined): boolean {
  return !!error && (error.code === '42501' || /row-level security/i.test(error.message ?? ''));
}
