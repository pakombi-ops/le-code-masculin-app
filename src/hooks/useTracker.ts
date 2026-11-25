import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export const PHASE_PILLARS: Record<number, number[]> = {
  1: [1, 2, 7, 8],   // Fondation
  2: [3, 5, 6, 11],  // Identité
  3: [4, 9, 10, 12], // Impact
};

export type TrackerEntry = {
  entryDate: string; // 'YYYY-MM-DD'
  pillarId: number;
};

type UseTrackerResult = {
  currentPhase: number;       // 1, 2 ou 3
  dayInPhase: number;         // 1 à 30
  phasePillars: number[];     // les 4 pillar_id de la phase actuelle
  entries: TrackerEntry[];
  todayPillarIds: number[];   // piliers déjà cochés aujourd'hui
  weekScore: number;          // sur 28 (7 jours × 4)
  phaseScore: number;         // sur 120 (30 jours × 4)
  isLoading: boolean;
  error: string | null;
  checkPillar: (pillarId: number) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
  startedAt: string | null;
};

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function useTracker(): UseTrackerResult {
  const userId = useAuthStore((state) => state.user?.id);
  const isPremium = useAuthStore((state) => state.aiQuota?.is_premium ?? false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    let { data: settings, error: settingsError } = await supabase
      .from('tracker_settings')
      .select('started_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      setError(settingsError.message);
      setIsLoading(false);
      return;
    }

    if (!settings) {
      const { data: created, error: createError } = await supabase
        .from('tracker_settings')
        .insert({ user_id: userId })
        .select('started_at')
        .single();

      if (createError) {
        setError(createError.message);
        setIsLoading(false);
        return;
      }
      settings = created;
    }

    setStartedAt(settings.started_at);

    const { data: entriesData, error: entriesError } = await supabase
      .from('tracker_entries')
      .select('entry_date, pillar_id')
      .eq('user_id', userId)
      .order('entry_date', { ascending: true });

    if (entriesError) {
      setError(entriesError.message);
      setIsLoading(false);
      return;
    }

    setEntries(
      (entriesData ?? []).map((row) => ({
        entryDate: row.entry_date,
        pillarId: row.pillar_id,
      }))
    );
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const daysSinceStart = startedAt
    ? Math.floor((Date.parse(todayStr()) - Date.parse(startedAt)) / (1000 * 60 * 60 * 24))
    : 0;

  const currentPhase = Math.min(3, Math.floor(daysSinceStart / 30) + 1);
  const dayInPhase = Math.min(30, (daysSinceStart % 30) + 1);
  const phasePillars = PHASE_PILLARS[currentPhase] ?? [];

  const todayPillarIds = entries
    .filter((e) => e.entryDate === todayStr())
    .map((e) => e.pillarId);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  const weekScore = entries.filter((e) => e.entryDate >= weekAgoStr).length;

  const phaseStartDate = startedAt
    ? new Date(Date.parse(startedAt) + (currentPhase - 1) * 30 * 86400000)
        .toISOString()
        .split('T')[0]
    : todayStr();
  const phaseScore = entries.filter((e) => e.entryDate >= phaseStartDate).length;

    const checkPillar = useCallback(
    async (pillarId: number) => {
      if (!userId) return { error: 'Utilisateur non connecté' };
      if (!isPremium) return { error: 'Fonctionnalité réservée aux membres Premium' };

      if (!phasePillars.includes(pillarId)) {
        return { error: 'Ce pilier ne fait pas partie de la phase actuelle' };
      }

      const isChecked = todayPillarIds.includes(pillarId);

      if (isChecked) {
        const { error: deleteError } = await supabase
          .from('tracker_entries')
          .delete()
          .eq('user_id', userId)
          .eq('entry_date', todayStr())
          .eq('pillar_id', pillarId);

        if (deleteError) {
          return { error: deleteError.message };
        }
      } else {
        const { error: insertError } = await supabase
          .from('tracker_entries')
          .insert({ user_id: userId, entry_date: todayStr(), pillar_id: pillarId });

        if (insertError) {
          return { error: insertError.message };
        }
      }

      await fetchAll();
      return { error: null };
    },
    [userId, phasePillars, todayPillarIds, fetchAll]
  );

  return {
    currentPhase,
    dayInPhase,
    phasePillars,
    entries,
    todayPillarIds,
    weekScore,
    phaseScore,
    isLoading,
    error,
    checkPillar,
    refresh: fetchAll,
    startedAt,
  };
}