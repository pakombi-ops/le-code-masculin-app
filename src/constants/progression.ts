import { PHASES } from './pillars';
import { getAllLessons, type Lesson, type LessonStatus } from './lessons';
import { getPillarById } from './pillars';

export const PILLAR_ORDER: number[] = [
  ...PHASES.fondation.pillars,
  ...PHASES.identite.pillars,
  ...PHASES.impact.pillars,
];

export function getCompletedLessonIds(
  userProgress: { lesson_id: string }[] | null | undefined
): Set<string> {
  return new Set((userProgress ?? []).map((p) => p.lesson_id));
}

export function isPillarCompleted(pillarId: number, completedIds: Set<string>): boolean {
  const lessons = getAllLessons().filter((l) => l.pillarId === pillarId);
  return lessons.length > 0 && lessons.every((l) => completedIds.has(l.id));
}

export const MODULE_ZERO_LESSON_IDS = ['module0-naviguer', 'module0-bienvenue'];

export function isModuleZeroCompleted(completedIds: Set<string>): boolean {
  return MODULE_ZERO_LESSON_IDS.every((id) => completedIds.has(id));
}

export function isPillarUnlocked(pillarId: number, completedIds: Set<string>): boolean {
  const idx = PILLAR_ORDER.indexOf(pillarId);
  if (idx === 0) return isModuleZeroCompleted(completedIds);
  if (idx < 0) return true;
  const previousPillarId = PILLAR_ORDER[idx - 1];
  return isPillarCompleted(previousPillarId, completedIds);
}

export function getPillarStatus(
  pillarId: number,
  completedIds: Set<string>
): 'completed' | 'active' | 'locked' {
  if (isPillarCompleted(pillarId, completedIds)) return 'completed';
  if (isPillarUnlocked(pillarId, completedIds)) return 'active';
  return 'locked';
}

export function getLessonStatus(
  lesson: Lesson,
  completedIds: Set<string>,
  progressData: { lesson_id: string; completed_at: string }[]
): LessonStatus {
  if (completedIds.has(lesson.id)) return 'completed';

  if (!isPillarUnlocked(lesson.pillarId, completedIds)) return 'locked';

  const pillarLessons = getAllLessons()
    .filter((l) => l.pillarId === lesson.pillarId)
    .sort((a, b) => a.weekNumber - b.weekNumber || a.order - b.order);

  const lessonIdx = pillarLessons.findIndex((l) => l.id === lesson.id);
  if (lessonIdx === 0) {
    return pillarLessons.every((l) => !completedIds.has(l.id)) ? 'active' : 'locked';
  }

  const previousLesson = pillarLessons[lessonIdx - 1];
  const previousCompletion = progressData.find((p) => p.lesson_id === previousLesson.id);

  if (!previousCompletion) return 'locked';

  const firstIncomplete = pillarLessons.find((l) => !completedIds.has(l.id));
  if (firstIncomplete?.id !== lesson.id) return 'locked';

  if (lesson.pillarId === 0) {
    return 'active';
  }

  const completedAt = new Date(previousCompletion.completed_at);
  const unlockDate = new Date(completedAt);
  unlockDate.setDate(unlockDate.getDate() + 7);

  return new Date() >= unlockDate ? 'active' : 'locked';
}

export function getPillarProgressReal(
  pillarId: number,
  completedIds: Set<string>
): { completed: number; total: number } {
  const lessons = getAllLessons().filter((l) => l.pillarId === pillarId);
  return { completed: lessons.filter((l) => completedIds.has(l.id)).length, total: lessons.length };
}

export function getOverallProgress(completedIds: Set<string>): {
  completedWeeks: number;
  totalWeeks: number;
} {
  const allLessons = getAllLessons();
  const completedWeeks = new Set(
    allLessons.filter((l) => completedIds.has(l.id)).map((l) => l.weekNumber)
  ).size;
  return { completedWeeks, totalWeeks: 52 };
}

export function getNextLesson(currentLessonId: string): Lesson | undefined {
  const sorted = getAllLessons().sort(
    (a, b) => a.weekNumber - b.weekNumber || a.order - b.order
  );
  const idx = sorted.findIndex((l) => l.id === currentLessonId);
  if (idx === -1 || idx === sorted.length - 1) return undefined;
  return sorted[idx + 1];
}
export function isPdfUnlockedByWeek(weekNumber: number, completedIds: Set<string>): boolean {
  const lesson = getAllLessons().find((l) => l.weekNumber === weekNumber);
  if (!lesson) return false;
  return completedIds.has(lesson.id);
}

export function isAudioUnlockedByPillar(pillarId: number, completedIds: Set<string>): boolean {
  return isPillarCompleted(pillarId, completedIds);
}

export function getCurrentActiveLesson(
  completedIds: Set<string>,
  progressData: { lesson_id: string; completed_at: string }[]
): Lesson | undefined {
  const allLessons = getAllLessons();
  return allLessons.find((l) => getLessonStatus(l, completedIds, progressData) === 'active');
}

export function getDailyQuote(): { text: string; source: string } {
  const allLessons = getAllLessons().filter((l) => l.keyInsight && l.keyInsight.trim().length > 0);
  if (allLessons.length === 0) {
    return { text: 'Le Code Masculin t\'attend.', source: 'Pilier Conscient' };
  }

  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % allLessons.length;
  const lesson = allLessons[index];
  const pillar = getPillarById(lesson.pillarId);

  return {
    text: lesson.keyInsight,
    source: pillar ? `Le Code Masculin, Pilier ${pillar.id}` : 'Le Code Masculin',
  };
}
export function getNextUnlockDate(
  completedIds: Set<string>,
  progressData: { lesson_id: string; completed_at: string }[]
): { lesson: Lesson; unlockDate: Date } | undefined {
  const allLessons = getAllLessons().sort(
    (a, b) => a.weekNumber - b.weekNumber || a.order - b.order
  );

  for (const lesson of allLessons) {
    if (completedIds.has(lesson.id)) continue;
    if (!isPillarUnlocked(lesson.pillarId, completedIds)) continue;

    const pillarLessons = allLessons.filter((l) => l.pillarId === lesson.pillarId);
    const lessonIdx = pillarLessons.findIndex((l) => l.id === lesson.id);

    if (lessonIdx === 0) continue; // déjà couvert par getCurrentActiveLesson

    const previousLesson = pillarLessons[lessonIdx - 1];
    const previousCompletion = progressData.find((p) => p.lesson_id === previousLesson.id);
    if (!previousCompletion) continue;

    const completedAt = new Date(previousCompletion.completed_at);
    const unlockDate = new Date(completedAt);
    unlockDate.setDate(unlockDate.getDate() + 7);

    return { lesson, unlockDate };
  }

  return undefined;
}

export function getLastCompletedLesson(
  completedIds: Set<string>,
  progressData: { lesson_id: string; completed_at: string }[]
): Lesson | undefined {
  if (progressData.length === 0) return undefined;
  const sorted = [...progressData].sort((a, b) => b.completed_at.localeCompare(a.completed_at));
  return getAllLessons().find((l) => l.id === sorted[0].lesson_id);
}