import { requestBillingPortal, BILLING_PORTAL_URL, billingPortalMessage, showManageSubscription } from '../billingPortal';

describe('showManageSubscription', () => {
  it('visible seulement avec un abonnement en cours, hors iOS', () => {
    expect(showManageSubscription({ hasSubscription: true }, 'android')).toBe(true);
    expect(showManageSubscription({ hasSubscription: true }, 'ios')).toBe(false);
    expect(showManageSubscription({ hasSubscription: false }, 'android')).toBe(false);
    expect(showManageSubscription({}, 'android')).toBe(false); // ancien backend : champ absent
  });
});

const TOKEN = 'supabase-access-token';
const withSession = (token: string | null = TOKEN) =>
  jest.fn().mockResolvedValue({ data: { session: token ? { access_token: token } : null }, error: null });
const mockResponse = (status: number, body: unknown) =>
  ({ status, ok: status >= 200 && status < 300, text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)) }) as unknown as Response;

describe('requestBillingPortal', () => {
  it('aucun appel réseau sans session', async () => {
    const fetchFn = jest.fn();
    expect(await requestBillingPortal({ getSession: withSession(null), fetchFn })).toEqual({ kind: 'no_session' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('envoie le jeton et un corps vide (ni identifiant ni URL de retour)', async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(200, { url: 'https://billing.stripe.com/p/session/test_123' }));
    const result = await requestBillingPortal({ getSession: withSession(), fetchFn });
    expect(result).toEqual({ kind: 'ok', url: 'https://billing.stripe.com/p/session/test_123' });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(BILLING_PORTAL_URL);
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(init.body).toBe('{}');
  });

  it.each([
    [401, { error: 'x' }, 'unauthorized'],
    [404, { code: 'no_customer' }, 'no_customer'],
    [409, { code: 'transmission_plan' }, 'transmission_plan'],
    [500, { error: 'portal_failed' }, 'error'],
    [200, 'pas du json', 'error'],
    [200, { url: 'https://pirate.test/portail' }, 'error'],
    [200, { url: 'http://billing.stripe.com/p/session/x' }, 'error'],
  ])('HTTP %s %j → %s', async (status, body, kind) => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(status as number, body));
    expect((await requestBillingPortal({ getSession: withSession(), fetchFn })).kind).toBe(kind);
  });

  it('erreur réseau → error', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await requestBillingPortal({ getSession: withSession(), fetchFn })).toEqual({ kind: 'error' });
  });

  it('chaque cas a un message', () => {
    for (const kind of ['no_customer', 'transmission_plan', 'no_session', 'unauthorized', 'error'] as const) {
      expect(billingPortalMessage(kind).message.length).toBeGreaterThan(10);
    }
  });
});
