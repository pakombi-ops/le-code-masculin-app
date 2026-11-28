/**
 * SERVICE — accountDeletion (src/services/accountDeletion.ts)
 * « Supprimer mon compte » : confirmation par le MOT DE PASSE du compte
 * (réauthentification), puis DELETE /api/account avec le mot « SUPPRIMER ».
 *
 * Le serveur exige une connexion de moins de 5 minutes (last_sign_in_at de la
 * session) : la saisie du mot de passe et l'appel doivent se suivre.
 * Il résilie lui-même l'abonnement en cours (immédiatement, sans remboursement).
 */
import { ENTITLEMENTS_BACKEND_URL } from './entitlements';

export const ACCOUNT_DELETE_URL = `${ENTITLEMENTS_BACKEND_URL}/api/account`;
export const CONFIRMATION_WORD = 'SUPPRIMER';

type AuthError = { message?: string; status?: number } | null;

export interface DeletionAuth {
  signInWithPassword: (args: { email: string; password: string }) => Promise<{ data: { session: unknown } | null; error: AuthError }>;
}

/**
 * Vérifie le mot de passe du compte connecté : ouvre une session neuve, celle
 * que le serveur accepte. Ne crée jamais de compte.
 */
export async function verifyDeletionPassword(
  email: string,
  password: string,
  auth: DeletionAuth
): Promise<'verified' | 'invalid' | 'rate_limited' | 'error'> {
  if (!email || !password) return 'invalid';
  let result: Awaited<ReturnType<DeletionAuth['signInWithPassword']>>;
  try {
    result = await auth.signInWithPassword({ email, password });
  } catch {
    return 'error';
  }
  const { data, error } = result;
  if (!error && data?.session) return 'verified';
  if (error?.status === 429) return 'rate_limited';
  if (!error || error.status === 400) return 'invalid';
  return 'error';
}

export type DeleteAccountResult =
  | { kind: 'deleted'; pending: string[] }
  | { kind: 'reauth_required' }
  | { kind: 'founder_protected' }
  | { kind: 'transmission_plan' }
  | { kind: 'unavailable' }
  | { kind: 'no_session' }
  | { kind: 'error' };

type SessionLike = { access_token?: string | null } | null;

export interface DeleteAccountDeps {
  getSession: () => Promise<{ data: { session: SessionLike }; error?: unknown }>;
  fetchFn?: typeof fetch;
}

const parseJsonSafe = async (response: Response): Promise<any> => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

export async function deleteAccount(
  input: { confirm: string; eraseCommunityText: boolean },
  deps: DeleteAccountDeps
): Promise<DeleteAccountResult> {
  const { data, error } = await deps.getSession();
  const token = data?.session?.access_token;
  if (error || !token) return { kind: 'no_session' };

  const fetchFn = deps.fetchFn ?? fetch;
  let response: Response;
  try {
    response = await fetchFn(ACCOUNT_DELETE_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ confirm: input.confirm, eraseCommunityText: input.eraseCommunityText }),
    });
  } catch {
    return { kind: 'error' };
  }

  const body = await parseJsonSafe(response);
  if (response.ok && body?.deleted === true) {
    return { kind: 'deleted', pending: Array.isArray(body.pending) ? body.pending : [] };
  }
  switch (body?.error) {
    case 'reauth_required': return { kind: 'reauth_required' };
    case 'founder_protected': return { kind: 'founder_protected' };
    case 'transmission_plan': return { kind: 'transmission_plan' };
    case 'delete_unavailable': return { kind: 'unavailable' };
    default: return response.status === 401 ? { kind: 'no_session' } : { kind: 'error' };
  }
}

/** Message affiché pour chaque échec. */
export function deletionFailureMessage(kind: Exclude<DeleteAccountResult['kind'], 'deleted'>): string {
  switch (kind) {
    case 'reauth_required': return 'Ta confirmation a expiré (plus de 5 minutes). Saisis à nouveau ton mot de passe.';
    case 'founder_protected': return 'Ce compte ne peut pas être supprimé.';
    case 'transmission_plan': return 'Ton paiement de La Transmission est en cours : contacte le support pour supprimer ton compte.';
    case 'unavailable': return 'La suppression de compte n’est pas encore disponible. Contacte le support.';
    case 'no_session': return 'Session expirée. Saisis à nouveau ton mot de passe.';
    default: return 'La suppression n’a pas pu se terminer. Réessaie ; si le problème continue, contacte le support.';
  }
}
