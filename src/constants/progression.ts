import { PHASES } from './pillars';
import { getAllLessons, type Lesson, type LessonStatus } from './lessons';

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

export function isPillarUnlocked(pillarId: number, completedIds: Set<string>): boolean {
  const idx = PILLAR_ORDER.indexOf(pillarId);
  if (idx <= 0) return true;
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
    return completedIds.size === 0 || pillarLessons.every((l) => !completedIds.has(l.id))
      ? 'active'
      : 'locked';
  }

  const previousLesson = pillarLessons[lessonIdx - 1];
  const previousCompletion = progressData.find((p) => p.lesson_id === previousLesson.id);

  if (!previousCompletion) return 'locked';

  const completedAt = new Date(previousCompletion.completed_at);
  const unlockDate = new Date(completedAt);
  unlockDate.setDate(unlockDate.getDate() + 7);

  const firstIncomplete = pillarLessons.find((l) => !completedIds.has(l.id));
  if (firstIncomplete?.id !== lesson.id) return 'locked';

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