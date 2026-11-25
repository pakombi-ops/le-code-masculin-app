import { supabase } from './supabase';

// ============================================================
// Types
// ============================================================
export interface CommunityPost {
  id: string;
  /** Vrai si le post appartient à l'utilisateur connecté (calculé par la vue). */
  is_mine: boolean;
  pseudonym: string;
  is_founder: boolean;
  pillar_tag: string | null;
  content: string;
  reply_count: number;
}

export interface CommunityReply {
  id: string;
  post_id: string;
  /** Vrai si la réponse appartient à l'utilisateur connecté (calculé par la vue). */
  is_mine: boolean;
  pseudonym: string;
  is_founder: boolean;
  content: string;
}

// ============================================================
// Lecture
// ============================================================

/**
 * Récupère les posts du fil, du plus récent au plus ancien.
 * Pas de date affichée côté UI — created_at reste en base pour le tri uniquement.
 */
export async function fetchPosts(pillarTag?: string): Promise<CommunityPost[]> {
  let query = supabase
    .from('community_posts_view')
    .select('id, is_mine, pseudonym, is_founder, pillar_tag, content, reply_count')
    .order('created_at', { ascending: false })
    .limit(50);

  if (pillarTag) {
    query = query.eq('pillar_tag', pillarTag);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * Récupère un post et toutes ses réponses (ordre chronologique croissant).
 */
export async function fetchPostWithReplies(
  postId: string
): Promise<{ post: CommunityPost; replies: CommunityReply[] }> {
  const [{ data: post, error: postError }, { data: replies, error: repliesError }] =
    await Promise.all([
      supabase
        .from('community_posts_view')
        .select('id, is_mine, pseudonym, is_founder, pillar_tag, content, reply_count')
        .eq('id', postId)
        .single(),
      supabase
        .from('community_replies_view')
        .select('id, post_id, is_mine, pseudonym, is_founder, content')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),
    ]);

  if (postError) throw postError;
  if (repliesError) throw repliesError;

  return { post, replies: replies ?? [] };
}

// ============================================================
// Écriture
// ============================================================

export async function createPost(content: string, pillarTag?: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté');

  const { error } = await supabase.from('community_posts').insert({
    user_id: userId,
    content: content.trim(),
    pillar_tag: pillarTag ?? null,
  });

  if (error) throw error;
}

export async function createReply(postId: string, content: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté');

  const { error } = await supabase.from('community_replies').insert({
    post_id: postId,
    user_id: userId,
    content: content.trim(),
  });

  if (error) throw error;
}

// ============================================================
// Signalement
// ============================================================

export async function reportContent(
  targetType: 'post' | 'reply',
  targetId: string
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('Utilisateur non connecté');

  const { error } = await supabase.from('community_reports').insert({
    target_type: targetType,
    target_id: targetId,
    reporter_id: userId,
  });

  // Code 23505 = violation de contrainte unique = déjà signalé par cet homme.
  // On l'ignore silencieusement plutôt que de faire échouer l'UI.
  if (error && error.code !== '23505') throw error;
}
