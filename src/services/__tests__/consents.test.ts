import {
  fetchConsentStatus, grantConsent, withdrawConsent, currentGrantDate, isConsentDenied, ConsentClient,
} from '../consents';
import { savePacteWithConsent } from '../pacteSave';
import { sendCoachMessage } from '../coachChat';
import { CONSENT_TEXTS } from '../../constants/consentTexts';

const makeClient = (rpc: jest.Mock): ConsentClient => ({ rpc, from: jest.fn() });

describe('fetchConsentStatus', () => {
  it('interroge has_consent pour les deux accords, séparément', async () => {
    const rpc = jest.fn((_fn: string, args: any) => Promise.resolve({ data: args.p_purpose === 'journal', error: null }));
    expect(await fetchConsentStatus('u1', makeClient(rpc))).toEqual({ journal: true, coach: false });
    expect(rpc).toHaveBeenCalledWith('has_consent', { p_user_id: 'u1', p_purpose: 'journal' });
    expect(rpc).toHaveBeenCalledWith('has_consent', { p_user_id: 'u1', p_purpose: 'coach' });
  });

  it('erreur ou réseau → null (la fonction reste fermée)', async () => {
    expect(await fetchConsentStatus('u1', makeClient(jest.fn().mockResolvedValue({ data: null, error: { message: 'x' } })))).toBeNull();
    expect(await fetchConsentStatus('u1', makeClient(jest.fn().mockRejectedValue(new Error('offline'))))).toBeNull();
    expect(await fetchConsentStatus('', makeClient(jest.fn()))).toBeNull();
  });
});

describe('grantConsent / withdrawConsent', () => {
  it('accord avec la version du texte affiché', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    expect(await grantConsent('coach', makeClient(rpc))).toBe('ok');
    expect(rpc).toHaveBeenCalledWith('grant_consent', { p_purpose: 'coach', p_text_version: CONSENT_TEXTS.coach.version });
  });

  it('retrait : garder ou tout supprimer', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: {}, error: null });
    expect(await withdrawConsent('journal', false, makeClient(rpc))).toBe('ok');
    expect(await withdrawConsent('journal', true, makeClient(rpc))).toBe('ok');
    expect(rpc).toHaveBeenNthCalledWith(1, 'withdraw_consent', { p_purpose: 'journal', p_erase: false });
    expect(rpc).toHaveBeenNthCalledWith(2, 'withdraw_consent', { p_purpose: 'journal', p_erase: true });
  });

  it('erreur → error', async () => {
    expect(await grantConsent('journal', makeClient(jest.fn().mockResolvedValue({ error: { message: 'x' } })))).toBe('error');
    expect(await withdrawConsent('coach', true, makeClient(jest.fn().mockRejectedValue(new Error('x'))))).toBe('error');
  });
});

describe('currentGrantDate', () => {
  const ev = (purpose: 'journal' | 'coach', action: 'granted' | 'withdrawn', created_at: string) => ({ purpose, action, created_at });
  it('date du dernier accord en cours, accords séparés', () => {
    const events = [
      ev('journal', 'granted', '2026-11-01T10:00:00Z'),
      ev('coach', 'granted', '2026-11-02T10:00:00Z'),
      ev('coach', 'withdrawn', '2026-11-03T10:00:00Z'),
      ev('journal', 'withdrawn', '2026-11-04T10:00:00Z'),
      ev('journal', 'granted', '2026-11-05T10:00:00Z'),
    ];
    expect(currentGrantDate(events, 'journal')).toBe('2026-11-05T10:00:00Z');
    expect(currentGrantDate(events, 'coach')).toBeNull();
    expect(currentGrantDate([], 'coach')).toBeNull();
  });
});

describe('isConsentDenied', () => {
  it('reconnaît un refus RLS', () => {
    expect(isConsentDenied({ code: '42501', message: 'new row violates row-level security policy' })).toBe(true);
    expect(isConsentDenied({ message: 'new row violates row-level security policy for table "journal_entries"' })).toBe(true);
    expect(isConsentDenied({ code: '23505', message: 'duplicate' })).toBe(false);
    expect(isConsentDenied(null)).toBe(false);
  });
});

describe('savePacteWithConsent', () => {
  const deps = () => ({
    grantJournalConsent: jest.fn().mockResolvedValue('ok' as const),
    savePacteEntry: jest.fn().mockResolvedValue({ error: null }),
  });

  it("enregistre l'accord AVANT le pacte", async () => {
    const d = deps();
    expect(await savePacteWithConsent('u1', 'Mon pacte', true, d)).toBe('saved');
    expect(d.grantJournalConsent.mock.invocationCallOrder[0]).toBeLessThan(d.savePacteEntry.mock.invocationCallOrder[0]);
    expect(d.savePacteEntry).toHaveBeenCalledWith('u1', 'Mon pacte');
  });

  it("sans accord, ou pacte vide : rien n'est enregistré", async () => {
    const d = deps();
    expect(await savePacteWithConsent('u1', 'Mon pacte', false, d)).toBe('skipped_no_consent');
    expect(await savePacteWithConsent('u1', '   ', true, d)).toBe('skipped_empty');
    expect(d.grantJournalConsent).not.toHaveBeenCalled();
    expect(d.savePacteEntry).not.toHaveBeenCalled();
  });

  it("accord non enregistré : le pacte n'est pas envoyé", async () => {
    const d = deps();
    d.grantJournalConsent.mockResolvedValue('error');
    expect(await savePacteWithConsent('u1', 'Mon pacte', true, d)).toBe('consent_error');
    expect(d.savePacteEntry).not.toHaveBeenCalled();
  });
});

describe('sendCoachMessage : refus du serveur sans accord', () => {
  const session = jest.fn().mockResolvedValue({ data: { session: { access_token: 't' } }, error: null });
  const res = (status: number, body: unknown) =>
    ({ status, ok: status >= 200 && status < 300, text: () => Promise.resolve(JSON.stringify(body)) }) as unknown as Response;

  it('403 consent_required → consent_required', async () => {
    const fetchFn = jest.fn().mockResolvedValue(res(403, { error: 'consent_required', purpose: 'coach' }));
    expect(await sendCoachMessage({ message: 'Salut', history: [] }, { getSession: session, fetchFn })).toEqual({ kind: 'consent_required' });
  });

  it('503 consent_check_failed → unavailable', async () => {
    const fetchFn = jest.fn().mockResolvedValue(res(503, { error: 'consent_check_failed' }));
    expect((await sendCoachMessage({ message: 'Salut', history: [] }, { getSession: session, fetchFn })).kind).toBe('unavailable');
  });
});

describe('textes des consentements', () => {
  it('le coach nomme Anthropic et Voyage AI', () => {
    const all = [CONSENT_TEXTS.coach.intro, ...CONSENT_TEXTS.coach.points, CONSENT_TEXTS.coach.checkbox].join(' ');
    expect(all).toMatch(/Anthropic/);
    expect(all).toMatch(/Voyage AI/);
  });

  it("aucune phrase sur l'entraînement des modèles (non vérifiée)", () => {
    for (const t of Object.values(CONSENT_TEXTS)) {
      expect([t.title, t.intro, ...t.points, t.checkbox].join(' ')).not.toMatch(/entra[iî]n/i);
    }
  });

  it('deux accords séparés, chacun avec sa version', () => {
    expect(CONSENT_TEXTS.journal.version).not.toBe(CONSENT_TEXTS.coach.version);
    expect(CONSENT_TEXTS.journal.title).toMatch(/pacte/i);
  });
});
