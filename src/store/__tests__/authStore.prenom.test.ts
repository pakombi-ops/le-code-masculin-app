const mockGetUserProfile = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: { auth: { signOut: jest.fn() } },
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
  getUserStreak: jest.fn(() => Promise.resolve({ data: null, error: null })),
  getAiQuota: jest.fn(() => Promise.resolve({ data: null, error: null })),
  getUserProgress: jest.fn(() => Promise.resolve({ data: [], error: null })),
  markLessonCompleted: jest.fn(),
}));
jest.mock('../../services/entitlements', () => ({
  linkCurrentAccount: jest.fn(),
  checkEntitlementStatus: jest.fn(),
}));
jest.mock('../../services/notifications', () => ({
  initNotifications: jest.fn(() => Promise.resolve()),
  refreshStreakAlert: jest.fn(() => Promise.resolve()),
  scheduleReactivationReminders: jest.fn(() => Promise.resolve()),
}));

import { useAuthStore } from '../authStore';

// Comme _layout.tsx : l'utilisateur de session arrive avec user_metadata.prenom (ou '').
async function openSession(metadataPrenom: string) {
  useAuthStore.getState().setUser({ id: 'u1', email: 'homme@exemple.fr', prenom: metadataPrenom });
  await useAuthStore.getState().loadUser('u1');
  return useAuthStore.getState().user;
}

beforeEach(() => {
  mockGetUserProfile.mockReset();
  useAuthStore.setState({ user: null });
});

describe('loadUser : prénom affiché', () => {
  it('compte créé par le backend (paiement site) : métadonnées vides → profiles.prenom', async () => {
    mockGetUserProfile.mockResolvedValue({ data: { id: 'u1', prenom: 'Tonton' }, error: null });
    expect((await openSession(''))?.prenom).toBe('Tonton');
  });

  it('profiles.prenom prioritaire sur les métadonnées', async () => {
    mockGetUserProfile.mockResolvedValue({ data: { id: 'u1', prenom: 'Johann' }, error: null });
    expect((await openSession('Jean'))?.prenom).toBe('Johann');
  });

  it('profil « Utilisateur » → repli sur les métadonnées', async () => {
    mockGetUserProfile.mockResolvedValue({ data: { id: 'u1', prenom: 'Utilisateur' }, error: null });
    expect((await openSession('Jean'))?.prenom).toBe('Jean');
  });

  it('profil introuvable ou en erreur → métadonnées, et le reste du chargement continue', async () => {
    mockGetUserProfile.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    expect((await openSession('Jean'))?.prenom).toBe('Jean');

    mockGetUserProfile.mockRejectedValue(new Error('réseau'));
    const user = await openSession('Jean');
    expect(user?.prenom).toBe('Jean');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
