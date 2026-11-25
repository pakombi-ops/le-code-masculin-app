import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

//console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
//console.log('Anon Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MANQUANTE');
export function  getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Configuration Supabase — Le Code Masculin
 * Remplace les valeurs par celles de ton projet Supabase
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const signUp = async (email: string, password: string, prenom: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { prenom } },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

export const verifySignupOtp = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });
  return { data, error };
};

// ── Profil ────────────────────────────────────────────────────────────────────

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: {
  prenom?: string;
  niveau?: string;
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};
export const logDailyActivity = async (userId: string) => {
  const today = getLocalDateString();
  const { error } = await supabase
    .from('daily_activity')
    .upsert({ user_id: userId, activity_date: today }, { onConflict: 'user_id,activity_date' });
  return { error };
};

export const getWeekActivity = async (userId: string) => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const mondayStr = getLocalDateString(monday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = getLocalDateString(sunday);
 
  const { data, error } = await supabase
    .from('daily_activity')
    .select('activity_date')
    .eq('user_id', userId)
    .gte('activity_date', mondayStr)
    .lte('activity_date', sundayStr);
 
  return { data, error };
};
// ── Streak ────────────────────────────────────────────────────────────────────

export const getUserStreak = async (userId: string) => {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
};

export const updateStreak = async (userId: string) => {
  const today = getLocalDateString();
 
  const { data: streak } = await getUserStreak(userId);
  if (!streak) return;
 
  const lastActivity = streak.last_activity_date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);
 
  let newStreak = streak.current_streak;
 
  if (lastActivity === today) {
    return;
  } else if (lastActivity === yesterdayStr) {
    newStreak = streak.current_streak + 1;
  } else {
    newStreak = 1;
  }
 
  const { error } = await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak.longest_streak),
      last_activity_date: today,
      updated_at: new Date().toISOString(), // celui-ci reste en UTC — c'est un timestamp, pas un "jour", donc correct tel quel
    })
    .eq('user_id', userId);
 
  return { newStreak, error };
};

// ── Progression ───────────────────────────────────────────────────────────────

export const getUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('lesson_completions')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
};

export const markLessonCompleted = async (
  userId: string,
  pillarId: number,
  lessonId: string
) => {
  const { data, error } = await supabase
    .from('lesson_completions')
    .upsert({
      user_id: userId,
      pillar_id: pillarId,
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })
    .select()
    .single();
  return { data, error };
};

// ── Conversations IA ──────────────────────────────────────────────────────────

export const saveMessage = async (
  userId: string,
  role: 'user' | 'assistant',
  content: string
) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, role, content })
    .select()
    .single();
  return { data, error };
};

export const getConversationHistory = async (userId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: data?.reverse(), error };
};

// ── Quota IA ──────────────────────────────────────────────────────────────────

export const getAiQuota = async (userId: string) => {
  const { data, error } = await supabase
    .from('ai_quota')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
};

// Le compteur de messages est incrémenté par le backend (POST /api/chat-simple,
// fonction SQL consume_ai_message). L'app ne peut pas écrire dans ai_quota (RLS).

// ── Journal ───────────────────────────────────────────────────────────────────

export const saveJournalEntry = async (entry: {
  userId: string;
  pillarId?: number;
  title: string;
  content: string;
}) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: entry.userId,
      pillar_id: entry.pillarId,
      title: entry.title,
      content: entry.content,
      date: today,
    })
    .select()
    .single();
  return { data, error };
};
export const getJournalEntries = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data, error };
};
export const updateJournalEntry = async (
  entryId: string,
  updates: { title: string; content: string }
) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single();
  return { data, error };
};

export const deleteJournalEntry = async (entryId: string) => {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId);
  return { error };
};

export const requestPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error };
};

export const verifyPasswordResetOtp = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });
  return { data, error };
};

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
};

export const savePacteEntry = async (userId: string, content: string) => {
  if (!content || content.trim().length === 0) return { error: null };
  const unlockDate = new Date();
  unlockDate.setFullYear(unlockDate.getFullYear() + 1);

  const { error } = await supabase
    .from('pacte_entries')
    .insert({
      user_id: userId,
      content,
      unlock_date: unlockDate.toISOString().split('T')[0],
    });
  return { error };
};

export const saveDiagnosticResults = async (userId: string, scores: Record<string, number>) => {
  const { error } = await supabase
    .from('diagnostic_results')
    .insert({ user_id: userId, scores });
  return { error };
};

// Déclenche le recalcul du top 3 des piliers prioritaires (table user_pillar_priority),
// à appeler juste après saveDiagnosticResults une fois que le user_id Supabase existe.
export const recomputePillarPriority = async (userId: string) => {
  const { error } = await supabase.rpc('recompute_pillar_priority', {
    p_user_id: userId,
  });
  return { error };
};

export const getDiagnosticResults = async (userId: string) => {
  const { data, error } = await supabase
    .from('diagnostic_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const getPacteEntries = async (userId: string) => {
  const { data, error } = await supabase
    .from('pacte_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const getJournalEntryForLesson = async (userId: string, lessonId: string) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  return { data, error };
};

export const saveLessonJournalEntry = async (params: {
  userId: string;
  lessonId: string;
  pillarId: number;
  title: string;
  content: string;
  existingId?: string;
}) => {
  const today = new Date().toISOString().split('T')[0];

  if (params.existingId) {
    const { data, error } = await supabase
      .from('journal_entries')
      .update({ title: params.title, content: params.content })
      .eq('id', params.existingId)
      .select()
      .single();
    return { data, error };
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: params.userId,
      lesson_id: params.lessonId,
      pillar_id: params.pillarId,
      title: params.title,
      content: params.content,
      date: today,
    })
    .select()
    .single();
  return { data, error };
};

// ============================================================
// À AJOUTER À src/services/supabase.ts
// ============================================================
// ── Mandala Harada ──────────────────────────────────────────────────────────

export type MandalaSatelliteGoal = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completed_at: string | null;
};

export type UserMandala = {
  id: string;
  user_id: string;
  pillar_id: number;
  pillar_rank: number;
  central_objective: string;
  score_avant: number;
  score_cible: number;
  satellite_goals: MandalaSatelliteGoal[];
  created_at: string;
};

export const getUserMandala = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_mandala')
    .select('*')
    .eq('user_id', userId)
    .order('pillar_rank', { ascending: true });
  return { data: data as UserMandala[] | null, error };
};

export const updateMandalaSatellites = async (
  mandalaId: string,
  satelliteGoals: MandalaSatelliteGoal[]
) => {
  const { data, error } = await supabase
    .from('user_mandala')
    .update({ satellite_goals: satelliteGoals })
    .eq('id', mandalaId)
    .select()
    .single();
  return { data, error };
};
