/**
 * SERVICE — appCheckout (src/services/appCheckout.ts)
 * Démarre un checkout Stripe via le plugin WordPress pc-pricing (v1.4.1+).
 *
 * Authentification : jeton d'accès Supabase de l'utilisateur connecté.
 * Le serveur récupère lui-même id + email auprès de Supabase : on n'envoie
 * jamais d'email ni d'identifiant dans le corps.
 */

export const APP_CHECKOUT_URL = 'https://pilierconscient.com/wp-json/pc-pricing/v1/app-checkout';

export type CheckoutPlan = 'monthly' | 'annual';

export type CheckoutResult =
  | { kind: 'ok'; url: string }
  | { kind: 'no_session' }
  | { kind: 'unauthorized' }
  | { kind: 'bad_request'; message: string | null }
  | { kind: 'error' };

type SessionLike = { access_token?: string | null } | null;

export interface CheckoutDeps {
  /** Typiquement : () => supabase.auth.getSession() */
  getSession: () => Promise<{ data: { session: SessionLike }; error?: unknown }>;
  fetchFn?: typeof fetch;
}

export interface CheckoutInput {
  plan: CheckoutPlan;
  prenom: string;
  redirectUrl: string;
}

const parseJsonSafe = async (response: Response): Promise<any> => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

const serverMessage = (data: any): string | null => {
  const msg = data?.message ?? data?.error;
  return typeof msg === 'string' && msg.trim() ? msg : null;
};

export async function startAppCheckout(
  input: CheckoutInput,
  deps: CheckoutDeps
): Promise<CheckoutResult> {
  const { data, error } = await deps.getSession();
  const token = data?.session?.access_token;
  if (error || !token) return { kind: 'no_session' };

  const fetchFn = deps.fetchFn ?? fetch;
  let response: Response;
  try {
    response = await fetchFn(APP_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-PC-User-Token': token,
      },
      body: JSON.stringify({
        plan: input.plan,
        prenom: input.prenom,
        redirect_url: input.redirectUrl,
      }),
    });
  } catch {
    return { kind: 'error' };
  }

  const body = await parseJsonSafe(response);

  if (response.status === 401) return { kind: 'unauthorized' };
  if (response.status === 400) return { kind: 'bad_request', message: serverMessage(body) };
  if (!response.ok || typeof body?.url !== 'string' || !body.url) return { kind: 'error' };

  return { kind: 'ok', url: body.url };
}
