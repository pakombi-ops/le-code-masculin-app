/**
 * SERVICE — entitlements (src/services/entitlements.ts)
 *
 * linkAccount : relie l'abonnement acheté sur le site au compte connecté
 * (lcm-backend, POST /api/link-account).
 * Authentification : jeton d'accès Supabase. Le serveur lit lui-même l'id et
 * l'email (confirmé) du compte : on n'envoie jamais d'email ni d'identifiant.
 */

export const ENTITLEMENTS_BACKEND_URL = 'https://lcm-backend-production-efd1.up.railway.app';
export const LINK_ACCOUNT_URL = `${ENTITLEMENTS_BACKEND_URL}/api/link-account`;

export type LinkAccountResult =
  | { kind: 'linked'; email: string | null }
  | { kind: 'no_customer'; email: string | null }
  | { kind: 'no_active_subscription'; email: string | null }
  | { kind: 'email_not_confirmed' }
  | { kind: 'no_session' }
  | { kind: 'unauthorized' }
  | { kind: 'error' };

type SessionLike = { access_token?: string | null } | null;

export interface LinkAccountDeps {
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

export async function linkAccount(deps: LinkAccountDeps): Promise<LinkAccountResult> {
  const { data, error } = await deps.getSession();
  const token = data?.session?.access_token;
  if (error || !token) return { kind: 'no_session' };

  const fetchFn = deps.fetchFn ?? fetch;
  let response: Response;
  try {
    response = await fetchFn(LINK_ACCOUNT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: '{}',
    });
  } catch {
    return { kind: 'error' };
  }

  const body = await parseJsonSafe(response);
  const email = typeof body?.email === 'string' ? body.email : null;

  if (response.status === 401) return { kind: 'unauthorized' };
  if (response.status === 403 && body?.reason === 'email_not_confirmed') return { kind: 'email_not_confirmed' };
  if (!response.ok) return { kind: 'error' };

  if (body?.linked === true) return { kind: 'linked', email };
  if (body?.reason === 'no_customer') return { kind: 'no_customer', email };
  if (body?.reason === 'no_active_subscription') return { kind: 'no_active_subscription', email };
  return { kind: 'error' };
}

export const checkEntitlementStatus = async (supabaseUserId: string) => {
  const response = await fetch(`${ENTITLEMENTS_BACKEND_URL}/api/entitlement-status/${supabaseUserId}`);
  return response.json();
};
