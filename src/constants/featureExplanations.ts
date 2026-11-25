export type FeatureId =
  | 'coach-ia'
  | 'mandala'
  | 'tracker'
  | 'communaute'
  | 'journal'
  | 'programme'
  | 'bibliotheque';

export interface FeatureGridItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturePersona {
  icon: string;
  title: string;
  description: string;
}

export interface FeatureTestimonial {
  name: string;
  countryFlag: string;
  quote: string;
}

export interface FeatureExplanationContent {
  id: FeatureId;
  hero: {
    title: string;
    subtitle: string;
  };
  overview: {
    title: string;
    description: string;
    grid: FeatureGridItem[];
  };
  trust: {
    title: string;
    text: string;
    badges: [string, string];
  };
  personas: {
    title: string;
    items: FeaturePersona[];
  };
  testimonials: {
    title: string;
    items: FeatureTestimonial[];
  };
  cta: {
    title: string;
    subtitle: string;
  };
}

export const FEATURE_EXPLANATIONS: Record<FeatureId, FeatureExplanationContent> = {
  'coach-ia': {
    id: 'coach-ia',
    hero: {
      title: 'Ton frère qui a fait le chemin, disponible 24/7',
      subtitle:
        "Le Coach IA n'improvise pas. Il connaît les 12 Piliers, ton diagnostic, ta progression — et il te répond avec la voix du Code, pas un chatbot générique.",
    },
    overview: {
      title: 'Le Coach IA',
      description:
        "Ce n'est pas un thérapeute. Ce n'est pas Google. C'est un espace de transmission, disponible quand tu en as besoin — pour décrypter une situation, ancrer un pilier, ou remettre de l'ordre dans ta tête.",
      grid: [
        { icon: 'Compass', title: 'Décryptage de situation', description: 'Explique ce qui t\'arrive, il te renvoie le pilier concerné' },
        { icon: 'Anchor', title: 'Ancrage quotidien', description: 'Te rappelle ton contrat avec toi-même' },
        { icon: 'MessageCircle', title: 'Préparation de conversation', description: 'Prépare une conversation difficile avant de l\'avoir' },
        { icon: 'Brain', title: 'Rupture de schéma', description: 'Identifie la croyance derrière une réaction répétée' },
        { icon: 'Layers', title: 'Mémoire de ton parcours', description: 'Connaît ton diagnostic et ta progression' },
        { icon: 'Clock', title: 'Disponible à toute heure', description: '3h du matin ou pause déjeuner, il répond' },
      ],
    },
    trust: {
      title: 'Construit sur le Code, pas sur internet',
      text: "Chaque réponse s'appuie sur les 12 Piliers et les principes de transmission de Prince Johann — pas sur des réponses génériques de développement personnel.",
      badges: ['Basé sur les 12 Piliers', 'Ta progression prise en compte'],
    },
    personas: {
      title: 'Cette fonctionnalité est pour toi si tu es :',
      items: [
        { icon: 'Flame', title: 'En pleine crise, là, maintenant', description: 'Tu as besoin d\'un point de repère avant d\'agir sous le coup de l\'émotion' },
        { icon: 'Target', title: 'Bloqué sur un pilier précis', description: 'Tu comprends le concept mais tu n\'arrives pas à l\'ancrer' },
        { icon: 'Users', title: 'Seul face à une décision', description: 'Tu veux un regard structuré avant d\'en parler à quelqu\'un' },
      ],
    },
    testimonials: {
      title: 'Des hommes du Code en parlent',
      items: [
        { name: 'Julien', countryFlag: '🇫🇷', quote: "3h du matin, une dispute qui tournait en boucle dans ma tête. J'ai ouvert le Coach, j'ai écrit ce qui se passait. Ça m'a suffi pour redescendre et dormir." },
        { name: 'Karim', countryFlag: '🇧🇪', quote: "Je pensais que ce serait un chatbot de plus. Il m'a renvoyé direct au Pilier Honneur sur une situation où je cherchais des excuses. Ça pique, mais c'est ce qu'il fallait entendre." },
        { name: 'Steve', countryFlag: '🇨🇦', quote: "J'ai préparé une conversation avec mon père avec le Coach avant qu'il ne soit trop tard. Les mots sont sortis mieux que je les avais dans ma tête." },
        { name: 'Fabien', countryFlag: '🇨🇭', quote: "Ce n'est pas un thérapeute et il ne prétend pas l'être. Mais entre deux séances, c'est exactement l'ancrage dont j'avais besoin." },
      ],
    },
    cta: { title: 'Parler à ton Coach', subtitle: 'DISPONIBLE AVEC LE CODE MASCULIN' },
  },

  mandala: {
    id: 'mandala',
    hero: {
      title: 'Ta carte de transformation, en un coup d\'œil',
      subtitle:
        'Le Mandala Harada traduit ton diagnostic en plan visuel. Trois cartes, trois priorités — et une direction claire pour les 90 prochains jours.',
    },
    overview: {
      title: 'Le Mandala',
      description:
        "Pas un graphique décoratif. Le Mandala prend tes scores sur les 12 Piliers et fait ressortir les 3 que tu dois travailler en premier — sans te noyer dans 12 fronts à la fois.",
      grid: [
        { icon: 'Target', title: 'Priorités identifiées', description: 'Les 3 piliers où ton score révèle le plus grand écart' },
        { icon: 'LayoutGrid', title: 'Vue d\'ensemble', description: 'Ta position sur les 12 Piliers en un seul écran' },
        { icon: 'RefreshCw', title: 'Mise à jour continue', description: 'Recalculé à chaque nouveau diagnostic' },
        { icon: 'Link', title: 'Objectifs liés', description: 'Chaque carte se connecte à un module du programme' },
        { icon: 'TrendingUp', title: 'Suivi de la priorité', description: 'Visualise ta progression sur le pilier prioritaire' },
        { icon: 'ListChecks', title: 'Simplicité d\'action', description: 'Une direction claire, pas une liste de 12 tâches' },
      ],
    },
    trust: {
      title: 'Basé sur ta réponse, pas sur une moyenne',
      text: 'Le calcul part de ton diagnostic personnel — pas d\'un profil type. Ce que tu vois, c\'est ta situation réelle.',
      badges: ['Calculé à partir de ton diagnostic', 'Aligné sur les 12 Piliers'],
    },
    personas: {
      title: 'Cette fonctionnalité est pour toi si tu es :',
      items: [
        { icon: 'Compass', title: 'Tu veux savoir par où commencer', description: 'Tu as fait le diagnostic, tu veux une direction, pas 12 chantiers en parallèle' },
        { icon: 'Shuffle', title: 'Tu te disperses facilement', description: 'Tu commences fort puis tu perds le fil; le Mandala te ramène au prioritaire' },
        { icon: 'BarChart', title: 'Tu veux mesurer ta progression', description: 'Tu veux voir concrètement où tu avances' },
      ],
    },
    testimonials: {
      title: 'Des hommes du Code en parlent',
      items: [
        { name: 'Thomas', countryFlag: '🇫🇷', quote: "Je voulais tout attaquer en même temps — discipline, présence, stoïcisme. Le Mandala m'a montré qu'il fallait commencer par un seul. Trois mois plus tard, ça a changé le reste." },
        { name: 'Damien', countryFlag: '🇧🇪', quote: "J'ai vu mes 3 priorités d'un coup d'œil et j'ai arrêté de me disperser. Simple, mais ça a fait toute la différence dans ma régularité." },
        { name: 'Rémi', countryFlag: '🇨🇦', quote: "Le diagnostic m'avait déjà secoué. Le Mandala, lui, m'a donné une direction claire au lieu de rester avec un chiffre et un vague malaise." },
        { name: 'Vincent', countryFlag: '🇨🇭', quote: "J'y reviens chaque dimanche pour voir où j'en suis. Ça évite de perdre le fil pendant la semaine." },
      ],
    },
    cta: { title: 'Voir mon Mandala', subtitle: 'DISPONIBLE AVEC LE CODE MASCULIN' },
  },

  tracker: {
    id: 'tracker',
    hero: {
      title: 'Ce que tu ne mesures pas, tu ne le tiens pas',
      subtitle:
        'Le Tracker 90 Jours suit tes engagements quotidiens sur chaque pilier — pas pour te juger, pour te montrer où ça flanche vraiment.',
    },
    overview: {
      title: 'Le Tracker 90 Jours',
      description:
        'Un homme qui "essaie" sans mesurer se ment à lui-même. Le Tracker rend ta régularité visible, pilier par pilier, jour après jour.',
      grid: [
        { icon: 'CheckCircle2', title: 'Suivi quotidien', description: 'Coche tes engagements sur chaque pilier travaillé' },
        { icon: 'Calendar', title: 'Vue par semaine et par mois', description: 'Repère tes patterns de régularité' },
        { icon: 'Gauge', title: 'Score de constance', description: 'Un chiffre honnête sur ta discipline réelle' },
        { icon: 'AlertTriangle', title: 'Alerte de décrochage', description: 'Identifie le pilier où tu perds pied' },
        { icon: 'History', title: 'Historique complet', description: 'Revois tes 90 jours en un coup d\'œil' },
        { icon: 'Link', title: 'Lié au diagnostic', description: 'Suit en priorité les piliers identifiés dans ton Mandala' },
      ],
    },
    trust: {
      title: 'La mesure au service de la conscience, pas du jugement',
      text: 'Le Tracker ne te note pas pour te culpabiliser. Il te montre la réalité pour que tu puisses ajuster — c\'est tout.',
      badges: ['90 jours de suivi', 'Aligné sur tes priorités'],
    },
    personas: {
      title: 'Cette fonctionnalité est pour toi si tu es :',
      items: [
        { icon: 'HelpCircle', title: 'Tu dis "j\'essaie mais ça tient pas"', description: 'Le Tracker révèle exactement où ça flanche' },
        { icon: 'Search', title: 'Tu veux de la preuve, pas des impressions', description: 'Tu veux un chiffre, pas un ressenti flou' },
        { icon: 'RotateCcw', title: 'Tu commences fort et tu abandonnes', description: 'Tu as besoin d\'un miroir quotidien pour tenir la distance' },
      ],
    },
    testimonials: {
      title: 'Des hommes du Code en parlent',
      items: [
        { name: 'Antoine', countryFlag: '🇫🇷', quote: "Je me disais que j'étais régulier. Le Tracker m'a montré noir sur blanc que je décrochais toujours le même jour de la semaine. Maintenant je sais où regarder." },
        { name: 'Mathieu', countryFlag: '🇧🇪', quote: "Cocher chaque soir, ça paraît anodin. Après 30 jours, voir la grille remplie m'a donné une fierté que je n'attendais pas." },
        { name: 'Jonathan', countryFlag: '🇨🇦', quote: "J'ai arrêté de me raconter des histoires sur ma discipline. Le score ne ment pas, et c'est exactement ce dont j'avais besoin." },
        { name: 'Grégory', countryFlag: '🇨🇭', quote: "Le suivi par phase m'a évité de vouloir tout faire à la fois. Un pilier à la fois, un score à la fois." },
      ],
    },
    cta: { title: 'Activer mon Tracker', subtitle: 'DISPONIBLE AVEC LE CODE MASCULIN' },
  },

  communaute: {
    id: 'communaute',
    hero: {
      title: 'Des hommes qui font le travail, pas des inconnus qui jugent',
      subtitle:
        'La Communauté du Code est un espace pseudonyme où des hommes en reconstruction échangent — sans jugement, sans exposition.',
    },
    overview: {
      title: 'La Communauté',
      description:
        "Tu n'es pas seul à traverser ça. La Communauté te connecte à des hommes qui travaillent les mêmes piliers, sous pseudonyme, sans avoir à tout dévoiler.",
      grid: [
        { icon: 'UserCheck', title: 'Échanges pseudonymes', description: 'Ton identité reste protégée' },
        { icon: 'MessagesSquare', title: 'Fils par pilier', description: 'Trouve les discussions liées à ton pilier prioritaire' },
        { icon: 'Users', title: 'Réponses entre hommes du Code', description: 'Pas de commentaires publics, pas de bruit extérieur' },
        { icon: 'ShieldCheck', title: 'Modération active', description: 'Un espace tenu, pas un forum abandonné' },
        { icon: 'BookOpenCheck', title: 'Partage d\'expérience réelle', description: 'Des hommes qui ont vécu ce que tu vis' },
        { icon: 'Feather', title: 'Zéro pression sociale', description: 'Tu participes à ton rythme, anonymement si tu veux' },
      ],
    },
    trust: {
      title: 'Un espace tenu, pas un mur Facebook',
      text: 'Chaque échange est modéré. Pas de spam, pas d\'auto-promotion, pas de conseils toxiques — juste des hommes qui avancent.',
      badges: ['Espace modéré', 'Pseudonyme par défaut'],
    },
    personas: {
      title: 'Cette fonctionnalité est pour toi si tu es :',
      items: [
        { icon: 'Lock', title: 'Tu n\'oses pas en parler à ton entourage', description: 'Un espace où tu peux nommer les choses sans crainte du jugement' },
        { icon: 'MessageCircle', title: 'Tu veux des retours d\'hommes qui comprennent', description: 'Pas des conseils génériques, des hommes qui ont fait le chemin' },
        { icon: 'HeartHandshake', title: 'Tu te sens seul dans ta reconstruction', description: 'Tu réalises que d\'autres traversent exactement ça' },
      ],
    },
    testimonials: {
      title: 'Des hommes du Code en parlent',
      items: [
        { name: 'Nicolas', countryFlag: '🇫🇷', quote: "Je n'avais jamais dit à personne que je pleurais encore après mon divorce. Là, sous pseudonyme, je l'ai écrit. Trois hommes m'ont répondu qu'ils étaient passés par là." },
        { name: 'Yanis', countryFlag: '🇧🇪', quote: "Pas de jugement, pas de bruit. Juste des hommes qui bossent les mêmes piliers que moi. Ça change tout de ne plus se sentir seul avec ça." },
        { name: 'Olivier', countryFlag: '🇨🇦', quote: "J'ai posté sur le Pilier Courage un truc que je n'osais dire à personne dans ma vie. La réponse d'un membre m'a débloqué plus qu'un mois de réflexion solo." },
        { name: 'Cédric', countryFlag: '🇨🇭', quote: "C'est le seul endroit où je peux parler de mes doutes sans qu'on me regarde de travers." },
      ],
    },
    cta: { title: 'Rejoindre la Communauté', subtitle: 'DISPONIBLE AVEC LE CODE MASCULIN' },
  },

  journal: {
    id: 'journal',
    hero: {
      title: 'Ta journée n\'est pas terminée tant que tu ne l\'as pas comprise',
      subtitle:
        'Le Journal du Soir te pose les 3 questions stoïciennes du Code — pour transformer ce qui t\'est arrivé en ce que tu maîtrises.',
    },
    overview: {
      title: 'Le Journal Guidé du Soir',
      description:
        "Ce n'est pas un journal intime. C'est l'outil de transformation quotidien le plus puissant du Code — 3 questions, chaque soir, pour décrypter tes réactions.",
      grid: [
        { icon: 'ScrollText', title: '3 questions stoïciennes', description: 'Le protocole exact du Pilier Stoïcisme' },
        { icon: 'Search', title: 'Décryptage d\'une situation du jour', description: 'Comprends une perte de centre en temps réel' },
        { icon: 'History', title: 'Historique consultable', description: 'Relis tes entrées passées pour voir tes patterns' },
        { icon: 'Link', title: 'Lié à ton pilier prioritaire', description: 'Les questions s\'adaptent à ce que tu travailles' },
        { icon: 'SunMoon', title: 'Préparation du lendemain', description: 'Termine par une intention claire pour demain' },
        { icon: 'Clock', title: '5 minutes, chaque soir', description: 'Court, mais non négociable' },
      ],
    },
    trust: {
      title: 'Le protocole du Pilier Stoïcisme, pas un template générique',
      text: 'Les questions viennent directement du Pilier Stoïcisme du Code — pas d\'un modèle de journaling trouvé en ligne.',
      badges: ['Basé sur le Pilier Stoïcisme', '5 minutes par soir'],
    },
    personas: {
      title: 'Cette fonctionnalité est pour toi si tu es :',
      items: [
        { icon: 'RotateCcw', title: 'Tu rumines sans jamais conclure', description: 'Tu repasses tes journées en boucle sans en tirer de leçon' },
        { icon: 'Flame', title: 'Tu perds ton centre facilement', description: 'Colère, frustration, réaction disproportionnée — tu veux comprendre pourquoi' },
        { icon: 'Moon', title: 'Tu veux une discipline du soir', description: 'Tu cherches un rituel court mais structurant' },
      ],
    },
    testimonials: {
      title: 'Des hommes du Code en parlent',
      items: [
        { name: 'David', countryFlag: '🇫🇷', quote: "Trois questions, cinq minutes, et pourtant c'est le moment de ma journée où je suis le plus honnête avec moi-même." },
        { name: 'Simon', countryFlag: '🇧🇪', quote: "Je rejouais mes journées en boucle sans jamais rien en tirer. Le Journal m'oblige à nommer la leçon, pas juste à revivre la scène." },
        { name: 'Kevin', countryFlag: '🇨🇦', quote: "J'ai vu sur deux semaines que je perdais mon centre presque toujours avec le même collègue. Ça m'a permis de préparer ma réponse au lieu de la subir." },
        { name: 'Frédéric', countryFlag: '🇨🇭', quote: "Ce n'est pas un journal intime de plus. C'est court, précis, et ça finit toujours par une intention concrète pour le lendemain." },
      ],
    },
    cta: { title: 'Commencer mon Journal', subtitle: 'DISPONIBLE AVEC LE CODE MASCULIN' },
  },

  programme: {
    id: 'programme',
    hero: {
      title: '52 semaines pour redevenir l\'homme que tu sais être',
      subtitle:
        'Le Programme du Code Masculin te fait traverser les 12 Piliers en 3 phases — Fondation, Identité, Impact. Un module par semaine, jamais improvisé.',
    },
    overview: {
      title: 'Le Programme',
      description:
        'Pas une bibliothèque de vidéos à consommer dans le désordre. Un parcours structuré, semaine après semaine, conçu pour que chaque pilier s\'ancre avant le suivant.',
      grid: [
        { icon: 'ListOrdered', title: '52 modules structurés', description: 'Un par semaine, drip sur 7 jours' },
        { icon: 'Layers', title: '3 phases progressives', description: 'Fondation, Identité, Impact' },
        { icon: 'PlaySquare', title: 'Vidéo + guide + défi', description: 'Chaque module combine transmission et action' },
        { icon: 'ScrollText', title: 'Journal de réflexion intégré', description: 'Des questions calibrées à chaque module' },
        { icon: 'Gauge', title: 'Rythme adaptable', description: 'Avance plus vite ou reprends où tu t\'es arrêté' },
        { icon: 'GitBranch', title: 'Fil conducteur clair', description: 'Chaque semaine construit sur la précédente' },
      ],
    },
    trust: {
      title: 'Le même Code, transmis dans l\'ordre',
      text: 'Chaque module suit la structure de transmission de Prince Johann — histoire réelle, concept, exercice, affirmations, vérité finale.',
      badges: ['52 modules complets', '3 phases structurées'],
    },
    personas: {
      title: 'Cette fonctionnalité est pour toi si tu es :',
      items: [
        { icon: 'Shuffle', title: 'Tu veux un parcours, pas du contenu random', description: 'Tu es fatigué de sauter d\'une vidéo à l\'autre sans structure' },
        { icon: 'CalendarCheck', title: 'Tu as besoin de rythme pour avancer', description: 'Un module par semaine te garde engagé sans t\'épuiser' },
        { icon: 'Hammer', title: 'Tu veux transformer, pas juste apprendre', description: 'Chaque module se termine par une action concrète, pas juste une idée' },
      ],
    },
    testimonials: {
      title: 'Des hommes du Code en parlent',
      items: [
        { name: 'Alexandre', countryFlag: '🇫🇷', quote: "52 semaines, ça paraissait long au départ. Avec le recul, c'est exactement le rythme qu'il me fallait pour que chaque pilier tienne, pas juste pour cocher une case." },
        { name: 'Louis', countryFlag: '🇧🇪', quote: "J'ai arrêté de sauter d'une vidéo de développement personnel à l'autre sans jamais rien appliquer. Ici, chaque semaine construit sur la précédente." },
        { name: 'Maxime', countryFlag: '🇨🇦', quote: "Le module sur le Pilier Vulnérabilité Stratégique m'a fait comprendre pourquoi je m'isolais depuis des années. Ce n'était pas de la faiblesse, c'était de la peur mal gérée." },
        { name: 'Éric', countryFlag: '🇨🇭', quote: "J'ai repris après 3 semaines de pause sans culpabiliser, juste en reprenant où j'étais. La structure permet ça." },
      ],
    },
    cta: { title: 'Commencer le Programme', subtitle: 'DISPONIBLE AVEC LE CODE MASCULIN' },
  },

  bibliotheque: {
    id: 'bibliotheque',
    hero: {
      title: 'Tout le Code, organisé, pas éparpillé',
      subtitle:
        'La Bibliothèque rassemble les ressources du Code Masculin — guides, exercices, épisodes — classées par pilier, accessibles à tout moment.',
    },
    overview: {
      title: 'La Bibliothèque',
      description:
        'Tu as besoin d\'un outil précis, maintenant ? Pas besoin de fouiller dans 50 épisodes. La Bibliothèque t\'y amène en 2 taps.',
      grid: [
        { icon: 'FolderTree', title: 'Classement par pilier', description: 'Trouve la ressource liée à ce que tu travailles' },
        { icon: 'FileDown', title: 'Guides téléchargeables', description: 'PDF des modules et protocoles' },
        { icon: 'Headphones', title: 'Épisodes podcast archivés', description: 'Toute la transmission audio, organisée' },
        { icon: 'ClipboardList', title: 'Exercices prêts à l\'emploi', description: 'Scripts, journaux, protocoles 7 jours' },
        { icon: 'Search', title: 'Recherche rapide', description: 'Trouve une ressource précise en quelques secondes' },
        { icon: 'RefreshCw', title: 'Mise à jour continue', description: 'De nouvelles ressources s\'ajoutent au fil du temps' },
      ],
    },
    trust: {
      title: 'La transmission complète, pas des extraits',
      text: 'Chaque ressource de la Bibliothèque vient directement du Code — rien de généré à la volée, rien d\'externe.',
      badges: ['Contenu complet du Code', 'Organisé par pilier'],
    },
    personas: {
      title: 'Cette fonctionnalité est pour toi si tu es :',
      items: [
        { icon: 'RotateCw', title: 'Tu veux revenir sur un outil précis', description: 'Tu as besoin du protocole exact, pas de le chercher 10 minutes' },
        { icon: 'BookOpen', title: 'Tu apprends mieux en revisitant', description: 'Tu veux pouvoir relire un module plusieurs fois' },
        { icon: 'Library', title: 'Tu veux tout le Code sous la main', description: 'Pas seulement ce que tu as déjà vu, mais tout ce qui existe' },
      ],
    },
    testimonials: {
      title: 'Des hommes du Code en parlent',
      items: [
        { name: 'Sébastien', countryFlag: '🇫🇷', quote: "J'avais besoin du protocole exact du Pilier Stoïcisme en pleine crise, pas de le chercher dans 40 épisodes de podcast. Je l'ai trouvé en 10 secondes." },
        { name: 'Hugo', countryFlag: '🇧🇪', quote: "Je reviens régulièrement sur les mêmes guides PDF. Les avoir classés par pilier change tout par rapport à devoir tout refouiller." },
        { name: 'Pierre', countryFlag: '🇨🇦', quote: "J'écoute les épisodes podcast en voiture, dans l'ordre du pilier que je travaille. C'est devenu mon rituel du matin." },
        { name: 'Nathan', countryFlag: '🇨🇭', quote: "Les exercices prêts à l'emploi m'ont évité de tout réinventer chaque fois que je voulais retravailler un pilier." },
      ],
    },
    cta: { title: 'Explorer la Bibliothèque', subtitle: 'DISPONIBLE AVEC LE CODE MASCULIN' },
  },
};