import {
  sendDeletionCode, verifyDeletionCode, deleteAccount, deletionFailureMessage, ACCOUNT_DELETE_URL,
} from '../accountDeletion';

const TOKEN = 'supabase-access-token';
const withSession = (token: string | null = TOKEN) =>
  jest.fn().mockResolvedValue({ data: { session: token ? { access_token: token } : null }, error: null });
const mockResponse = (status: number, body: unknown) =>
  ({ status, ok: status >= 200 && status < 300, text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)) }) as unknown as Response;

const makeAuth = (overrides: Partial<Record<'signInWithOtp' | 'verifyOtp', jest.Mock>> = {}) => ({
  signInWithOtp: overrides.signInWithOtp ?? jest.fn().mockResolvedValue({ error: null }),
  verifyOtp: overrides.verifyOtp ?? jest.fn().mockResolvedValue({ data: { session: { access_token: 'neuf' } }, error: null }),
});

describe('sendDeletionCode', () => {
  it('envoie un code au compte existant, sans jamais créer de compte', async () => {
    const auth = makeAuth();
    expect(await sendDeletionCode('homme@exemple.fr', auth)).toBe('sent');
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'homme@exemple.fr', options: { shouldCreateUser: false } });
  });

  it('429 → rate_limited, autre erreur → error', async () => {
    expect(await sendDeletionCode('a@b.fr', makeAuth({ signInWithOtp: jest.fn().mockResolvedValue({ error: { status: 429 } }) }))).toBe('rate_limited');
    expect(await sendDeletionCode('a@b.fr', makeAuth({ signInWithOtp: jest.fn().mockResolvedValue({ error: { message: 'x' } }) }))).toBe('error');
  });
});

describe('verifyDeletionCode', () => {
  it('vérifie le code (type email), espaces retirés', async () => {
    const auth = makeAuth();
    expect(await verifyDeletionCode('a@b.fr', ' 123 456 ', auth)).toBe('verified');
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.fr', token: '123456', type: 'email' });
  });

  it('code mal formé : aucun appel', async () => {
    const auth = makeAuth();
    for (const code of ['', '12', 'abcdef']) expect(await verifyDeletionCode('a@b.fr', code, auth)).toBe('invalid');
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('code refusé ou sans session → invalid', async () => {
    expect(await verifyDeletionCode('a@b.fr', '123456', makeAuth({ verifyOtp: jest.fn().mockResolvedValue({ data: null, error: { message: 'expired' } }) }))).toBe('invalid');
    expect(await verifyDeletionCode('a@b.fr', '123456', makeAuth({ verifyOtp: jest.fn().mockResolvedValue({ data: { session: null }, error: null }) }))).toBe('invalid');
  });
});

describe('deleteAccount', () => {
  const input = { confirm: 'SUPPRIMER', eraseCommunityText: true };

  it('aucun appel sans session', async () => {
    const fetchFn = jest.fn();
    expect(await deleteAccount(input, { getSession: withSession(null), fetchFn })).toEqual({ kind: 'no_session' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('DELETE avec le jeton, le mot de confirmation et le choix pour la communauté', async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(200, { deleted: true, canceledSubscriptions: 1, pending: [] }));
    const result = await deleteAccount({ confirm: 'SUPPRIMER', eraseCommunityText: false }, { getSession: withSession(), fetchFn });
    expect(result).toEqual({ kind: 'deleted', pending: [] });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(ACCOUNT_DELETE_URL);
    expect(init.method).toBe('DELETE');
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(init.body)).toEqual({ confirm: 'SUPPRIMER', eraseCommunityText: false });
  });

  it.each([
    [403, { error: 'reauth_required' }, 'reauth_required'],
    [409, { error: 'founder_protected' }, 'founder_protected'],
    [409, { error: 'transmission_plan' }, 'transmission_plan'],
    [503, { error: 'delete_unavailable' }, 'unavailable'],
    [401, { error: 'Session invalide.' }, 'no_session'],
    [500, { error: 'delete_failed' }, 'error'],
    [200, { deleted: false }, 'error'],
    [200, 'pas du json', 'error'],
  ])('HTTP %s %j → %s', async (status, body, kind) => {
    const fetchFn = jest.fn().mockResolvedValue(mockResponse(status as number, body));
    expect((await deleteAccount(input, { getSession: withSession(), fetchFn })).kind).toBe(kind);
  });

  it('erreur réseau → error', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await deleteAccount(input, { getSession: withSession(), fetchFn })).toEqual({ kind: 'error' });
  });

  it('chaque échec a un message', () => {
    for (const kind of ['reauth_required', 'founder_protected', 'transmission_plan', 'unavailable', 'no_session', 'error'] as const) {
      expect(deletionFailureMessage(kind).length).toBeGreaterThan(10);
    }
  });
});
