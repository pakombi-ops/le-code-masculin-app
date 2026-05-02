import { create } from 'zustand';
import type { User, SubscriptionTier } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updateStreak: (days: number) => void;
  incrementAiMessages: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  updateStreak: (days) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            streak: { ...state.user.streak, currentStreak: days },
          }
        : null,
    })),

  incrementAiMessages: () =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            subscription: {
              ...state.user.subscription,
              aiMessagesUsed: state.user.subscription.aiMessagesUsed + 1,
            },
          }
        : null,
    })),

  logout: () => set({ user: null, isAuthenticated: false }),
}));

// Sélecteurs utiles
export const selectCanUseAI = (state: AuthState): boolean => {
  if (!state.user) return false;
  const { tier, aiMessagesUsed, aiMessagesLimit } = state.user.subscription;
  if (tier !== 'free') return true;
  return aiMessagesUsed < aiMessagesLimit;
};

export const selectRemainingMessages = (state: AuthState): number => {
  if (!state.user) return 0;
  const { aiMessagesUsed, aiMessagesLimit } = state.user.subscription;
  return Math.max(0, aiMessagesLimit - aiMessagesUsed);
};
