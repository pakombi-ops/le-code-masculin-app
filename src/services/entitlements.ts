/**
 * SERVICE — entitlements (src/services/entitlements.ts)
 *
 * Appels au backend (lcm-backend a49b96c), tous authentifiés par le jeton
 * d'accès Supabase (Authorization: Bearer) :
 *   - linkAccount : POST /api/link-account { email }. Le serveur prend
 *     l'identité dans le jeton et n'accepte que l'email (confirmé) du compte
 *     connecté.
 *   - checkEntitlementStatus : GET /api/entitlement-status/:id, uniquement
 *     pour son propre identifiant (403 sinon).
 */

export const ENTITLEMENTS_BACKEND_URL = 'https://lcm-backend-production-efd1.up.railway.app';

type SessionLike = { access_token?: string | null } | null;

export interface BackendAuthDeps {
  /** Typiquement : () => supabase.auth.getSession() */
  getSession: () => Promise<{ data: { session: SessionLike }; error?: unknown }>;
  fetchFn?: typeof fetch;
}

export type LinkAccountResult = { linked: boolean; reason?: string; status?: string };

export type EntitlementStatus = {
  active: boolean;
  trialActive: boolean;
  trialEndsAt: string | null;
  planType: string | null;
  accessExpiresAt: string | null;
};

const parseJsonSafe = async (response: Response): Promise<any> => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

async function getToken(deps: BackendAuthDeps): Promise<string | null> {
  const { data, error } = await deps.getSession();
  const token = data?.session?.access_token;
  return error || !token ? null : token;
}

export async function linkAccount(email: string, deps: BackendAuthDeps): Promise<LinkAccountResult> {
  const token = await getToken(deps);
  if (!token) return { linked: false, reason: 'no_session' };

  const fetchFn = deps.fetchFn ?? fetch;
  let response: Response;
  try {
    response = await fetchFn(`${ENTITLEMENTS_BACKEND_URL}/api/link-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
  } catch {
    return { linked: false, reason: 'network_error' };
  }

  const body = await parseJsonSafe(response);
  if (response.status === 401) return { linked: false, reason: 'unauthorized' };
  if (!response.ok || !body || typeof body.linked !== 'boolean') return { linked: false, reason: 'server_error' };
  return body;
}

/**
 * Lit l'accès de l'utilisateur connecté. Lève une erreur si la réponse n'est
 * pas exploitable : l'appelant garde alors l'état précédent au lieu de
 * conclure à tort que l'accès est inactif.
 */
export async function checkEntitlementStatus(supabaseUserId: string, deps: BackendAuthDeps): Promise<EntitlementStatus> {
  const token = await getToken(deps);
  if (!token) throw new Error('no_session');

  const fetchFn = deps.fetchFn ?? fetch;
  const response = await fetchFn(`${ENTITLEMENTS_BACKEND_URL}/api/entitlement-status/${encodeURIComponent(supabaseUserId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await parseJsonSafe(response);
  if (!response.ok || !body || typeof body.active !== 'boolean') {
    throw new Error(`entitlement-status ${response.status}`);
  }
  return body;
}
