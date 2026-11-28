import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { ConsentPurpose } from '../constants/consentTexts';
import { fetchConsentStatus, grantConsent, withdrawConsent, ConsentClient } from '../services/consents';

/**
 * État des consentements du compte connecté.
 * null = pas encore chargé (ou chargement impossible) : les écrans attendent
 * au lieu d'ouvrir la fonction, et la base / le backend refusent de toute façon.
 */
interface ConsentState {
  userId: string | null;
  journal: boolean | null;
  coach: boolean | null;
  load: (userId: string) => Promise<void>;
  grant: (purpose: ConsentPurpose) => Promise<boolean>;
  withdraw: (purpose: ConsentPurpose, erase: boolean) => Promise<boolean>;
  markMissing: (purpose: ConsentPurpose) => void;
  reset: () => void;
}

const client = () => supabase as unknown as ConsentClient;

export const useConsentStore = create<ConsentState>((set, get) => ({
  userId: null,
  journal: null,
  coach: null,

  load: async (userId) => {
    if (get().userId !== userId) set({ userId, journal: null, coach: null });
    const status = await fetchConsentStatus(userId, client());
    if (status && get().userId === userId) set(status);
  },

  grant: async (purpose) => {
    const ok = (await grantConsent(purpose, client())) === 'ok';
    if (ok) set({ [purpose]: true } as Partial<ConsentState>);
    return ok;
  },

  withdraw: async (purpose, erase) => {
    const ok = (await withdrawConsent(purpose, erase, client())) === 'ok';
    if (ok) set({ [purpose]: false } as Partial<ConsentState>);
    return ok;
  },

  // Le serveur a refusé (403 consent_required ou RLS) : l'écran redemande l'accord.
  markMissing: (purpose) => set({ [purpose]: false } as Partial<ConsentState>),

  reset: () => set({ userId: null, journal: null, coach: null }),
}));
