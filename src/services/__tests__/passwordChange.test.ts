import { changePassword, passwordChangeMessage } from '../passwordChange';

const ok = { email: 'homme@exemple.fr', currentPassword: 'ancien-mdp', newPassword: 'nouveau-mdp', confirmPassword: 'nouveau-mdp' };
const makeAuth = (o: { signIn?: jest.Mock; update?: jest.Mock } = {}) => ({
  signInWithPassword: o.signIn ?? jest.fn().mockResolvedValue({ data: { session: { access_token: 't' } }, error: null }),
  updateUser: o.update ?? jest.fn().mockResolvedValue({ error: null }),
});

describe('changePassword', () => {
  it("vérifie l'actuel par une reconnexion, puis enregistre le nouveau", async () => {
    const auth = makeAuth();
    expect(await changePassword(ok, auth)).toBe('changed');
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'homme@exemple.fr', password: 'ancien-mdp' });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'nouveau-mdp' });
    expect(auth.signInWithPassword.mock.invocationCallOrder[0]).toBeLessThan(auth.updateUser.mock.invocationCallOrder[0]);
  });

  it("mot de passe actuel faux : le nouveau n'est jamais envoyé", async () => {
    const auth = makeAuth({ signIn: jest.fn().mockResolvedValue({ data: null, error: { status: 400, message: 'Invalid login credentials' } }) });
    expect(await changePassword(ok, auth)).toBe('wrong_current');
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it.each([
    [{ currentPassword: '' }, 'missing_current'],
    [{ newPassword: 'court', confirmPassword: 'court' }, 'too_short'],
    [{ confirmPassword: 'autre-mdp' }, 'mismatch'],
    [{ newPassword: 'ancien-mdp', confirmPassword: 'ancien-mdp' }, 'same'],
    [{ email: '' }, 'no_email'],
  ])('saisie %j → %s, aucun appel', async (patch, expected) => {
    const auth = makeAuth();
    expect(await changePassword({ ...ok, ...patch }, auth)).toBe(expected);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it('429 → rate_limited ; erreur serveur ou réseau → error ; jamais de changement', async () => {
    const limited = makeAuth({ signIn: jest.fn().mockResolvedValue({ data: null, error: { status: 429 } }) });
    expect(await changePassword(ok, limited)).toBe('rate_limited');
    const down = makeAuth({ signIn: jest.fn().mockResolvedValue({ data: null, error: { status: 500 } }) });
    expect(await changePassword(ok, down)).toBe('error');
    const offline = makeAuth({ signIn: jest.fn().mockRejectedValue(new Error('offline')) });
    expect(await changePassword(ok, offline)).toBe('error');
    for (const a of [limited, down, offline]) expect(a.updateUser).not.toHaveBeenCalled();
  });

  it("échec de l'enregistrement → error", async () => {
    expect(await changePassword(ok, makeAuth({ update: jest.fn().mockResolvedValue({ error: { status: 422 } }) }))).toBe('error');
    expect(await changePassword(ok, makeAuth({ update: jest.fn().mockRejectedValue(new Error('x')) }))).toBe('error');
  });

  it('chaque échec a un message', () => {
    for (const r of ['missing_current', 'too_short', 'mismatch', 'same', 'wrong_current', 'rate_limited', 'no_email', 'error'] as const) {
      expect(passwordChangeMessage(r).length).toBeGreaterThan(5);
    }
  });
});
