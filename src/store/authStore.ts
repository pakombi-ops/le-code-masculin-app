import { create } from 'zustand';
import { supabase, getUserProfile, getUserStreak, getAiQuota, getUserProgress, markLessonCompleted } from '../services/supabase';
import { linkAccount, checkEntitlementStatus } from '../services/entitlements';

interface UserProfile {
  id: string;
  prenom: string;
  name?: string;
  email: string;
  niveau?: string;
  created_at?: string;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

interface AiQuota {
  messages_used: number;
  is_premium: boolean;
}

interface AuthState {
  user: UserProfile | null;
  streak: StreakData | null;
  aiQuota: AiQuota | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userProgress: { pillar_id: number; lesson_id: string; completed_at: string }[];
  loadUserProgress: (userId: string) => Promise<void>;
  completeLessonAndRefresh: (userId: string, pillarId: number, lessonId: string) => Promise<void>;
  setUser: (user: UserProfile) => void;
  loadUser: (userId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  refreshQuota: (userId: string) => Promise<void>;
  refreshStreak: (userId: string) => Promise<void>;
  entitlement: { active: boolean; planType: string | null };
  checkEntitlement: (userId: string) => Promise<void>;
  linkPurchaseAccount: (email: string, userId: string) => Promise<{ linked: boolean; reason?: string }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  streak: null,
  aiQuota: null,
  isLoading: true,
  isAuthenticated: false,

  userProgress: [],

  loadUserProgress: async (userId: string) => {
    const { data } = await getUserProgress(userId);
    set({ userProgress: data ?? [] });
  },

  completeLessonAndRefresh: async (userId: string, pillarId: number, lessonId: string) => {
    console.log('completeLessonAndRefresh appelé:', { userId, pillarId, lessonId });
    const result = await markLessonCompleted(userId, pillarId, lessonId);
    console.log('Résultat markLessonCompleted:', JSON.stringify(result));
    const { data } = await getUserProgress(userId);
    console.log('userProgress après refresh:', JSON.stringify(data));
    set({ userProgress: data ?? [] });
  },

  setUser: (user: UserProfile) => set({ user, isAuthenticated: true, isLoading: false }),

  loadUser: async (userId: string) => {
    set({ isLoading: true });
    try {
      await new Promise(r => setTimeout(r, 300));

      const [streakRes, quotaRes, progressRes] = await Promise.all([
        getUserStreak(userId),
        getAiQuota(userId),
        getUserProgress(userId),
      ]);

      set((state) => ({
        user: state.user ?? null,
        streak: streakRes.data,
        aiQuota: quotaRes.data,
        userProgress: progressRes.data ?? [],
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (err) {
      console.error('Erreur loadUser:', err);
      set({ isLoading: false });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      streak: null,
      aiQuota: null,
      isAuthenticated: false,
    });
  },

  refreshQuota: async (userId: string) => {
    const { data } = await getAiQuota(userId);
    if (data) set({ aiQuota: data });
  },

  refreshStreak: async (userId: string) => {
    const { data } = await getUserStreak(userId);
    if (data) set({ streak: data });
  },

  entitlement: { active: false, planType: null },

  checkEntitlement: async (userId: string) => {
    try {
      const result = await checkEntitlementStatus(userId);
      set({ entitlement: { active: result.active, planType: result.planType } });
    } catch (err) {
      console.error('Erreur checkEntitlement:', err);
    }
  },

  linkPurchaseAccount: async (email: string, userId: string) => {
    try {
      const result = await linkAccount(email, userId);
      if (result.linked) {
        set({ entitlement: { active: true, planType: null } });
        await useAuthStore.getState().refreshQuota(userId);
      }
      return result;
    } catch (err) {
      console.error('Erreur linkPurchaseAccount:', err);
      return { linked: false, reason: 'network_error' };
    }
  },
}));

// Sélecteurs
export const selectCanUseAI = (state: AuthState): boolean => {
  if (!state.aiQuota) return true;
  if (state.aiQuota.is_premium) return true;
  return state.aiQuota.messages_used < 10;
};

export const selectRemainingMessages = (state: AuthState): number => {
  if (!state.aiQuota) return 10;
  if (state.aiQuota.is_premium) return Infinity;
  return Math.max(0, 10 - state.aiQuota.messages_used);
};