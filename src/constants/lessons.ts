/**
 * Données des leçons par pilier — Le Code Masculin
 * Structure : 12 piliers → semaines → leçons
 * Source : Programme 52 semaines de P.J. Akombi
 */

export type LessonStatus = 'completed' | 'active' | 'locked';
export type LessonType = 'audio' | 'video' | 'text';

export interface Lesson {
  id: string;
  pillarId: number;
  weekNumber: number;
  order: number;
  title: string;
  description: string;
  type: LessonType;
  duration: number; // secondes
  challenge: string;
  keyInsight: string;
  status: LessonStatus;
}

export interface Week {
  number: number;
  title: string;
  lessons: Lesson[];
}

// ── Leçons par pilier ─────────────────────────────────────────────────────────

const LESSONS_BY_PILLAR: Record<number, Week[]> = {
  // PILIER 1 — Force Physique
  1: [
    {
      number: 1,
      title: 'Les fondations physiques',
      lessons: [
        {
          id: 'p1-w1-l1', pillarId: 1, weekNumber: 1, order: 1,
          title: 'Pourquoi ton corps est ton premier territoire',
          description: 'La discipline physique saigne dans tous les domaines de ta vie. On comprend pourquoi le corps est la fondation de tout le reste.',
          type: 'audio', duration: 1140,
          challenge: 'Fais 20 pompes maintenant. Pas demain. Maintenant.',
          keyInsight: 'Un homme qui abandonne son corps abandonne sa discipline.',
          status: 'completed',
        },
        {
          id: 'p1-w1-l2', pillarId: 1, weekNumber: 1, order: 2,
          title: 'La testostérone et la confiance',
          description: 'La science derrière le lien corps-confiance. Comment l\'entraînement physique transforme ton état mental en profondeur.',
          type: 'audio', duration: 960,
          challenge: 'Établis ton niveau de base : fais le maximum de pompes en une seule série. Note le chiffre.',
          keyInsight: 'L\'entraînement ne te rend pas juste plus fort physiquement — il te rend plus courageux.',
          status: 'completed',
        },
        {
          id: 'p1-w1-l3', pillarId: 1, weekNumber: 1, order: 3,
          title: 'Les standards non-négociables',
          description: 'Définir tes standards minimums physiques et construire ta routine de base.',
          type: 'audio', duration: 1320,
          challenge: 'Écris tes 3 standards physiques non-négociables pour les 90 prochains jours.',
          keyInsight: 'Sans standard, tout est négociable. Avec un standard, rien ne l\'est.',
          status: 'active',
        },
        {
          id: 'p1-w1-l4', pillarId: 1, weekNumber: 1, order: 4,
          title: 'Le plan des 4 piliers physiques',
          description: 'Force, cardio, mobilité, récupération. Les 4 dimensions d\'une condition physique masculine complète.',
          type: 'audio', duration: 1080,
          challenge: 'Planifie tes 4 prochaines séances d\'entraînement. Date, heure, type.',
          keyInsight: 'L\'entraînement sans plan est un passe-temps. Avec un plan, c\'est une discipline.',
          status: 'locked',
        },
      ],
    },
    {
      number: 2,
      title: 'La routine du guerrier',
      lessons: [
        {
          id: 'p1-w2-l1', pillarId: 1, weekNumber: 2, order: 1,
          title: 'Le protocole matinal physique',
          description: 'Construire une routine matinale physique qui prend 20 minutes et transforme ta journée.',
          type: 'audio', duration: 900,
          challenge: 'Applique le protocole matinal 7 jours de suite. Note tes observations.',
          keyInsight: 'La matinée appartient à celui qui se lève avec intention.',
          status: 'locked',
        },
        {
          id: 'p1-w2-l2', pillarId: 1, weekNumber: 2, order: 2,
          title: 'Nutrition — manger comme un athlète',
          description: 'La règle des 80/20 et les principes nutritionnels essentiels pour un homme en transformation.',
          type: 'audio', duration: 1020,
          challenge: 'Prépare 3 repas équilibrés cette semaine. Photo avant de manger.',
          keyInsight: 'Chaque repas est une décision entre l\'homme que tu veux être et l\'homme que tu as été.',
          status: 'locked',
        },
      ],
    },
  ],

  // PILIER 2 — Discipline
  2: [
    {
      number: 5,
      title: 'La fondation de la discipline',
      lessons: [
        {
          id: 'p2-w5-l1', pillarId: 2, weekNumber: 5, order: 1,
          title: 'Motivation vs Discipline — la différence cruciale',
          description: 'Pourquoi attendre d\'avoir envie est la recette de l\'échec. La discipline comme décision, pas comme sentiment.',
          type: 'audio', duration: 1140,
          challenge: 'Identifie une chose que tu repousses depuis 7 jours. Fais-la dans les prochaines 2 heures.',
          keyInsight: 'La motivation est une émotion. Les émotions sont instables. La discipline, elle, est une décision.',
          status: 'completed',
        },
        {
          id: 'p2-w5-l2', pillarId: 2, weekNumber: 5, order: 2,
          title: 'L\'expérience du marshmallow et toi',
          description: 'La science de Walter Mischel et ce qu\'elle révèle sur ta capacité à retarder la gratification.',
          type: 'audio', duration: 960,
          challenge: 'Choisis un plaisir immédiat que tu renonces à ce soir. Note ce que tu ressens.',
          keyInsight: 'La discipline dans un domaine se transfère automatiquement aux autres.',
          status: 'completed',
        },
        {
          id: 'p2-w5-l3', pillarId: 2, weekNumber: 5, order: 3,
          title: 'L\'engagement comme identité',
          description: 'Passer de "j\'essaie" à "c\'est qui je suis". Comment construire une identité disciplinée.',
          type: 'audio', duration: 1260,
          challenge: 'Tiens ton engagement le plus important du soir avant 20h, 7 jours de suite.',
          keyInsight: 'Un homme discipliné ne se demande pas s\'il a envie. Il se demande si c\'est nécessaire.',
          status: 'active',
        },
        {
          id: 'p2-w5-l4', pillarId: 2, weekNumber: 5, order: 4,
          title: 'Le serment des 7 jours',
          description: 'Créer ton protocole de discipline personnalisé et t\'y tenir une semaine complète.',
          type: 'audio', duration: 900,
          challenge: 'Écris ton serment des 7 jours. Signe-le. Tiens-le.',
          keyInsight: 'Ta parole, même à toi-même, a de la valeur. Commence à la traiter comme telle.',
          status: 'locked',
        },
      ],
    },
    {
      number: 6,
      title: 'Les systèmes de discipline',
      lessons: [
        {
          id: 'p2-w6-l1', pillarId: 2, weekNumber: 6, order: 1,
          title: 'La routine matinale du guerrier',
          description: 'Construire une matinée qui te donne une victoire avant que le monde se réveille.',
          type: 'audio', duration: 1080,
          challenge: 'Définis ton rituel matinal en 3 étapes précises et applique-le 7 jours de suite.',
          keyInsight: 'L\'homme discipliné a gagné sa journée avant que la plupart des gens se réveillent.',
          status: 'locked',
        },
        {
          id: 'p2-w6-l2', pillarId: 2, weekNumber: 6, order: 2,
          title: 'La discipline digitale',
          description: 'Reprendre le contrôle de ton attention face aux algorithmes conçus pour la capturer.',
          type: 'audio', duration: 1020,
          challenge: 'Désactive les notifications de tous tes réseaux sociaux pendant 48 heures.',
          keyInsight: 'Chaque notification à laquelle tu réponds est une preuve que ton attention appartient à quelqu\'un d\'autre.',
          status: 'locked',
        },
      ],
    },
  ],

  // PILIER 7 — Présence
  7: [
    {
      number: 9,
      title: 'L\'art d\'être présent',
      lessons: [
        {
          id: 'p7-w9-l1', pillarId: 7, weekNumber: 9, order: 1,
          title: 'Ce que ta présence dit de toi',
          description: 'La présence comme langage non-verbal. Ce que les autres perçoivent quand tu n\'es pas vraiment là.',
          type: 'audio', duration: 1020,
          challenge: 'Ce soir, pose ton téléphone dans une autre pièce pendant le dîner. Entièrement.',
          keyInsight: 'La présence totale est le cadeau le plus rare qu\'un homme puisse offrir.',
          status: 'locked',
        },
        {
          id: 'p7-w9-l2', pillarId: 7, weekNumber: 9, order: 2,
          title: 'Le ratio d\'attention Gottman',
          description: 'La science de John Gottman sur la présence dans le couple et la famille.',
          type: 'audio', duration: 900,
          challenge: 'Offre 20 minutes de présence totale à quelqu\'un d\'important. Pas de téléphone, pas de distraction.',
          keyInsight: '20 minutes de présence totale valent plus que 2 heures de présence physique distraite.',
          status: 'locked',
        },
      ],
    },
  ],

  // PILIER 10 — Courage
  10: [
    {
      number: 26,
      title: 'Agir malgré la peur',
      lessons: [
        {
          id: 'p10-w26-l1', pillarId: 10, weekNumber: 26, order: 1,
          title: 'La philosophie du courage',
          description: 'Le courage n\'est pas l\'absence de peur — c\'est l\'action malgré elle. Comprendre ce qui te retient vraiment.',
          type: 'audio', duration: 1140,
          challenge: 'Identifie une peur que tu évites depuis plus d\'un mois. Écris-la. C\'est ton prochain défi.',
          keyInsight: 'Chaque acte de courage élargit ton territoire. Chaque recul le rétrécit.',
          status: 'locked',
        },
        {
          id: 'p10-w26-l2', pillarId: 10, weekNumber: 26, order: 2,
          title: 'La théorie du regret',
          description: 'Kahneman et Tversky sur pourquoi nous regrettons plus ce que nous n\'avons pas fait.',
          type: 'audio', duration: 960,
          challenge: 'Dis une vérité difficile à quelqu\'un aujourd\'hui — avec respect, mais sans censure.',
          keyInsight: 'Le regret de ne pas avoir agi est toujours plus douloureux que le regret d\'avoir essayé.',
          status: 'locked',
        },
      ],
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getWeeksForPillar(pillarId: number): Week[] {
  return LESSONS_BY_PILLAR[pillarId] ?? [];
}

export function getLessonById(lessonId: string): Lesson | undefined {
  for (const weeks of Object.values(LESSONS_BY_PILLAR)) {
    for (const week of weeks) {
      const lesson = week.lessons.find(l => l.id === lessonId);
      if (lesson) return lesson;
    }
  }
  return undefined;
}

export function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  return `${min} min`;
}

export function getPillarProgress(pillarId: number): { completed: number; total: number } {
  const weeks = getWeeksForPillar(pillarId);
  let completed = 0;
  let total = 0;
  for (const week of weeks) {
    for (const lesson of week.lessons) {
      total++;
      if (lesson.status === 'completed') completed++;
    }
  }
  return { completed, total };
}
