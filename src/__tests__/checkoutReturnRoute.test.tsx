import React from 'react';
import { Alert } from 'react-native';
// @ts-expect-error -- @types/react-test-renderer n'est pas installé (fourni par jest-expo, sans types)
import renderer, { act } from 'react-test-renderer';
import { __resetCheckoutReturnState, markCheckoutStarted, markCheckoutEnded, CHECKOUT_MESSAGES } from '../services/checkoutReturn';

// ---------------------------------------------------------------- expo-router simulé
// Les fabriques de jest.mock sont remontées avant les imports : l'objet router
// est créé dans la fabrique, puis relu via require.
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn(), dismissTo: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => mockParams,
  Stack: { Screen: () => null },
}));
const mockRouter = require('expo-router').router as Record<string, jest.Mock>;

// ---------------------------------------------------------------- store simulé
const mockState: any = {
  user: { id: 'u1' },
  entitlement: { active: false, planType: null, hasSubscription: false },
  checkEntitlement: jest.fn(),
};
jest.mock('../store/authStore', () => {
  const useAuthStore: any = (sel: (s: any) => any) => sel(mockState);
  useAuthStore.getState = () => mockState;
  return { useAuthStore };
});

import CheckoutReturnRoute from '../../app/checkout-return';

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

let alertSpy: jest.SpyInstance;
beforeEach(() => {
  __resetCheckoutReturnState();
  jest.clearAllMocks();
  mockState.user = { id: 'u1' };
  mockState.entitlement = { active: false, planType: null };
  mockState.checkEntitlement = jest.fn(async () => { mockState.entitlement = { active: mockServerActive, planType: 'annuel' }; });
  // L'utilisateur appuie sur « Continuer ».
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => { buttons?.[0]?.onPress?.(); });
});
let mockServerActive = true;

async function renderRoute(params: Record<string, string>) {
  mockParams = params;
  await act(async () => { renderer.create(<CheckoutReturnRoute />); });
  await flush();
}

describe('app/checkout-return.tsx', () => {
  it('existe (plus de « Unmatched route ») et se rend', async () => {
    await renderRoute({ status: 'success', session_id: 'cs_1' });
    expect(mockState.checkEntitlement).toHaveBeenCalledWith('u1');
  });

  it('status=success, app relancée par le lien : relit l\'accès, « Accès activé », puis accueil', async () => {
    mockServerActive = true;
    mockRouter.canGoBack.mockReturnValue(false);
    await renderRoute({ status: 'success', session_id: 'cs_1' });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe(CHECKOUT_MESSAGES.activated.title);
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/(tabs)/accueil');
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('status=success, serveur pas encore à jour : « Paiement reçu », l\'accès reste inactif', async () => {
    mockServerActive = false;
    mockRouter.canGoBack.mockReturnValue(false);
    await renderRoute({ status: 'success', session_id: 'cs_2' });
    expect(alertSpy.mock.calls[0][0]).toBe(CHECKOUT_MESSAGES.pending.title);
    expect(mockState.entitlement.active).toBe(false);
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/(tabs)/accueil');
  });

  it('status=cancelled avec écran d\'origine : « Paiement annulé », retour à l\'origine', async () => {
    mockServerActive = false;
    mockRouter.canGoBack.mockReturnValue(true);
    await renderRoute({ status: 'cancelled' });
    expect(alertSpy.mock.calls[0][0]).toBe(CHECKOUT_MESSAGES.cancelled.title);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  });

  it('status=cancelled sans écran d\'origine : « Paiement annulé », accueil', async () => {
    mockRouter.canGoBack.mockReturnValue(false);
    await renderRoute({ status: 'cancelled' });
    expect(alertSpy.mock.calls[0][0]).toBe(CHECKOUT_MESSAGES.cancelled.title);
    expect(mockRouter.dismissTo).toHaveBeenCalledWith('/(tabs)/accueil');
  });

  it.each(['success', 'cancelled'])('status=%s pendant que PaywallScreen attend : aucune alerte, retour au paywall', async (status) => {
    markCheckoutStarted();
    mockRouter.canGoBack.mockReturnValue(true);
    await renderRoute({ status, session_id: 'cs_3' });
    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockState.checkEntitlement).not.toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(markCheckoutEnded()).toEqual({ status, sessionId: 'cs_3' });
  });

  it('sans session : ni alerte ni navigation (le layout redirige vers la connexion)', async () => {
    mockState.user = null;
    await renderRoute({ status: 'success', session_id: 'cs_4' });
    expect(alertSpy).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  });

  it('n\'écrit jamais l\'accès elle-même : seul checkEntitlement le modifie', async () => {
    mockServerActive = false;
    mockState.checkEntitlement = jest.fn(async () => {});
    mockRouter.canGoBack.mockReturnValue(false);
    await renderRoute({ status: 'success', session_id: 'cs_5' });
    expect(mockState.entitlement).toEqual({ active: false, planType: null });
    expect(alertSpy.mock.calls[0][0]).toBe(CHECKOUT_MESSAGES.pending.title);
  });
});
