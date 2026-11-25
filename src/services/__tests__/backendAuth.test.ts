import { sendCoachMessage, buildCoachHistory, COACH_CHAT_URL, MAX_HISTORY_MESSAGES } from '../coachChat';
import { linkAccount, checkEntitlementStatus, ENTITLEMENTS_BACKEND_URL } from '../entitlements';

const TOKEN = 'jeton-supabase';
const sessionOk = () => Promise.resolve({ data: { session: { access_token: TOKEN } }, error: null });
const noSession = () => Promise.resolve({ data: { session: null } });

const jsonResponse = (status: number, body: unknown) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as unknown as Response;

describe('sendCoachMessage (format a49b96c)', () => {
  it("n'appelle pas le serveur sans session", async () => {
    const fetchFn = jest.fn();
    expect(await sendCoachMessage({ message: 'x', history: [] }, { getSession: noSession, fetchFn })).toEqual({ kind: 'no_session' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('envoie le jeton, le message et un historique réduit à role/content', async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      jsonResponse(200, { response: 'Réponse', quota: { used: 3, limit: 10, premium: false } })
    );
    const result = await sendCoachMessage(
      { message: 'Salut', history: [{ role: 'assistant', content: 'Bienvenue', id: 'w' } as any] },
      { getSession: sessionOk, fetchFn }
    );
    expect(result).toEqual({ kind: 'ok', text: 'Réponse', quota: { used: 3, limit: 10, premium: false }, safety: false });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(COACH_CHAT_URL);
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(init.body)).toEqual({
      message: 'Salut',
      conversationHistory: [{ role: 'assistant', content: 'Bienvenue' }],
    });
  });

  it("historique : 20 derniers messages, sans contenu vide, réduits à role/content", async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(200, { response: 'R', quota: null }));
    const history = [
      { role: 'assistant', content: '   ' },
      ...Array.from({ length: 25 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}`, id: `${i}` })),
    ] as any;
    await sendCoachMessage({ message: 'Nouveau', history }, { getSession: sessionOk, fetchFn });
    const sent = JSON.parse(fetchFn.mock.calls[0][1].body);
    expect(sent.message).toBe('Nouveau');
    expect(sent.conversationHistory).toHaveLength(MAX_HISTORY_MESSAGES);
    expect(sent.conversationHistory[0]).toEqual({ role: 'assistant', content: 'm5' });
    expect(sent.conversationHistory.at(-1)).toEqual({ role: 'user', content: 'm24' });
    expect(sent.conversationHistory.some((m: any) => m.content === 'Nouveau')).toBe(false);
  });

  it('buildCoachHistory ignore les rôles inconnus', () => {
    expect(buildCoachHistory([{ role: 'system', content: 'x' } as any, { role: 'user', content: 'ok' }])).toEqual([
      { role: 'user', content: 'ok' },
    ]);
  });

  it('premium : used et limit à null', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(200, { response: 'R', quota: { used: null, limit: null, premium: true } }));
    const r = await sendCoachMessage({ message: 'x', history: [] }, { getSession: sessionOk, fetchFn });
    expect(r).toEqual({ kind: 'ok', text: 'R', quota: { used: null, limit: null, premium: true }, safety: false });
  });

  it('réponse de crise : affichée, sans quota', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(200, { response: 'Appelle le 3114', safety: true }));
    const r = await sendCoachMessage({ message: 'x', history: [] }, { getSession: sessionOk, fetchFn });
    expect(r).toEqual({ kind: 'ok', text: 'Appelle le 3114', quota: null, safety: true });
  });

  it.each([
    [402, { error: 'quota_exceeded', used: 10, limit: 10 }, { kind: 'limit_reached', used: 10, limit: 10 }],
    [401, { error: 'Session invalide.' }, { kind: 'unauthorized' }],
    [429, { error: 'busy' }, { kind: 'rate_limited' }],
    [400, { error: 'Message trop long.' }, { kind: 'bad_request', message: 'Message trop long.' }],
    [502, { error: 'provider_error' }, { kind: 'unavailable' }],
    [503, { error: 'quota_unavailable' }, { kind: 'unavailable' }],
    [529, { error: 'overloaded' }, { kind: 'unavailable' }],
    [500, { error: 'server_error' }, { kind: 'error' }],
  ])('statut %i', async (status, body, expected) => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(status, body));
    expect(await sendCoachMessage({ message: 'x', history: [] }, { getSession: sessionOk, fetchFn })).toEqual(expected);
  });

  it('erreur réseau → error', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await sendCoachMessage({ message: 'x', history: [] }, { getSession: sessionOk, fetchFn })).toEqual({ kind: 'error' });
  });
});

describe('linkAccount (format a49b96c)', () => {
  it("n'appelle pas le serveur sans session", async () => {
    const fetchFn = jest.fn();
    expect(await linkAccount('a@b.fr', { getSession: noSession, fetchFn })).toEqual({ linked: false, reason: 'no_session' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("envoie le jeton et l'email seul (pas d'identifiant)", async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(200, { linked: true, status: 'active' }));
    expect(await linkAccount('homme@exemple.fr', { getSession: sessionOk, fetchFn })).toEqual({ linked: true, status: 'active' });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${ENTITLEMENTS_BACKEND_URL}/api/link-account`);
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(init.body)).toEqual({ email: 'homme@exemple.fr' });
  });

  it.each([
    [200, { linked: false, reason: 'email_mismatch' }, { linked: false, reason: 'email_mismatch' }],
    [200, { linked: false, reason: 'email_not_verified' }, { linked: false, reason: 'email_not_verified' }],
    [401, { error: 'Session invalide.' }, { linked: false, reason: 'unauthorized' }],
    [500, { error: 'boom' }, { linked: false, reason: 'server_error' }],
  ])('statut %i %j', async (status, body, expected) => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(status, body));
    expect(await linkAccount('a@b.fr', { getSession: sessionOk, fetchFn })).toEqual(expected);
  });
});

describe('checkEntitlementStatus (format a49b96c)', () => {
  const OK = { active: true, trialActive: false, trialEndsAt: null, planType: 'mensuel', accessExpiresAt: null };

  it('envoie le jeton et renvoie le statut', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(200, OK));
    expect(await checkEntitlementStatus('u1', { getSession: sessionOk, fetchFn })).toEqual(OK);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${ENTITLEMENTS_BACKEND_URL}/api/entitlement-status/u1`);
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it.each([401, 403, 500])('lève une erreur sur %i (l’appelant garde l’état précédent)', async (status) => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(status, { error: 'x' }));
    await expect(checkEntitlementStatus('u1', { getSession: sessionOk, fetchFn })).rejects.toThrow();
  });

  it('lève une erreur sans session, sans appeler le serveur', async () => {
    const fetchFn = jest.fn();
    await expect(checkEntitlementStatus('u1', { getSession: noSession, fetchFn })).rejects.toThrow('no_session');
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
