import { create } from 'zustand';
import { supabase, getUserProfile, getUserStreak, getAiQuota, getUserProgress, markLessonCompleted } from '../services/supabase';
import { linkCurrentAccount, checkEntitlementStatus, LinkPurchaseResult } from '../services/entitlements';
import { initNotifications, refreshStreakAlert, scheduleReactivationReminders } from '../services/notifications';
import { resolvePrenom } from '../utils/displayName';

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
  entitlement: { active: boolean; planType: string | null; hasSubscription: boolean };
  checkEntitlement: (userId: string) => Promise<void>;
  linkPurchaseAccount: () => Promise<LinkPurchaseResult>;
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

      const [streakRes, quotaRes, progressRes, profileRes] = await Promise.all([
        getUserStreak(userId),
        getAiQuota(userId),
        getUserProgress(userId),
        // Un profil illisible ne doit pas bloquer le reste du chargement :
        // on garde alors le prénom des métadonnées.
        getUserProfile(userId).catch(() => ({ data: null, error: null })),
      ]);

      set((state) => ({
        // Prénom : profiles.prenom en priorité, sinon user_metadata.prenom
        // (déjà dans state.user, posé par _layout à l'ouverture de session).
        user: state.user
          ? { ...state.user, prenom: resolvePrenom(profileRes.data?.prenom, state.user.prenom) }
          : null,
        streak: streakRes.data,
        aiQuota: quotaRes.data,
        userProgress: progressRes.data ?? [],
        isAuthenticated: true,
        isLoading: false,
      }));

      // Notifications locales : initialise (citation hebdo, vérif podcast) puis
      // recalcule l'alerte streak avec la donnée fraîchement chargée.
      // Échec silencieux volontaire — jamais bloquant pour le reste du chargement.
      initNotifications().catch(() => {});
      scheduleReactivationReminders().catch(() => {});
      if (streakRes.data) {
        refreshStreakAlert(streakRes.data).catch(() => {});
      }
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
    if (data) {
      set({ streak: data });
      refreshStreakAlert(data).catch(() => {});
    }
  },

  entitlement: { active: false, planType: null, hasSubscription: false },

  checkEntitlement: async (userId: string) => {
    try {
      // Jeton Supabase obligatoire (backend a49b96c). En cas d'échec, on garde
      // l'état précédent au lieu de verrouiller à tort un abonné.
      const result = await checkEntitlementStatus(userId, { getSession: () => supabase.auth.getSession() });
      set({ entitlement: { active: result.active, planType: result.planType, hasSubscription: result.hasSubscription === true } });
    } catch (err) {
      console.error('Erreur checkEntitlement:', err);
    }
  },

  // Relie l'abonnement au compte connecté (identité lue par le serveur dans
  // le jeton ; l'app envoie l'email du compte), puis relit l'accès depuis le serveur : rien n'est accordé
  // localement.
  linkPurchaseAccount: async () => {
    const result = await linkCurrentAccount({ getSession: () => supabase.auth.getSession() });
    if (result.kind === 'linked') {
      const { user, checkEntitlement, refreshQuota } = useAuthStore.getState();
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id ?? user?.id;
      if (userId) {
        await Promise.all([checkEntitlement(userId), refreshQuota(userId)]);
      }
    }
    return result;
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
