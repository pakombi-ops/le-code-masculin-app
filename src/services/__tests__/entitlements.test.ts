import { linkAccount, LINK_ACCOUNT_URL } from '../entitlements';

const TOKEN = 'jeton-supabase';
const sessionOk = () =>
  Promise.resolve({ data: { session: { access_token: TOKEN } }, error: null });

const jsonResponse = (status: number, body: unknown) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as unknown as Response;

describe('linkAccount', () => {
  it("n'appelle pas le serveur sans session", async () => {
    const fetchFn = jest.fn();
    const result = await linkAccount({
      getSession: () => Promise.resolve({ data: { session: null } }),
      fetchFn,
    });
    expect(result).toEqual({ kind: 'no_session' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("envoie le jeton et aucun email ni identifiant", async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      jsonResponse(200, { linked: true, status: 'active', email: 'homme@exemple.fr' })
    );
    const result = await linkAccount({ getSession: sessionOk, fetchFn });

    expect(result).toEqual({ kind: 'linked', email: 'homme@exemple.fr' });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(LINK_ACCOUNT_URL);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(init.body)).toEqual({});
  });

  it.each([
    [200, { linked: false, reason: 'no_customer', email: 'a@b.fr' }, { kind: 'no_customer', email: 'a@b.fr' }],
    [200, { linked: false, reason: 'no_active_subscription', email: 'a@b.fr' }, { kind: 'no_active_subscription', email: 'a@b.fr' }],
    [403, { linked: false, reason: 'email_not_confirmed' }, { kind: 'email_not_confirmed' }],
    [401, { error: 'Session invalide' }, { kind: 'unauthorized' }],
    [500, { error: 'Erreur serveur.' }, { kind: 'error' }],
    [200, { linked: false, reason: 'inconnu' }, { kind: 'error' }],
  ])('statut %i %j', async (status, body, expected) => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(status, body));
    expect(await linkAccount({ getSession: sessionOk, fetchFn })).toEqual(expected);
  });

  it('erreur réseau → error', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await linkAccount({ getSession: sessionOk, fetchFn })).toEqual({ kind: 'error' });
  });
});
