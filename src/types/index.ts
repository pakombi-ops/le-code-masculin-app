/**
 * Types globaux de l'application Le Code Masculin
 */

// ── Utilisateur ──────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  prenom: string;
  avatarUrl?: string;
  createdAt: string;
  subscription: SubscriptionStatus;
  streak: StreakData;
  programProgress: ProgramProgress;
}

export type SubscriptionTier = 'free' | 'monthly' | 'annual' | 'lifetime';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt?: string;
  aiMessagesUsed: number;       // pour le plan gratuit (max 10)
  aiMessagesLimit: number;      // 10 pour gratuit, Infinity pour payant
}

// ── Streak & Progression ─────────────────────────────────
export interface StreakData {
  currentStreak: number;        // jours consécutifs
  longestStreak: number;
  lastActivityDate: string;     // ISO date
  weekDays: boolean[];          // [lun, mar, mer, jeu, ven, sam, dim]
}

export interface ProgramProgress {
  currentWeek: number;          // 1–52
  completedPillars: number[];   // IDs des piliers complétés
  activePillarId: number;
  pillarProgress: Record<number, PillarProgress>;
}

export interface PillarProgress {
  pillarId: number;
  completedModules: number;
  totalModules: number;
  completedAt?: string;
}

// ── Contenu ──────────────────────────────────────────────
export interface Module {
  id: string;
  pillarId: number;
  weekNumber: number;
  title: string;
  description: string;
  videoUrl?: string;
  audioDuration?: number;       // secondes
  pdfUrl?: string;
  challenge: string;
  order: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: 'video' | 'audio' | 'text';
  duration: number;             // secondes
  content?: string;
  mediaUrl?: string;
  order: number;
  completedAt?: string;
}

// ── IA Coach ─────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ── Journal ──────────────────────────────────────────────
export interface JournalEntry {
  id: string;
  userId: string;
  pillarId?: number;
  title: string;
  content: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
  updatedAt: string;
}

// ── Navigation ───────────────────────────────────────────
export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
};

export type AuthStackParamList = {
  splash: undefined;
  onboarding: undefined;
  login: undefined;
  register: undefined;
  quiz: undefined;
  'quiz-result': { scores: Record<number, number> };
};

export type TabParamList = {
  accueil: undefined;
  programme: undefined;
  coach: undefined;
  bibliotheque: undefined;
  profil: undefined;
};
