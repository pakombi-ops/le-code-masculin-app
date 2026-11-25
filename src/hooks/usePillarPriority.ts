import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export type PillarPriority = {
  pillarSlug: string;
  rank: number;
  score: number;
  diagnosticId: string | null;
};

type UsePillarPriorityResult = {
  priorities: PillarPriority[];
  topPillar: PillarPriority | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function usePillarPriority(): UsePillarPriorityResult {
  const userId = useAuthStore((state) => state.user?.id);
  

  const [priorities, setPriorities] = useState<PillarPriority[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriorities = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('user_pillar_priority')
      .select('pillar_slug, rank, score, diagnostic_result_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('rank', { ascending: true });

    

    if (fetchError) {
      setError(fetchError.message);
      setIsLoading(false);
      return;
    }

    setPriorities(
      (data ?? []).map((row) => ({
        pillarSlug: row.pillar_slug,
        rank: row.rank,
        score: row.score,
        diagnosticId: row.diagnostic_result_id,  // ← corrigé
      }))
    );
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  return {
    priorities,
    topPillar: priorities.find((p) => p.rank === 1) ?? null,
    isLoading,
    error,
    refresh: fetchPriorities,
  };
}