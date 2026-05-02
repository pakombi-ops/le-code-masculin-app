/**
 * STORE GLOBAL — Zustand
 * État centralisé de l'application Le Code Masculin.
 *
 * Utilisation: const { user, setUser } = useAppStore();
 */

import { create } from 'zustand';
import type {
  User,
  Pillar,
  Module,
  ChatMessage,
  JournalEntry,
  Resource,
  QuizResults,
} from '../types';

// ─────────────────────────────────────────
// DONNÉES DE DÉMONSTRATION (à remplacer par les appels API Supabase)
// ─────────────────────────────────────────
const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'marcus@example.com',
  firstName: 'Marcus',
  country: 'FR',
  createdAt: '2026-03-01T00:00:00Z',
  subscription: {
    plan: 'free',
    status: 'active',
    aiMessagesUsed: 2,
    aiMessagesLimit: 10,
  },
  streak: {
    current: 5,
    longest: 12,
    lastActivityDate: new Date().toISOString(),
    weekActivity: [true, true, true, true, true, false, false],
  },
};

const DEMO_PILLARS: Pillar[] = [
  {
    id: 1,
    name: 'Force Physique',
    tagline: 'Ton corps est ton premier domaine de conquête',
    phase: 'fondation',
    moduleIds: [1, 2, 3, 4],
    status: 'completed',
    progress: 100,
    score: 6,
    color: '#E8593C',
  },
  {
    id: 2,
    name: 'Discipline',
    tagline: 'Fais ce qui doit être fait',
    phase: 'fondation',
    moduleIds: [5, 6, 7, 8],
    status: 'in_progress',
    progress: 45,
    score: 4,
    color: '#C4A35A',
  },
  {
    id: 3,
    name: 'Leadership',
    tagline: 'Guide avec vision et intégrité',
    phase: 'identite',
    moduleIds: [19, 20, 21, 22],
    status: 'locked',
    progress: 0,
    score: 5,
    color: '#4A90D9',
  },
  {
    id: 4,
    name: 'Vulnérabilité Stratégique',
    tagline: 'Ouvre-toi avec discernement',
    phase: 'impact',
    moduleIds: [36, 37, 38, 39],
    status: 'locked',
    progress: 0,
    score: 3,
    color: '#9B6FD4',
  },
  {
    id: 5,
    name: 'But',
    tagline: 'Vis pour ta mission',
    phase: 'identite',
    moduleIds: [23, 24, 25, 26],
    status: 'locked',
    progress: 0,
    score: 5,
    color: '#4CAF72',
  },
  {
    id: 6,
    name: 'Honneur',
    tagline: 'Ta parole est ta loi',
    phase: 'identite',
    moduleIds: [27, 28, 29, 30],
    status: 'locked',
    progress: 0,
    score: 7,
    color: '#D4885A',
  },
  {
    id: 7,
    name: 'Présence',
    tagline: 'Sois pleinement ici',
    phase: 'fondation',
    moduleIds: [9, 10, 11, 12],
    status: 'locked',
    progress: 0,
    score: 4,
    color: '#5BBFBF',
  },
  {
    id: 8,
    name: 'Stoïcisme',
    tagline: 'Maîtrise tes émotions',
    phase: 'fondation',
    moduleIds: [13, 14, 15, 16],
    status: 'locked',
    progress: 0,
    score: 5,
    color: '#8B8FA8',
  },
  {
    id: 9,
    name: 'Générosité',
    tagline: 'Donne librement',
    phase: 'impact',
    moduleIds: [40, 41, 42, 43],
    status: 'locked',
    progress: 0,
    score: 6,
    color: '#E8A842',
  },
  {
    id: 10,
    name: 'Courage',
    tagline: 'Agis malgré la peur',
    phase: 'impact',
    moduleIds: [44, 45, 46, 47],
    status: 'locked',
    progress: 0,
    score: 4,
    color: '#CF6679',
  },
  {
    id: 11,
    name: 'Authenticité',
    tagline: 'Sois, ne parais pas',
    phase: 'identite',
    moduleIds: [31, 32, 33, 34],
    status: 'locked',
    progress: 0,
    score: 6,
    color: '#7DC97D',
  },
  {
    id: 12,
    name: 'Héritage',
    tagline: 'Construis ce qui dure',
    phase: 'impact',
    moduleIds: [48, 49, 50, 51],
    status: 'locked',
    progress: 0,
    score: 5,
    color: '#C4A35A',
  },
];

// ─────────────────────────────────────────
// INTERFACE DU STORE
// ─────────────────────────────────────────
interface AppState {
  // Auth
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;

  // Contenu
  pillars: Pillar[];
  currentWeek: number;

  // Chat
  messages: ChatMessage[];
  isChatLoading: boolean;

  // UI
  isDarkMode: boolean;
  showPaywall: boolean;
  paywallTrigger: 'quota_exceeded' | 'feature_locked' | 'trial' | null;

  // Actions — Auth
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  logout: () => void;

  // Actions — Subscription
  updateSubscription: (plan: User['subscription']['plan']) => void;
  incrementAiMessages: () => void;

  // Actions — Chat
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  setChatLoading: (value: boolean) => void;

  // Actions — UI
  toggleDarkMode: () => void;
  openPaywall: (trigger: AppState['paywallTrigger']) => void;
  closePaywall: () => void;

  // Actions — Programme
  updatePillarProgress: (pillarId: number, progress: number) => void;
  setQuizResults: (results: QuizResults) => void;
}

// ─────────────────────────────────────────
// STORE
// ─────────────────────────────────────────
export const useAppStore = create<AppState>((set, get) => ({
  // État initial
  isAuthenticated: false,
  isLoading: true,
  user: null,
  pillars: DEMO_PILLARS,
  currentWeek: 8,
  messages: [],
  isChatLoading: false,
  isDarkMode: true,
  showPaywall: false,
  paywallTrigger: null,

  // Auth
  setUser: (user) => set({ user }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setLoading: (value) => set({ isLoading: value }),
  logout: () =>
    set({
      isAuthenticated: false,
      user: null,
      messages: [],
    }),

  // Subscription
  updateSubscription: (plan) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            subscription: {
              ...state.user.subscription,
              plan,
              aiMessagesLimit: plan === 'free' ? 10 : 999999,
            },
          }
        : null,
    })),

  incrementAiMessages: () => {
    const { user, openPaywall } = get();
    if (!user) return;

    const newCount = user.subscription.aiMessagesUsed + 1;

    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            subscription: {
              ...state.user.subscription,
              aiMessagesUsed: newCount,
            },
          }
        : null,
    }));

    // Si quota dépassé, ouvrir le paywall
    if (newCount >= user.subscription.aiMessagesLimit && user.subscription.plan === 'free') {
      openPaywall('quota_exceeded');
    }
  },

  // Chat
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length === 0) return state;
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content, isStreaming: false };
      return { messages: msgs };
    }),

  clearMessages: () => set({ messages: [] }),
  setChatLoading: (value) => set({ isChatLoading: value }),

  // UI
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  openPaywall: (trigger) => set({ showPaywall: true, paywallTrigger: trigger }),
  closePaywall: () => set({ showPaywall: false, paywallTrigger: null }),

  // Programme
  updatePillarProgress: (pillarId, progress) =>
    set((state) => ({
      pillars: state.pillars.map((p) =>
        p.id === pillarId
          ? {
              ...p,
              progress,
              status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : p.status,
            }
          : p
      ),
    })),

  setQuizResults: (results) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, quizResults: results }
        : null,
      pillars: state.pillars.map((p) => ({
        ...p,
        score: results.scores[p.id] ?? p.score,
      })),
    })),
}));

export default useAppStore;
