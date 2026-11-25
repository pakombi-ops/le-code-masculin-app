// Contenu pré-écrit par pilier, consommé par la carte quotidienne.
// Zéro génération IA — cohérent avec lessons.ts comme source de vérité statique.
// Voix Prince Johann appliquée (skill-voix-prince-johann + skill-affirmations).

export type DailyCardContent = {
  pillarSlug: string;
  pillarLabel: string;
  message: string;
  reflectionQuestion: string;
  microAction: string;
};

export const DAILY_CARDS: Record<string, DailyCardContent> = {
  'force-physique': {
    pillarSlug: 'force-physique',
    pillarLabel: 'Force Physique',
    message:
      "Ton corps est ton premier territoire. Chaque jour où tu ne t'en occupes pas, tu envoies un message à ton inconscient : je ne vaux pas l'effort.",
    reflectionQuestion: "Aujourd'hui, ton corps a-t-il reçu le message qu'il compte, ou celui qu'il est secondaire ?",
    microAction: '20 pompes, maintenant. Avant de continuer à lire.',
  },

  discipline: {
    pillarSlug: 'discipline',
    pillarLabel: 'Discipline',
    message:
      "Ta discipline ne se prouve pas dans les grandes décisions. Elle se prouve dans la promesse la plus petite que tu te fais — et que tu tiens, ou pas.",
    reflectionQuestion: "Quelle promesse tu t'es faite ce matin ? Tu l'as tenue ?",
    microAction: "Choisis une chose que tu remets depuis 3 jours. Fais-la dans l'heure.",
  },

  leadership: {
    pillarSlug: 'leadership',
    pillarLabel: 'Leadership',
    message:
      "Ton leadership commence par la façon dont tu te diriges toi-même le matin. Personne ne suit un homme qui hésite sur sa propre vie.",
    reflectionQuestion: "Où as-tu attendu qu'on décide à ta place aujourd'hui ?",
    microAction: "Prends une décision que tu remets depuis trop longtemps. Tranche, maintenant.",
  },

  'vulnerabilite-strategique': {
    pillarSlug: 'vulnerabilite-strategique',
    pillarLabel: 'Vulnérabilité Stratégique',
    message:
      "Tout cacher n'est pas de la force — c'est de l'isolement déguisé. La vraie force sait choisir avec qui s'ouvrir, et quand.",
    reflectionQuestion: "Qu'est-ce que tu portes seul en ce moment, et que tu pourrais partager avec la bonne personne ?",
    microAction: "Envoie un message à quelqu'un de confiance : dis-lui une chose vraie que tu ne dis jamais.",
  },

  but: {
    pillarSlug: 'but',
    pillarLabel: 'But',
    message:
      "Un homme sans mission réagit à sa journée. Un homme avec une mission la dirige. Ton but n'est pas une option — c'est ce qui trie tes priorités.",
    reflectionQuestion: "Est-ce que ce que tu as fait aujourd'hui rapprochait de ta mission, ou t'en éloignait ?",
    microAction: "Bloque 30 minutes demain, dans ton agenda, uniquement pour ce qui compte vraiment.",
  },

  honneur: {
    pillarSlug: 'honneur',
    pillarLabel: 'Honneur',
    message:
      "Ton honneur ne se mesure pas à ce que tu dis en public. Il se mesure à ce que tu fais quand personne ne regarde.",
    reflectionQuestion: "Il y a eu un moment aujourd'hui où tu aurais pu couper un coin. Tu l'as fait ou pas ?",
    microAction: "Répare une promesse non tenue. Un message, un appel, une action — aujourd'hui.",
  },

  presence: {
    pillarSlug: 'presence',
    pillarLabel: 'Présence',
    message:
      "Ta présence est le cadeau le plus précieux que tu peux offrir à ceux que tu aimes. Et c'est souvent le plus rare.",
    reflectionQuestion: "Aujourd'hui, qui a eu ton attention divisée — le téléphone dans une main, la relation dans l'autre ?",
    microAction: "20 minutes, téléphone loin, avec une personne qui compte pour toi. Maintenant si possible.",
  },

  stoicisme: {
    pillarSlug: 'stoicisme',
    pillarLabel: 'Stoïcisme',
    message:
      "Tu ne contrôles pas ce qui t'arrive. Tu contrôles ce que tu en fais. C'est là que se joue ton centre.",
    reflectionQuestion: "Quelle situation aujourd'hui t'a fait perdre ton centre ? Qu'est-ce que tu contrôlais vraiment dans cette situation ?",
    microAction: "La prochaine contrariété : 3 respirations avant de répondre. Pas une de moins.",
  },

  generosite: {
    pillarSlug: 'generosite',
    pillarLabel: 'Générosité',
    message:
      "Un homme qui donne sans compter ne s'appauvrit pas — il s'élève. La générosité vécue depuis le manque, elle, épuise.",
    reflectionQuestion: "À qui pourrais-tu donner un peu de ton temps aujourd'hui, sans rien attendre en retour ?",
    microAction: "Aide quelqu'un aujourd'hui sans le dire à personne d'autre.",
  },

  courage: {
    pillarSlug: 'courage',
    pillarLabel: 'Courage',
    message:
      "Le courage n'est pas l'absence de peur. C'est décider que quelque chose compte plus que ta peur.",
    reflectionQuestion: "Qu'est-ce que tu évites depuis des semaines, uniquement parce que ça te fait peur ?",
    microAction: "Fais aujourd'hui une chose que tu repousses à cause de la peur. Une seule, mais fais-la.",
  },

  authenticite: {
    pillarSlug: 'authenticite',
    pillarLabel: 'Authenticité',
    message:
      "Chaque masque que tu portes te coûte de l'énergie. La liberté commence quand tu arrêtes de performer un rôle.",
    reflectionQuestion: "Dans quelle situation aujourd'hui as-tu joué un rôle plutôt que d'être toi-même ?",
    microAction: "Dis une vérité que tu retiens habituellement, à une personne concernée, aujourd'hui.",
  },

  heritage: {
    pillarSlug: 'heritage',
    pillarLabel: 'Héritage',
    message:
      "Ce que tu fais aujourd'hui, dans le silence de ta routine, c'est déjà l'héritage que tu es en train de construire.",
    reflectionQuestion: "Si quelqu'un observait ta journée d'aujourd'hui dans 20 ans, qu'en retiendrait-il ?",
    microAction: "Écris une phrase de ce que tu veux transmettre. Garde-la, relis-la demain.",
  },
};
