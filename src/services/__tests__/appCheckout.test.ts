import { startAppCheckout, APP_CHECKOUT_URL } from '../appCheckout';

const TOKEN = 'supabase-access-token';
const input = { plan: 'annual' as const, prenom: 'Jean', redirectUrl: 'lecodemasculin://checkout-return' };

const withSession = (token: string | null = TOKEN) =>
  jest.fn().mockResolvedValue({ data: { session: token ? { access_token: token } : null }, error: null });

const mockResponse = (status: number, body: string) =>
  ({ status, ok: status >= 200 && status < 300, text: () => Promise.resolve(body) }) as unknown as Response;

describe('startAppCheckout', () => {
  it("ne fait aucun appel réseau sans session", async () => {
    const fetchFn = jest.fn();
    const result = await startAppCheckout(input, { getSession: withSession(null), fetchFn });
    expect(result).toEqual({ kind: 'no_session' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("ne fait aucun appel si getSession renvoie une erreur", async () => {
    const fetchFn = jest.fn();
    const getSession = jest.fn().mockResolvedValue({ data: { session: null }, error: new Error('x') });
    expect(await startAppCheckout(input, { getSession, fetchFn })).toEqual({ kind: 'no_session' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("envoie le jeton Supabase et un corps sans email ni id", async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(200, JSON.stringify({ url: 'https://checkout.stripe.com/x' })));
    const result = await startAppCheckout(input, { getSession: withSession(), fetchFn });

    expect(result).toEqual({ kind: 'ok', url: 'https://checkout.stripe.com/x' });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(APP_CHECKOUT_URL);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'X-PC-User-Token': TOKEN,
    });
    const headerNames = Object.keys(init.headers).map((h) => h.toLowerCase());
    expect(headerNames).not.toContain('x-pc-app-secret');
    expect(JSON.parse(init.body)).toEqual({
      plan: 'annual',
      prenom: 'Jean',
      redirect_url: 'lecodemasculin://checkout-return',
    });
  });

  it("401 → unauthorized", async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(401, '{"code":"rest_forbidden"}'));
    expect(await startAppCheckout(input, { getSession: withSession(), fetchFn })).toEqual({ kind: 'unauthorized' });
  });

  it("400 → message du serveur", async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(400, JSON.stringify({ message: 'Plan invalide' })));
    expect(await startAppCheckout(input, { getSession: withSession(), fetchFn })).toEqual({
      kind: 'bad_request',
      message: 'Plan invalide',
    });
  });

  it("400 non JSON → bad_request sans message", async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(400, '<html>Bad</html>'));
    expect(await startAppCheckout(input, { getSession: withSession(), fetchFn })).toEqual({
      kind: 'bad_request',
      message: null,
    });
  });

  it("500 → erreur générique", async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(500, '{"message":"boom"}'));
    expect(await startAppCheckout(input, { getSession: withSession(), fetchFn })).toEqual({ kind: 'error' });
  });

  it("200 non JSON → erreur générique sans planter", async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(200, '<html>maintenance</html>'));
    expect(await startAppCheckout(input, { getSession: withSession(), fetchFn })).toEqual({ kind: 'error' });
  });

  it("200 sans url → erreur générique", async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(200, '{}'));
    expect(await startAppCheckout(input, { getSession: withSession(), fetchFn })).toEqual({ kind: 'error' });
  });

  it("erreur réseau → erreur générique", async () => {
    const fetchFn = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    expect(await startAppCheckout(input, { getSession: withSession(), fetchFn })).toEqual({ kind: 'error' });
  });
});
