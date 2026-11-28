import {
  verifyDeletionPassword, deleteAccount, deletionFailureMessage, ACCOUNT_DELETE_URL,
} from '../accountDeletion';

const TOKEN = 'supabase-access-token';
const withSession = (token: string | null = TOKEN) =>
  jest.fn().mockResolvedValue({ data: { session: token ? { access_token: token } : null }, error: null });
const mockResponse = (status: number, body: unknown) =>
  ({ status, ok: status >= 200 && status < 300, text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)) }) as unknown as Response;

const makeAuth = (signInWithPassword?: jest.Mock) => ({
  signInWithPassword: signInWithPassword ?? jest.fn().mockResolvedValue({ data: { session: { access_token: 'neuf' } }, error: null }),
});

describe('verifyDeletionPassword', () => {
  it('se reconnecte avec le mot de passe du compte connecté', async () => {
    const auth = makeAuth();
    expect(await verifyDeletionPassword('homme@exemple.fr', 'secret-du-test', auth)).toBe('verified');
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'homme@exemple.fr', password: 'secret-du-test' });
  });

  it('champ vide : aucun appel', async () => {
    const auth = makeAuth();
    expect(await verifyDeletionPassword('a@b.fr', '', auth)).toBe('invalid');
    expect(await verifyDeletionPassword('', 'x', auth)).toBe('invalid');
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('mot de passe refusé (400) ou sans session → invalid', async () => {
    expect(await verifyDeletionPassword('a@b.fr', 'faux', makeAuth(jest.fn().mockResolvedValue({ data: null, error: { status: 400, message: 'Invalid login credentials' } })))).toBe('invalid');
    expect(await verifyDeletionPassword('a@b.fr', 'x', makeAuth(jest.fn().mockResolvedValue({ data: { session: null }, error: null })))).toBe('invalid');
  });

  it('429 → rate_limited ; autre erreur ou réseau → error', async () => {
    expect(await verifyDeletionPassword('a@b.fr', 'x', makeAuth(jest.fn().mockResolvedValue({ data: null, error: { status: 429 } })))).toBe('rate_limited');
    expect(await verifyDeletionPassword('a@b.fr', 'x', makeAuth(jest.fn().mockResolvedValue({ data: null, error: { status: 500 } })))).toBe('error');
    expect(await verifyDeletionPassword('a@b.fr', 'x', makeAuth(jest.fn().mockRejectedValue(new Error('offline'))))).toBe('error');
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
