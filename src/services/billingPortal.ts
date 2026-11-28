/**
 * SERVICE — billingPortal (src/services/billingPortal.ts)
 * « Gérer mon abonnement » : demande au backend une session du Stripe Customer
 * Portal (POST /api/billing-portal), authentifiée par le jeton Supabase.
 *
 * Le serveur choisit seul le client Stripe (celui de l'utilisateur connecté) et
 * l'URL de retour : le corps est vide, on n'envoie ni identifiant ni URL.
 * Annulation, mise en pause, carte et factures se gèrent dans le portail.
 */
import { ENTITLEMENTS_BACKEND_URL } from './entitlements';

/** Doit être identique à PORTAL_RETURN_URL côté backend (défaut). */
export const BILLING_RETURN_URL = 'lecodemasculin://billing-return';
export const BILLING_PORTAL_URL = `${ENTITLEMENTS_BACKEND_URL}/api/billing-portal`;

export type BillingPortalResult =
  | { kind: 'ok'; url: string }
  | { kind: 'no_session' }
  | { kind: 'unauthorized' }
  | { kind: 'no_customer' }
  | { kind: 'transmission_plan' }
  | { kind: 'error' };

type SessionLike = { access_token?: string | null } | null;

export interface BillingPortalDeps {
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

export async function requestBillingPortal(deps: BillingPortalDeps): Promise<BillingPortalResult> {
  const { data, error } = await deps.getSession();
  const token = data?.session?.access_token;
  if (error || !token) return { kind: 'no_session' };

  const fetchFn = deps.fetchFn ?? fetch;
  let response: Response;
  try {
    response = await fetchFn(BILLING_PORTAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: '{}',
    });
  } catch {
    return { kind: 'error' };
  }

  const body = await parseJsonSafe(response);
  if (response.status === 401) return { kind: 'unauthorized' };
  if (response.status === 404 && body?.code === 'no_customer') return { kind: 'no_customer' };
  if (response.status === 409 && body?.code === 'transmission_plan') return { kind: 'transmission_plan' };
  // N'ouvre que le portail Stripe : jamais une autre adresse renvoyée par erreur.
  if (response.ok && typeof body?.url === 'string' && body.url.startsWith('https://billing.stripe.com/')) {
    return { kind: 'ok', url: body.url };
  }
  return { kind: 'error' };
}

/** Message affiché pour chaque cas autre que « ok » et « session expirée ». */
export function billingPortalMessage(kind: Exclude<BillingPortalResult['kind'], 'ok'>): { title: string; message: string } {
  switch (kind) {
    case 'no_customer':
      return { title: 'Aucun abonnement à gérer', message: "Ton accès n'est pas lié à un abonnement Stripe. Si tu as payé sur le site avec une autre adresse, contacte le support." };
    case 'transmission_plan':
      return { title: 'La Transmission', message: 'Ton paiement de La Transmission est en cours. Pour toute modification, contacte le support.' };
    case 'no_session':
    case 'unauthorized':
      return { title: 'Session expirée', message: 'Session expirée, reconnecte-toi.' };
    default:
      return { title: 'Erreur', message: "Impossible d'ouvrir la gestion de l'abonnement. Vérifie ta connexion et réessaie." };
  }
}
