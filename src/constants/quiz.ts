/**
 * Les 12 questions du diagnostic — Le Code Masculin
 * Chaque question est situationnelle et révèle un pilier
 * sans jamais nommer le pilier à l'utilisateur.
 */

export interface QuizOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
  pillarScore: number; // 1 (faible) à 4 (élevé)
}

export interface QuizQuestion {
  id: number;
  question: string;
  pillarId: number;
  pillarName: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    pillarId: 2,
    pillarName: 'Discipline',
    question: "Tu as un objectif important fixé depuis 3 mois. Ce matin, tu n'as pas envie. Tu...",
    options: [
      { id: 'A', text: "Attends d'avoir l'envie — ça finira par venir.", pillarScore: 1 },
      { id: 'B', text: "Fais une version réduite pour ne pas rompre la série.", pillarScore: 2 },
      { id: 'C', text: "Exécutes quand même — l'envie n'a rien à voir là-dedans.", pillarScore: 4 },
      { id: 'D', text: "Te négocies une journée de repos, et te sens coupable après.", pillarScore: 2 },
    ],
  },
  {
    id: 2,
    pillarId: 10,
    pillarName: 'Courage',
    question: "Ton patron te demande quelque chose que tu trouves profondément injuste. Tu...",
    options: [
      { id: 'A', text: "Obéis sans rien dire — ce n'est pas le moment de faire des vagues.", pillarScore: 1 },
      { id: 'B', text: "Obéis mais en te plaignant à tes collègues après.", pillarScore: 1 },
      { id: 'C', text: "Demandes un moment pour en parler seul à seul avec lui.", pillarScore: 3 },
      { id: 'D', text: "Exprimes clairement ton désaccord, en face, avec respect.", pillarScore: 4 },
    ],
  },
  {
    id: 3,
    pillarId: 7,
    pillarName: 'Présence',
    question: "Ta partenaire te parle d'un problème au travail. Honnêtement, dans ces moments-là...",
    options: [
      { id: 'A', text: "Tu écoutes tout en pensant à autre chose.", pillarScore: 1 },
      { id: 'B', text: "Tu interromps rapidement pour proposer des solutions.", pillarScore: 2 },
      { id: 'C', text: "Tu poses ton téléphone, tu la regardes, tu écoutes vraiment.", pillarScore: 4 },
      { id: 'D', text: "Tu écoutes mais tu attends que ça finisse pour reprendre ce que tu faisais.", pillarScore: 1 },
    ],
  },
  {
    id: 4,
    pillarId: 5,
    pillarName: 'But',
    question: "Quand quelqu'un te demande ce que tu veux vraiment dans la vie dans 5 ans, tu...",
    options: [
      { id: 'A', text: "Donnes une réponse vague — tu n'y as pas vraiment réfléchi.", pillarScore: 1 },
      { id: 'B', text: "Parles de choses matérielles : maison, voiture, revenus.", pillarScore: 2 },
      { id: 'C', text: "Réponds en fonction de ce que l'autre semble vouloir entendre.", pillarScore: 1 },
      { id: 'D', text: "Décris une vision claire de qui tu veux être, pas juste ce que tu veux avoir.", pillarScore: 4 },
    ],
  },
  {
    id: 5,
    pillarId: 1,
    pillarName: 'Force Physique',
    question: "Ta forme physique actuelle par rapport à ce que tu voudrais, c'est...",
    options: [
      { id: 'A', text: "Loin du compte — je le sais, je ne fais rien.", pillarScore: 1 },
      { id: 'B', text: "Je fais du sport quand j'ai le temps, c'est irrégulier.", pillarScore: 2 },
      { id: 'C', text: "J'ai une routine stable, mais pas toujours au niveau que je voudrais.", pillarScore: 3 },
      { id: 'D', text: "Mon corps est une priorité — c'est non-négociable dans ma semaine.", pillarScore: 4 },
    ],
  },
  {
    id: 6,
    pillarId: 6,
    pillarName: 'Honneur',
    question: "Tu as promis quelque chose à quelqu'un. Un imprévu survient qui te permet d'éviter de tenir cette promesse. Tu...",
    options: [
      { id: 'A', text: "Profites de l'imprévu — une bonne excuse est une bonne excuse.", pillarScore: 1 },
      { id: 'B', text: "Préviens en t'excusant, mais sans vraiment chercher d'alternative.", pillarScore: 2 },
      { id: 'C', text: "Tiens ta promesse coûte que coûte — ta parole n'a pas de clause d'imprévu.", pillarScore: 4 },
      { id: 'D', text: "Cherches activement une façon de tenir ta promesse malgré tout.", pillarScore: 3 },
    ],
  },
  {
    id: 7,
    pillarId: 8,
    pillarName: 'Stoïcisme',
    question: "Quelqu'un t'insulte publiquement ou te manque de respect devant d'autres. Tu...",
    options: [
      { id: 'A', text: "Réagis immédiatement — personne ne me parle comme ça.", pillarScore: 1 },
      { id: 'B', text: "Ravales ta colère et n'en parles plus — l'ignorer c'est gagner.", pillarScore: 2 },
      { id: 'C', text: "Ressens la montée mais choisis consciemment ta réponse.", pillarScore: 4 },
      { id: 'D', text: "Rumines pendant des heures après, même si tu n'as rien dit.", pillarScore: 1 },
    ],
  },
  {
    id: 8,
    pillarId: 11,
    pillarName: 'Authenticité',
    question: "Dans un groupe, tu as une opinion différente de celle de la majorité. Tu...",
    options: [
      { id: 'A', text: "Gardes ton opinion pour toi — pas la peine de créer un conflit.", pillarScore: 1 },
      { id: 'B', text: "Acquiesces pour garder la paix, même si tu penses l'inverse.", pillarScore: 1 },
      { id: 'C', text: "Attends de voir si quelqu'un d'autre ose le dire avant toi.", pillarScore: 2 },
      { id: 'D', text: "Exprimes ton point de vue clairement — poliment, mais sans te censurer.", pillarScore: 4 },
    ],
  },

  // ── 4 NOUVEAUX PILIERS ────────────────────────────────────────

  {
    id: 9,
    pillarId: 3,
    pillarName: 'Leadership',
    question: "Ce soir, ta famille attend que tu décides où aller dîner. Personne ne propose. Tu...",
    options: [
      { id: 'A', text: "Demandes à chacun ce qu'il veut — tu ne veux imposer à personne.", pillarScore: 1 },
      { id: 'B', text: "Attends que quelqu'un d'autre prenne l'initiative.", pillarScore: 1 },
      { id: 'C', text: "Proposes 2 options et laisses choisir — tu as quand même cadré.", pillarScore: 3 },
      { id: 'D', text: "Décides clairement d'un endroit, vérifies que ça convient, et c'est réglé.", pillarScore: 4 },
    ],
  },
  {
    id: 10,
    pillarId: 4,
    pillarName: 'Vulnérabilité Stratégique',
    question: "Tu traverses une période difficile — stress, doutes, épuisement. Autour de toi, personne ne le sait. Tu...",
    options: [
      { id: 'A', text: "Gères seul — montrer que ça va mal, c'est montrer une faiblesse.", pillarScore: 1 },
      { id: 'B', text: "Fais semblant que tout va bien même avec ta partenaire.", pillarScore: 1 },
      { id: 'C', text: "En parles à ta partenaire ou un ami proche — pas pour te plaindre, pour être honnête.", pillarScore: 4 },
      { id: 'D', text: "Attends que quelqu'un le remarque et te le demande.", pillarScore: 2 },
    ],
  },
  {
    id: 11,
    pillarId: 9,
    pillarName: 'Générosité',
    question: "Un ami traverse une période difficile. Tu es occupé cette semaine. Tu...",
    options: [
      { id: 'A', text: "Attends qu'il demande — s'il a besoin, il saura te contacter.", pillarScore: 1 },
      { id: 'B', text: "Envoies un message pour dire que tu penses à lui.", pillarScore: 2 },
      { id: 'C', text: "Proposes un moment précis cette semaine — même 30 minutes.", pillarScore: 3 },
      { id: 'D', text: "Crées le temps nécessaire — être là pour un ami, ça ne se reporte pas.", pillarScore: 4 },
    ],
  },
  {
    id: 12,
    pillarId: 12,
    pillarName: 'Héritage',
    question: "Si tu disparaissais demain, ce que tu laisses derrière toi aujourd'hui, ce serait...",
    options: [
      { id: 'A', text: "Pas grand-chose — je n'y ai jamais vraiment réfléchi.", pillarScore: 1 },
      { id: 'B', text: "Des biens matériels — une maison, de l'argent.", pillarScore: 2 },
      { id: 'C', text: "Des souvenirs et quelques valeurs transmises à ceux que j'aime.", pillarScore: 3 },
      { id: 'D', text: "Une empreinte consciente — des valeurs, une mission, quelque chose qui me survit.", pillarScore: 4 },
    ],
  },
];

// Calcule les scores par pilier à partir des réponses
export function calculateScores(
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>
): Record<number, number> {
  const scores: Record<number, number> = {};
  QUIZ_QUESTIONS.forEach((q) => {
    const answer = answers[q.id];
    if (answer) {
      const option = q.options.find((o) => o.id === answer);
      scores[q.pillarId] = ((option?.pillarScore ?? 1) / 4) * 10;
    }
  });
  return scores;
}

// Retourne les 3 piliers avec les scores les plus bas
export function getWeakestPillars(
  scores: Record<number, number>
): { pillarId: number; pillarName: string; score: number }[] {
  const allScores = QUIZ_QUESTIONS.map((q) => ({
    pillarId: q.pillarId,
    pillarName: q.pillarName,
    score: scores[q.pillarId] ?? 0,
  }));

  return allScores
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
}