/**
 * SERVICE — coachChat (src/services/coachChat.ts)
 * Envoie un message au coach IA (lcm-backend, POST /api/chat-simple).
 *
 * Authentification : jeton d'accès Supabase (Authorization: Bearer). Le
 * serveur identifie l'utilisateur à partir du jeton et compte lui-même les
 * messages gratuits : on n'envoie jamais d'identifiant.
 *
 * Réponses du backend (lcm-backend a49b96c) :
 *   200 { response, quota: { used, limit, premium } }  réponse normale
 *   200 { response, safety: true }                      réponse de crise (pas de quota)
 *   402 { error: 'quota_exceeded', used, limit }        messages gratuits épuisés
 *   429                                                 trop de messages / serveur occupé
 *   401                                                 session absente ou expirée
 *   400 { error }                                       message invalide
 *   502 { error: 'provider_error' }                     le fournisseur IA a échoué, y compris
 *                                                       limite de dépense Anthropic atteinte
 *   503 { error: 'quota_unavailable' }                  base indisponible
 *   → 502 / 503 / 529 : « coach momentanément indisponible »
 */

export const COACH_BACKEND_URL = 'https://lcm-backend-production-efd1.up.railway.app';
export const COACH_CHAT_URL = `${COACH_BACKEND_URL}/api/chat-simple`;

export type CoachHistoryItem = { role: 'user' | 'assistant'; content: string };

/** Quota tel que renvoyé par le serveur. used/limit valent null pour un premium. */
export type ServerQuota = { used: number | null; limit: number | null; premium: boolean };

export type CoachChatResult =
  | { kind: 'ok'; text: string; quota: ServerQuota | null; safety: boolean }
  | { kind: 'limit_reached'; used: number | null; limit: number | null }
  | { kind: 'no_session' }
  | { kind: 'unauthorized' }
  | { kind: 'rate_limited' }
  | { kind: 'bad_request'; message: string | null }
  | { kind: 'unavailable' }
  | { kind: 'error' };

/** Statuts où le coach lui-même est indisponible (fournisseur IA, limite de dépense, base). */
const UNAVAILABLE_STATUSES = [502, 503, 529];

type SessionLike = { access_token?: string | null } | null;

export interface CoachChatDeps {
  /** Typiquement : () => supabase.auth.getSession() */
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

/** Le serveur n'utilise que les 20 derniers messages : inutile d'envoyer plus (corps limité à 64 Ko). */
export const MAX_HISTORY_MESSAGES = 20;

/**
 * Historique envoyé au serveur : messages déjà échangés, SANS le message en cours
 * (envoyé à part dans `message`), sans contenu vide, réduits à role/content,
 * 20 derniers au plus.
 */
export const buildCoachHistory = (items: CoachHistoryItem[]): CoachHistoryItem[] =>
  items
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim() !== '')
    .slice(-MAX_HISTORY_MESSAGES)
    .map(({ role, content }) => ({ role, content }));

const numOrNull =(v: unknown) => (typeof v === 'number' ? v : null);

const readQuota = (body: any): ServerQuota | null => {
  const q = body?.quota;
  if (!q || typeof q.premium !== 'boolean') return null;
  return { used: numOrNull(q.used), limit: numOrNull(q.limit), premium: q.premium };
};

export async function sendCoachMessage(
  input: { message: string; history: CoachHistoryItem[] },
  deps: CoachChatDeps
): Promise<CoachChatResult> {
  const { data, error } = await deps.getSession();
  const token = data?.session?.access_token;
  if (error || !token) return { kind: 'no_session' };

  const fetchFn = deps.fetchFn ?? fetch;
  let response: Response;
  try {
    response = await fetchFn(COACH_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: input.message,
        conversationHistory: buildCoachHistory(input.history),
      }),
    });
  } catch {
    return { kind: 'error' };
  }

  const body = await parseJsonSafe(response);

  if (response.status === 401) return { kind: 'unauthorized' };
  if (response.status === 402) return { kind: 'limit_reached', used: numOrNull(body?.used), limit: numOrNull(body?.limit) };
  if (response.status === 429) return { kind: 'rate_limited' };
  if (response.status === 400) {
    return { kind: 'bad_request', message: typeof body?.error === 'string' ? body.error : null };
  }
  if (UNAVAILABLE_STATUSES.includes(response.status)) return { kind: 'unavailable' };
  if (!response.ok || typeof body?.response !== 'string') return { kind: 'error' };

  return { kind: 'ok', text: body.response, quota: readQuota(body), safety: body.safety === true };
}
