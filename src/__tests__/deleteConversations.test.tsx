import React from 'react';
import { Alert } from 'react-native';
// @ts-expect-error -- @types/react-test-renderer n'est pas installé (fourni par jest-expo, sans types)
import renderer, { act } from 'react-test-renderer';
import { deleteMyConversations, ConsentClient } from '../services/consents';
import { DELETE_CONVERSATIONS_TEXT } from '../constants/consentTexts';

// ---------------------------------------------------------------- doubles
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../components/layout/SafeScreen', () => ({ SafeScreen: ({ children }: any) => children }));

const mockRpc = jest.fn();
jest.mock('../services/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    from: () => ({ select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }),
  },
}));

const mockConsent: any = { journal: true, coach: true, load: jest.fn(), withdraw: jest.fn() };
jest.mock('../store/consentStore', () => ({ useConsentStore: (sel: (s: any) => any) => sel(mockConsent) }));
jest.mock('../store/authStore', () => ({ useAuthStore: (sel: (s: any) => any) => sel({ user: { id: 'u1' } }) }));

import ConsentsScreen from '../screens/profil/ConsentsScreen';

const byTestId = (root: any, id: string) => root.find((n: any) => n.props && n.props.testID === id);

beforeEach(() => {
  mockRpc.mockReset();
  mockConsent.withdraw.mockReset();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('deleteMyConversations', () => {
  it('appelle delete_my_conversations et renvoie le nombre effacé', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: 12, error: null });
    expect(await deleteMyConversations({ rpc, from: jest.fn() } as ConsentClient)).toEqual({ kind: 'ok', deleted: 12 });
    expect(rpc).toHaveBeenCalledWith('delete_my_conversations', {});
  });

  it('erreur ou réseau → error', async () => {
    expect(await deleteMyConversations({ rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'x' } }), from: jest.fn() } as ConsentClient)).toEqual({ kind: 'error' });
    expect(await deleteMyConversations({ rpc: jest.fn().mockRejectedValue(new Error('x')), from: jest.fn() } as ConsentClient)).toEqual({ kind: 'error' });
  });
});

describe('Consentements › Supprimer mes conversations', () => {
  async function renderScreen() {
    let tree: any;
    await act(async () => { tree = renderer.create(<ConsentsScreen />); });
    return tree;
  }

  it("demande confirmation ; rien n'est effacé si on annule", async () => {
    const tree = await renderScreen();
    act(() => { byTestId(tree.root, 'delete-conversations').props.onPress(); });

    const [title, message, buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    expect(title).toBe(DELETE_CONVERSATIONS_TEXT.title);
    expect(message).toMatch(/accord reste en place/);
    const cancel = buttons.find((b: any) => b.style === 'cancel');
    cancel.onPress?.();
    expect(mockRpc).not.toHaveBeenCalledWith('delete_my_conversations', expect.anything());
  });

  it("confirmé : conversations effacées, l'accord n'est PAS retiré", async () => {
    mockRpc.mockResolvedValue({ data: 3, error: null });
    const tree = await renderScreen();
    act(() => { byTestId(tree.root, 'delete-conversations').props.onPress(); });
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    await act(async () => { await buttons.find((b: any) => b.style === 'destructive').onPress(); });

    expect(mockRpc).toHaveBeenCalledWith('delete_my_conversations', {});
    expect(mockRpc).not.toHaveBeenCalledWith('withdraw_consent', expect.anything());
    expect(mockConsent.withdraw).not.toHaveBeenCalled();
    expect((Alert.alert as jest.Mock).mock.calls[1][1]).toBe(DELETE_CONVERSATIONS_TEXT.done);
  });
});
