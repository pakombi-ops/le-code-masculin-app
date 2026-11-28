import { create } from 'zustand';

interface OnboardingState {
  pacteText: string;
  /** Heure (ISO, téléphone) de l'accord « journal et pacte » donné sur l'écran du pacte ; écrite en base à la création du compte. */
  journalConsentAt: string | null;
  quizScores: Record<string, number> | null;
  setPacteText: (text: string) => void;
  setJournalConsentAt: (value: string | null) => void;
  setQuizScores: (scores: Record<string, number>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  pacteText: '',
  journalConsentAt: null,
  quizScores: null,
  setPacteText: (pacteText) => set({ pacteText }),
  setJournalConsentAt: (journalConsentAt) => set({ journalConsentAt }),
  setQuizScores: (quizScores) => set({ quizScores }),
  reset: () => set({ pacteText: '', journalConsentAt: null, quizScores: null }),
}));