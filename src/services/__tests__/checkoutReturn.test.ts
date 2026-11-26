import {
  parseCheckoutParams, parseCheckoutUrl,
  markCheckoutStarted, markCheckoutEnded, isCheckoutInFlight, deliverCheckoutReturn, claimCheckoutReturn,
  presentCheckoutReturn, handleCheckoutRoute, CHECKOUT_MESSAGES, __resetCheckoutReturnState, PresentDeps,
} from '../checkoutReturn';

const SUCCESS_URL = 'lecodemasculin://checkout-return?status=success&session_id=cs_test_123';
const CANCEL_URL = 'lecodemasculin://checkout-return?status=cancelled';

/** Faux store : l'accès ne devient actif que si le « serveur » le dit. */
function fakeDeps(serverActive: boolean, opts: { userId?: string | null } = {}) {
  let active = false;
  const alerts: { title: string; message: string }[] = [];
  const deps: PresentDeps = {
    userId: opts.userId === undefined ? 'u1' : opts.userId,
    checkEntitlement: jest.fn(async () => { active = serverActive; }),
    isActive: () => active,
    alert: jest.fn((title: string, message: string, onClose: () => void) => { alerts.push({ title, message }); onClose(); }),
  };
  return { deps, alerts, isActive: () => active };
}

beforeEach(() => __resetCheckoutReturnState());

describe('lecture du retour', () => {
  it('URL de succès : statut et session', () => {
    expect(parseCheckoutUrl(SUCCESS_URL)).toEqual({ status: 'success', sessionId: 'cs_test_123' });
  });
  it('URL d\'annulation (cancelled, canceled, cancel)', () => {
    expect(parseCheckoutUrl(CANCEL_URL)).toEqual({ status: 'cancelled', sessionId: null });
    expect(parseCheckoutUrl('x://checkout-return?status=canceled').status).toBe('cancelled');
    expect(parseCheckoutUrl('x://checkout-return?status=CANCEL').status).toBe('cancelled');
  });
  it('URL sans paramètre, vide ou inconnue → unknown', () => {
    expect(parseCheckoutUrl('lecodemasculin://checkout-return').status).toBe('unknown');
    expect(parseCheckoutUrl(undefined).status).toBe('unknown');
    expect(parseCheckoutUrl('x://r?status=paid').status).toBe('unknown');
  });
  it('« status=success » ailleurs que dans le paramètre status ne compte pas', () => {
    expect(parseCheckoutUrl('x://r?note=status%3Dsuccess&status=cancelled').status).toBe('cancelled');
    expect(parseCheckoutUrl('x://r?foo=status=success').status).toBe('unknown');
  });
  it('paramètres de route (tableaux, espaces)', () => {
    expect(parseCheckoutParams({ status: ['success'], session_id: [' cs_1 '] })).toEqual({ status: 'success', sessionId: 'cs_1' });
    expect(parseCheckoutParams({})).toEqual({ status: 'unknown', sessionId: null });
  });
});

describe('presentCheckoutReturn : n\'accorde jamais rien', () => {
  it('succès + serveur actif → « Accès activé »', async () => {
    const { deps, alerts } = fakeDeps(true);
    expect(await presentCheckoutReturn(parseCheckoutUrl(SUCCESS_URL), deps)).toBe('activated');
    expect(deps.checkEntitlement).toHaveBeenCalledWith('u1');
    expect(alerts).toEqual([CHECKOUT_MESSAGES.activated]);
  });
  it('succès + serveur pas encore actif → « Paiement reçu », accès toujours inactif', async () => {
    const { deps, alerts, isActive } = fakeDeps(false);
    expect(await presentCheckoutReturn(parseCheckoutUrl(SUCCESS_URL), deps)).toBe('pending');
    expect(alerts).toEqual([CHECKOUT_MESSAGES.pending]);
    expect(isActive()).toBe(false);
  });
  it('annulation → relit l\'accès, alerte « Paiement annulé »', async () => {
    const { deps, alerts, isActive } = fakeDeps(false);
    expect(await presentCheckoutReturn(parseCheckoutUrl(CANCEL_URL), deps)).toBe('cancelled');
    expect(deps.checkEntitlement).toHaveBeenCalledWith('u1');
    expect(alerts).toEqual([CHECKOUT_MESSAGES.cancelled]);
    expect(isActive()).toBe(false);
  });
  it('statut inconnu → relit l\'accès, aucune alerte', async () => {
    const { deps, alerts } = fakeDeps(true);
    expect(await presentCheckoutReturn({ status: 'unknown', sessionId: null }, deps)).toBe('none');
    expect(deps.checkEntitlement).toHaveBeenCalled();
    expect(alerts).toEqual([]);
  });
  it('erreur de checkEntitlement → « Paiement reçu », jamais « Accès activé »', async () => {
    const { deps, alerts } = fakeDeps(true);
    deps.checkEntitlement = jest.fn().mockRejectedValue(new Error('réseau'));
    expect(await presentCheckoutReturn(parseCheckoutUrl(SUCCESS_URL), deps)).toBe('pending');
    expect(alerts).toEqual([CHECKOUT_MESSAGES.pending]);
  });
  it('attend la fermeture de l\'alerte avant de rendre la main', async () => {
    const { deps } = fakeDeps(true);
    let close: () => void = () => {};
    deps.alert = jest.fn((_t, _m, onClose) => { close = onClose; });
    let done = false;
    const p = presentCheckoutReturn(parseCheckoutUrl(SUCCESS_URL), deps).then(() => { done = true; });
    await new Promise((r) => setTimeout(r, 0));
    expect(done).toBe(false);
    close();
    await p;
    expect(done).toBe(true);
  });
});

describe('coordination PaywallScreen ↔ route', () => {
  it('un retour n\'est traité qu\'une fois ; un nouveau checkout remet à zéro', () => {
    const r = parseCheckoutUrl(SUCCESS_URL);
    expect(claimCheckoutReturn(r)).toBe(true);
    expect(claimCheckoutReturn(r)).toBe(false);
    markCheckoutStarted();
    expect(claimCheckoutReturn(r)).toBe(true);
  });
  it('le retour confié par la route est rendu une seule fois à PaywallScreen', () => {
    markCheckoutStarted();
    expect(isCheckoutInFlight()).toBe(true);
    deliverCheckoutReturn(parseCheckoutUrl(CANCEL_URL));
    expect(markCheckoutEnded()).toEqual({ status: 'cancelled', sessionId: null });
    expect(isCheckoutInFlight()).toBe(false);
    expect(markCheckoutEnded()).toBeNull();
  });
});

describe.each([
  ['success', SUCCESS_URL, CHECKOUT_MESSAGES.activated],
  ['cancelled', CANCEL_URL, CHECKOUT_MESSAGES.cancelled],
] as const)('route checkout-return, status=%s', (status, url, expectedAlert) => {
  const ret = () => parseCheckoutUrl(url);

  it('PaywallScreen attend encore → la route lui confie le retour, revient à l\'origine, sans alerte', async () => {
    markCheckoutStarted();
    const { deps, alerts } = fakeDeps(true);
    expect(await handleCheckoutRoute(ret(), deps)).toBe('origin');
    expect(alerts).toEqual([]);
    expect(deps.checkEntitlement).not.toHaveBeenCalled();
    expect(markCheckoutEnded()).toEqual(ret());
  });

  it('PaywallScreen a déjà traité le retour → la route revient à l\'origine, sans seconde alerte', async () => {
    markCheckoutStarted();
    markCheckoutEnded();
    expect(claimCheckoutReturn(ret())).toBe(true); // PaywallScreen
    const { deps, alerts } = fakeDeps(true);
    expect(await handleCheckoutRoute(ret(), deps)).toBe('origin');
    expect(alerts).toEqual([]);
  });

  it('app relancée par le lien (aucun checkout en cours) → la route relit l\'accès et affiche l\'alerte', async () => {
    const { deps, alerts } = fakeDeps(true);
    const exit = await handleCheckoutRoute(ret(), deps);
    expect(deps.checkEntitlement).toHaveBeenCalledWith('u1');
    expect(alerts).toEqual([expectedAlert]);
    expect(exit).toBe(status === 'success' ? 'home' : 'origin');
  });

  it('sans session → ne fait rien (le layout redirige vers la connexion)', async () => {
    const { deps, alerts } = fakeDeps(true, { userId: null });
    expect(await handleCheckoutRoute(ret(), deps)).toBe('none');
    expect(deps.checkEntitlement).not.toHaveBeenCalled();
    expect(alerts).toEqual([]);
  });
});

describe('PaywallScreen : navigateur fermé avant que la session ne voie le lien', () => {
  it('la session répond « dismiss », la route a reçu le lien → PaywallScreen traite le retour de la route', async () => {
    markCheckoutStarted();
    const { deps: routeDeps } = fakeDeps(true);
    await handleCheckoutRoute(parseCheckoutUrl(CANCEL_URL), routeDeps); // route
    const fromRoute = markCheckoutEnded();                              // fin de openAuthSessionAsync : dismiss
    expect(fromRoute).toEqual({ status: 'cancelled', sessionId: null });
    expect(claimCheckoutReturn(fromRoute!)).toBe(true);
    const { deps, alerts } = fakeDeps(false);
    expect(await presentCheckoutReturn(fromRoute!, deps)).toBe('cancelled');
    expect(alerts).toEqual([CHECKOUT_MESSAGES.cancelled]);
  });
});
