/**
 * Supabase service — VERSION STUB pour test Expo Go
 * Supabase sera branché en Phase 2 (après validation UI)
 * Pour l'instant toutes les fonctions retournent des données simulées
 */

export const signUp = async (email: string, password: string, prenom: string) => {
  console.log('signUp stub:', email, prenom);
  return { data: { user: { id: 'mock-id', email } }, error: null };
};

export const signIn = async (email: string, password: string) => {
  console.log('signIn stub:', email);
  return { data: { user: { id: 'mock-id', email } }, error: null };
};

export const signOut = async () => {
  return { error: null };
};

export const getSession = async () => {
  return { session: null, error: null };
};

export const getUserProfile = async (userId: string) => {
  return { data: null, error: null };
};

export const getUserProgress = async (userId: string) => {
  return { data: [], error: null };
};

export const saveJournalEntry = async (entry: {
  userId: string;
  pillarId?: number;
  title: string;
  content: string;
}) => {
  console.log('saveJournalEntry stub:', entry);
  return { data: { id: 'mock-entry-id', ...entry }, error: null };
};
