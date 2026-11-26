/**
 * Retour du checkout Stripe dans l'app (lecodemasculin://checkout-return?status=…&session_id=…).
 *
 * Sur Android, le retour arrive à DEUX endroits à la fois :
 *   - WebBrowser.openAuthSessionAsync, attendu par PaywallScreen ;
 *   - Expo Router, qui reçoit le même lien entrant et ouvre la route
 *     app/checkout-return.tsx.
 * Ce module fait en sorte qu'un seul des deux affiche l'alerte, et ne décide
 * jamais de l'accès : il relance checkEntitlement (lecture serveur) et
 * n'affiche que ce que le serveur répond.
 */

export type CheckoutReturnStatus = 'success' | 'cancelled' | 'unknown';

export interface CheckoutReturn {
  status: CheckoutReturnStatus;
  sessionId: string | null;
}

type ParamValue = string | string[] | undefined | null;

function first(value: ParamValue): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function normalizeStatus(value: ParamValue): CheckoutReturnStatus {
  const s = first(value)?.toLowerCase();
  if (s === 'success') return 'success';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel') return 'cancelled';
  return 'unknown';
}

/** Paramètres de route (useLocalSearchParams) → retour normalisé. */
export function parseCheckoutParams(params: { status?: ParamValue; session_id?: ParamValue }): CheckoutReturn {
  return { status: normalizeStatus(params.status), sessionId: first(params.session_id) };
}

/** URL complète (résultat de openAuthSessionAsync) → retour normalisé. */
export function parseCheckoutUrl(url: string | null | undefined): CheckoutReturn {
  if (!url) return { status: 'unknown', sessionId: null };
  const q = url.indexOf('?');
  if (q < 0) return { status: 'unknown', sessionId: null };
  const query = url.slice(q + 1).split('#')[0];
  const params: Record<string, string> = {};
  for (const pair of query.split('&')) {
    if (!pair) continue;
    const [k, ...rest] = pair.split('=');
    try {
      params[decodeURIComponent(k)] = decodeURIComponent(rest.join('=').replace(/\+/g, ' '));
    } catch {
      // paramètre mal encodé : ignoré
    }
  }
  return parseCheckoutParams(params);
}

// ------------------------------------------------------------ coordination Paywall ↔ route
let inFlight = false;
let delivered: CheckoutReturn | null = null;
const handled = new Set<string>();

function keyOf(r: CheckoutReturn): string {
  return r.sessionId ? `session:${r.sessionId}` : `status:${r.status}`;
}

/** PaywallScreen : juste avant openAuthSessionAsync. */
export function markCheckoutStarted(): void {
  inFlight = true;
  delivered = null;
  handled.clear();
}

/** PaywallScreen : dès que openAuthSessionAsync a rendu la main. Renvoie le retour reçu par la route, s'il y en a un. */
export function markCheckoutEnded(): CheckoutReturn | null {
  inFlight = false;
  const d = delivered;
  delivered = null;
  return d;
}

/** Route : PaywallScreen attend-il encore la fin du navigateur ? */
export function isCheckoutInFlight(): boolean {
  return inFlight;
}

/** Route : confie le retour à PaywallScreen (qui l'utilisera si le navigateur ne le lui a pas transmis). */
export function deliverCheckoutReturn(r: CheckoutReturn): void {
  delivered = r;
}

/** Vrai une seule fois par retour : celui qui l'obtient affiche l'alerte. */
export function claimCheckoutReturn(r: CheckoutReturn): boolean {
  const key = keyOf(r);
  if (handled.has(key)) return false;
  handled.add(key);
  return true;
}

/** Tests uniquement. */
export function __resetCheckoutReturnState(): void {
  inFlight = false;
  delivered = null;
  handled.clear();
}

// ------------------------------------------------------------ alerte
export type CheckoutOutcome = 'activated' | 'pending' | 'cancelled' | 'none';

export interface PresentDeps {
  userId: string | null | undefined;
  /** Relit l'accès sur le serveur (useAuthStore.checkEntitlement). */
  checkEntitlement: (userId: string) => Promise<void>;
  /** Accès tel que relu (useAuthStore.getState().entitlement.active). */
  isActive: () => boolean;
  /** Alert.alert, avec un seul bouton dont l'appui résout la promesse. */
  alert: (title: string, message: string, onClose: () => void) => void;
}

export const CHECKOUT_MESSAGES = {
  activated: { title: 'Accès activé 🎉', message: 'Ton accès premium est actif.' },
  pending: {
    title: 'Paiement reçu',
    message: "Ton accès premium s'active dans les prochaines minutes. Reviens sur cet écran si besoin.",
  },
  cancelled: { title: 'Paiement annulé', message: "Le paiement n'a pas été finalisé. Tu peux réessayer quand tu veux." },
} as const;

/**
 * Relance la lecture de l'accès puis affiche l'alerte. N'accorde jamais rien :
 * « Accès activé » n'apparaît que si le serveur répond actif.
 * Résout quand l'utilisateur ferme l'alerte (ou tout de suite si rien n'est affiché).
 */
export async function presentCheckoutReturn(r: CheckoutReturn, deps: PresentDeps): Promise<CheckoutOutcome> {
  if (deps.userId) {
    try {
      await deps.checkEntitlement(deps.userId);
    } catch {
      // checkEntitlement garde l'état précédent en cas d'erreur
    }
  }
  let outcome: CheckoutOutcome;
  if (r.status === 'success') outcome = deps.isActive() ? 'activated' : 'pending';
  else if (r.status === 'cancelled') outcome = 'cancelled';
  else outcome = 'none';

  if (outcome === 'none') return outcome;
  const { title, message } = CHECKOUT_MESSAGES[outcome];
  await new Promise<void>((resolve) => deps.alert(title, message, resolve));
  return outcome;
}

// ------------------------------------------------------------ route app/checkout-return.tsx
/**
 * 'origin' : revenir à l'écran d'où vient le lien (celui sous la route) ;
 * 'home'   : aller à l'accueil ;
 * 'none'   : pas de session, le layout redirige déjà vers la connexion.
 */
export type CheckoutRouteExit = 'origin' | 'home' | 'none';

/**
 * Décision de la route checkout-return (filet de sécurité). N'accorde jamais
 * d'accès : au plus, elle relance checkEntitlement via presentCheckoutReturn.
 *   - PaywallScreen attend encore le navigateur → on lui confie le retour et
 *     on revient au paywall, qui affichera l'alerte ;
 *   - retour déjà traité par PaywallScreen → on revient simplement au paywall ;
 *   - sinon (app relancée par le lien, ou session fermée sans le voir) → la
 *     route relit l'accès et affiche l'alerte elle-même.
 */
export async function handleCheckoutRoute(r: CheckoutReturn, deps: PresentDeps): Promise<CheckoutRouteExit> {
  if (!deps.userId) return 'none';
  if (isCheckoutInFlight()) {
    deliverCheckoutReturn(r);
    return 'origin';
  }
  if (!claimCheckoutReturn(r)) return 'origin';
  const outcome = await presentCheckoutReturn(r, deps);
  return outcome === 'cancelled' ? 'origin' : 'home';
}
