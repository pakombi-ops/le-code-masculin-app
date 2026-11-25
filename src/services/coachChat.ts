/**
 * SERVICE — coachChat (src/services/coachChat.ts)
 * Envoie un message au coach IA (lcm-backend, POST /api/chat-simple).
 *
 * Authentification : jeton d'accès Supabase de l'utilisateur connecté.
 * Le serveur identifie l'utilisateur à partir du jeton et compte lui-même
 * le quota de messages gratuits : on n'envoie jamais d'identifiant.
 */

export const COACH_BACKEND_URL = 'https://lcm-backend-production-efd1.up.railway.app';
export const COACH_CHAT_URL = `${COACH_BACKEND_URL}/api/chat-simple`;

export type CoachHistoryItem = { role: 'user' | 'assistant'; content: string };

export type ServerQuota = {
  messages_used: number;
  is_premium: boolean;
  free_limit?: number;
};

export type CoachChatResult =
  | { kind: 'ok'; text: string; quota: ServerQuota | null }
  | { kind: 'no_session' }
  | { kind: 'unauthorized' }
  | { kind: 'limit_reached'; quota: ServerQuota | null }
  | { kind: 'rate_limited' }
  | { kind: 'bad_request'; message: string | null }
  | { kind: 'error'; quota: ServerQuota | null };

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

const readQuota = (body: any): ServerQuota | null => {
  const q = body?.quota;
  if (!q || typeof q.messages_used !== 'number' || typeof q.is_premium !== 'boolean') return null;
  return q;
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
        conversationHistory: input.history.map(({ role, content }) => ({ role, content })),
      }),
    });
  } catch {
    return { kind: 'error', quota: null };
  }

  const body = await parseJsonSafe(response);
  const quota = readQuota(body);

  if (response.status === 401) return { kind: 'unauthorized' };
  if (response.status === 402) return { kind: 'limit_reached', quota };
  if (response.status === 429) return { kind: 'rate_limited' };
  if (response.status === 400) {
    const msg = typeof body?.error === 'string' ? body.error : null;
    return { kind: 'bad_request', message: msg };
  }
  if (!response.ok || typeof body?.response !== 'string') return { kind: 'error', quota };

  return { kind: 'ok', text: body.response, quota };
}
