import { sendCoachMessage, COACH_CHAT_URL } from '../coachChat';

const TOKEN = 'jeton-supabase';

const sessionOk = () =>
  Promise.resolve({ data: { session: { access_token: TOKEN } }, error: null });

const jsonResponse = (status: number, body: unknown) =>
  ({
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as unknown as Response;

describe('sendCoachMessage', () => {
  it("n'appelle pas le serveur sans session", async () => {
    const fetchFn = jest.fn();
    const result = await sendCoachMessage(
      { message: 'Salut', history: [] },
      { getSession: () => Promise.resolve({ data: { session: null } }), fetchFn }
    );
    expect(result).toEqual({ kind: 'no_session' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("envoie le jeton en Authorization et aucun identifiant dans le corps", async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      jsonResponse(200, { response: 'Réponse', quota: { messages_used: 3, is_premium: false, free_limit: 10 } })
    );
    const result = await sendCoachMessage(
      {
        message: 'Salut',
        history: [{ role: 'assistant', content: 'Bienvenue', id: 'welcome' } as any],
      },
      { getSession: sessionOk, fetchFn }
    );

    expect(result).toEqual({
      kind: 'ok',
      text: 'Réponse',
      quota: { messages_used: 3, is_premium: false, free_limit: 10 },
    });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(COACH_CHAT_URL);
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      message: 'Salut',
      conversationHistory: [{ role: 'assistant', content: 'Bienvenue' }],
    });
    expect(init.body).not.toMatch(/user_?id/i);
  });

  it('402 → limit_reached avec le quota serveur', async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      jsonResponse(402, { code: 'FREE_LIMIT_REACHED', quota: { messages_used: 10, is_premium: false } })
    );
    const result = await sendCoachMessage({ message: 'x', history: [] }, { getSession: sessionOk, fetchFn });
    expect(result).toEqual({ kind: 'limit_reached', quota: { messages_used: 10, is_premium: false } });
  });

  it.each([
    [401, { kind: 'unauthorized' }],
    [429, { kind: 'rate_limited' }],
    [400, { kind: 'bad_request', message: 'Message trop long.' }],
    [502, { kind: 'error', quota: null }],
  ])('statut %i', async (status, expected) => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse(status, { error: 'Message trop long.' }));
    const result = await sendCoachMessage({ message: 'x', history: [] }, { getSession: sessionOk, fetchFn });
    expect(result).toEqual(expected);
  });

  it('erreur réseau → error', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('offline'));
    const result = await sendCoachMessage({ message: 'x', history: [] }, { getSession: sessionOk, fetchFn });
    expect(result).toEqual({ kind: 'error', quota: null });
  });
});
