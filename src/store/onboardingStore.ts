import { create } from 'zustand';

interface OnboardingState {
  pacteText: string;
  quizScores: Record<string, number> | null;
  setPacteText: (text: string) => void;
  setQuizScores: (scores: Record<string, number>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  pacteText: '',
  quizScores: null,
  setPacteText: (pacteText) => set({ pacteText }),
  setQuizScores: (quizScores) => set({ quizScores }),
  reset: () => set({ pacteText: '', quizScores: null }),
}));