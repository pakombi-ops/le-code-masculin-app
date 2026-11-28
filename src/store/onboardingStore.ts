import { create } from 'zustand';

interface OnboardingState {
  pacteText: string;
  /** Accord « journal et pacte » donné sur l'écran du pacte (enregistré en base à la sauvegarde). */
  journalConsent: boolean;
  quizScores: Record<string, number> | null;
  setPacteText: (text: string) => void;
  setJournalConsent: (value: boolean) => void;
  setQuizScores: (scores: Record<string, number>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  pacteText: '',
  journalConsent: false,
  quizScores: null,
  setPacteText: (pacteText) => set({ pacteText }),
  setJournalConsent: (journalConsent) => set({ journalConsent }),
  setQuizScores: (quizScores) => set({ quizScores }),
  reset: () => set({ pacteText: '', journalConsent: false, quizScores: null }),
}));