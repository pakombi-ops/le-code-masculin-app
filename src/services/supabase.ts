import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Anon Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MANQUANTE');

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
  const today = new Date().toISOString().split('T')[0];
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
  const mondayStr = monday.toISOString().split('T')[0];
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = sunday.toISOString().split('T')[0];

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
  const today = new Date().toISOString().split('T')[0];

  const { data: streak } = await getUserStreak(userId);
  if (!streak) return;

  const lastActivity = streak.last_activity_date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = streak.current_streak;

  if (lastActivity === today) {
    // Déjà actif aujourd'hui — pas de changement
    return;
  } else if (lastActivity === yesterdayStr) {
    // Actif hier — on continue le streak
    newStreak = streak.current_streak + 1;
  } else {
    // Streak cassé — on recommence
    newStreak = 1;
  }

  const { error } = await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak.longest_streak),
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return { newStreak, error };
};

// ── Progression ───────────────────────────────────────────────────────────────

export const getUserProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
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
    .from('user_progress')
    .upsert({
      user_id: userId,
      pillar_id: pillarId,
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
    })
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

export const incrementAiMessages = async (userId: string) => {
  const { data: quota } = await getAiQuota(userId);
  if (!quota) return;

  const { error } = await supabase
    .from('ai_quota')
    .update({
      messages_used: quota.messages_used + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  return { error };
};

// ── Journal ───────────────────────────────────────────────────────────────────

export const saveJournalEntry = async (entry: {
  userId: string;
  pillarId?: number;
  title: string;
  content: string;
}) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: entry.userId,
      pillar_id: entry.pillarId,
      title: entry.title,
      content: entry.content,
    })
    .select()
    .single();
  return { data, error };
};
