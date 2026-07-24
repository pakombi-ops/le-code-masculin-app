/**
 * constants/lessons.ts
 * ====================
 * Les 52 modules EXACTS du programme Code Masculin
 * Conformes au document officiel PROGRAMME CODE MASCULIN v2.0
 */

export type LessonStatus = 'completed' | 'active' | 'locked';
export type LessonType = 'video' | 'audio';
export type ResourceType = 'audio' | 'pdf' | 'template' | 'video';

export interface Resource {
  id: string;
  lessonId: string;
  pillarId: number;
  title: string;
  type: ResourceType;
  filename: string;
}

export interface Lesson {
  id: string;
  pillarId: number;
  weekNumber: number;
  order: number;
  title: string;
  type: LessonType;
  duration: number;
  status: LessonStatus;
  description: string;
  keyInsight: string;
  challenge: string;
  resources: Resource[];
}

export interface Week {
  number: number;
  title: string;
  lessons: Lesson[];
}

const ALL_LESSONS: Lesson[] = [
  // MODULE 0 — Avant de commencer
  { id:'module0-naviguer', pillarId:0, weekNumber:0, order:1, title:'Comment naviguer dans le programme', type:'video', duration:8*60, status:'locked',
    description:'[CONTENU À COMPLÉTER — Prince] Présentation de la structure du programme : les 12 piliers, les 3 phases, le rythme hebdomadaire, comment utiliser l\'app au quotidien.',
    keyInsight:'[CONTENU À COMPLÉTER]',
    challenge:'[CONTENU À COMPLÉTER]',
    resources:[]},
  { id:'module0-bienvenue', pillarId:0, weekNumber:0, order:2, title:'Bienvenue dans Le Cercle des Piliers', type:'video', duration:6*60, status:'locked',
    description:'[CONTENU À COMPLÉTER — Prince] Mot de bienvenue de Prince Johann, présentation de la communauté et de l\'esprit du Code Masculin.',
    keyInsight:'[CONTENU À COMPLÉTER]',
    challenge:'[CONTENU À COMPLÉTER]',
    resources:[]},
  // P1 S1
  { id:'p1-s1', pillarId:1, weekNumber:1, order:1, title:'Ton Corps, Ton Premier Domaine de Conquête', type:'video', duration:20*60, status:'completed',
    description:'Pourquoi un homme faible physiquement est vulnérable mentalement. Le lien direct testostérone-confiance-respect de soi. La discipline physique qui "saigne" dans tous les domaines de vie. Évaluation de départ : où en es-tu vraiment ?',
    keyInsight:'Chaque matin que tu rates ton entraînement, tu envoies un message à ton inconscient : "Je ne vaux pas l\'effort." Répète ça 365 jours et tu finiras par le croire.',
    challenge:'Le Test des Fondations : 20 pompes sans pause, 30 squats sans pause, 1 minute de planche. Note tes résultats — tu les referas à la Semaine 52.',
    resources:[
      {id:'r-p1s1-audio', lessonId:'p1-s1', pillarId:1, title:'Méditation sur le Respect du Corps', type:'audio', filename:'audio-p1-respect-corps.mp3'},
      {id:'r-p1s1-pdf', lessonId:'p1-s1', pillarId:1, title:'Autoévaluation Corporelle', type:'pdf', filename:'pdf-p1-autoevaluation.pdf'},
    ]},
  // P1 S2
  { id:'p1-s2', pillarId:1, weekNumber:2, order:1, title:'Le Système d\'Entraînement Non-Négociable', type:'video', duration:22*60, status:'active',
    description:'Les 3 entraînements minimum par semaine. Les exercices composés essentiels : squat, deadlift, bench, pull-ups. Comment structurer une session de 45 minutes efficace. Les erreurs de débutants à éviter.',
    keyInsight:'Tu n\'as pas besoin d\'une salle à 150€/mois. Tu as besoin de 3 sessions de 45 min par semaine. Cohérence > intensité.',
    challenge:'3 entraînements complets planifiés et exécutés cette semaine. Jours et heures décidés maintenant.',
    resources:[
      {id:'r-p1s2-template', lessonId:'p1-s2', pillarId:1, title:'Programme d\'Entraînement 12 Semaines', type:'template', filename:'template-p1-entrainement.pdf'},
    ]},
  // P1 S3
  { id:'p1-s3', pillarId:1, weekNumber:3, order:1, title:'Nutrition de Guerrier', type:'video', duration:18*60, status:'locked',
    description:'Le minimum : 1.6-2g de protéines par kg. Ce qu\'il faut éliminer : alcool régulier, junk food, sucres raffinés. La préparation des repas. Le jeûne intermittent 16/8.',
    keyInsight:'La règle du supermarché : si tu ne l\'achètes pas, tu ne peux pas le manger. Fais tes courses le ventre plein avec une liste.',
    challenge:'Éliminer TOUT sucre raffiné pendant 7 jours consécutifs.',
    resources:[
      {id:'r-p1s3-pdf', lessonId:'p1-s3', pillarId:1, title:'10 Recettes Haute-Protéine (15 min)', type:'pdf', filename:'pdf-p1-recettes.pdf'},
      {id:'r-p1s3-template', lessonId:'p1-s3', pillarId:1, title:'Calculateur Besoins Caloriques', type:'template', filename:'template-p1-nutrition.pdf'},
    ]},
  // P1 S4
  { id:'p1-s4', pillarId:1, weekNumber:4, order:1, title:'Sommeil et Récupération — Le Tiers Oublié', type:'video', duration:16*60, status:'locked',
    description:'Pourquoi 7-8h est non-négociable. La routine du soir qui garantit un sommeil réparateur. Éliminer les disrupteurs. Le pouvoir de la récupération active.',
    keyInsight:'Tu peux t\'entraîner et manger parfaitement — si tu dors mal, tu sabotes 70% de tes résultats.',
    challenge:'7 nuits de 7-8h consécutives. Et le Défi des 100 : 100 pompes, 100 squats, 100 abdos répartis sur la journée.',
    resources:[
      {id:'r-p1s4-pdf', lessonId:'p1-s4', pillarId:1, title:'Routine du Soir Optimale', type:'pdf', filename:'pdf-p1-routine-soir.pdf'},
    ]},
  // P2 S5
  { id:'p2-s5', pillarId:2, weekNumber:5, order:1, title:'Discipline = Liberté (Le Paradoxe Stoïcien)', type:'video', duration:20*60, status:'locked',
    description:'Motivation vs Discipline : pourquoi la motivation te trahit toujours. Un homme sans discipline est un enfant dans un corps d\'adulte. Tenir ses promesses à soi-même = fondation du respect de soi.',
    keyInsight:'Chaque négociation avec toi-même érode ta confiance en toi. Ta parole — même à toi-même — a de la valeur. Ou elle n\'en a pas.',
    challenge:'Cette semaine : zéro négociation avec toi-même sur UNE chose décidée. Identifier où tu te mens à toi-même.',
    resources:[
      {id:'r-p2s5-audio', lessonId:'p2-s5', pillarId:2, title:'Audio : Reprogrammation de l\'Auto-Discipline', type:'audio', filename:'audio-p2-discipline.mp3'},
    ]},
  // P2 S6
  { id:'p2-s6', pillarId:2, weekNumber:6, order:1, title:'La Discipline Matinale (Gagner la Journée Avant 8h)', type:'video', duration:19*60, status:'locked',
    description:'Réveil à heure fixe même le weekend. Pas de snooze, jamais. Faire son lit : premier accomplissement. 10 min de mouvement avant tout écran.',
    keyInsight:'À 7h du matin, tu as déjà gagné ta journée. La plupart des hommes ne sont même pas encore réveillés.',
    challenge:'7 réveils à heure fixe + lit fait immédiatement. Pas une exception.',
    resources:[
      {id:'r-p2s6-template', lessonId:'p2-s6', pillarId:2, title:'Routine Matinale (3 niveaux)', type:'template', filename:'template-p2-routine-matinale.pdf'},
    ]},
  // P2 S7
  { id:'p2-s7', pillarId:2, weekNumber:7, order:1, title:'Discipline Digitale (Reprendre le Contrôle)', type:'video', duration:18*60, status:'locked',
    description:'Le piège de la dopamine facile. La règle 1-1 : pas d\'écran 1h après réveil, 1h avant coucher. Temps d\'écran < 3h/jour. Zéro pornographie.',
    keyInsight:'Imagine ce que tu pourrais accomplir avec 4 heures par jour consacrées à ta mission.',
    challenge:'7 jours sans réseaux sociaux (sauf professionnel). Téléphone dans une autre pièce la nuit.',
    resources:[
      {id:'r-p2s7-pdf', lessonId:'p2-s7', pillarId:2, title:'Audit Temps d\'Écran + Plan de Réduction', type:'pdf', filename:'pdf-p2-ecrans.pdf'},
    ]},
  // P2 S8
  { id:'p2-s8', pillarId:2, weekNumber:8, order:1, title:'Discipline Alimentaire et Financière', type:'video', duration:17*60, status:'locked',
    description:'Pas de sucre/alcool en semaine. Cuisiner minimum 5 repas/semaine. Budget mensuel respecté. Pas d\'achat impulsif > 50€ sans règle des 48h.',
    keyInsight:'L\'homme discipliné financièrement dort tranquille. Il peut dire non. Il n\'est pas esclave de son salaire.',
    challenge:'Créer et suivre ton premier budget hebdomadaire. Identifier et éliminer au moins 1 "fuite" financière.',
    resources:[
      {id:'r-p2s8-template', lessonId:'p2-s8', pillarId:2, title:'Budget Mensuel Simplifié', type:'template', filename:'template-p2-budget.pdf'},
    ]},
  // P2 S9
  { id:'p2-s9', pillarId:2, weekNumber:9, order:1, title:'Le Serment des 30 Jours (Maîtrise Totale)', type:'video', duration:17*60, status:'locked',
    description:'Le pouvoir des 30 jours : reprogrammation neuronale. Choisir UNE habitude non-négociable. Le système "Ne Brise Jamais la Chaîne". Recommencer à zéro sans excuse si tu craques.',
    keyInsight:'Ce n\'est pas l\'habitude spécifique qui change tout. C\'est de prouver à ton inconscient que TU TIENS TA PAROLE.',
    challenge:'Choisir ton habitude des 30 prochains jours et commencer aujourd\'hui. Options : douche froide, 20 pompes, zéro sucre, lecture 10 min, méditation 5 min.',
    resources:[
      {id:'r-p2s9-template', lessonId:'p2-s9', pillarId:2, title:'Contrat avec Toi-Même (à imprimer et signer)', type:'template', filename:'template-p2-contrat.pdf'},
    ]},
  // P7 S10
  { id:'p7-s10', pillarId:7, weekNumber:10, order:1, title:'Sortir du Mode Zombie (Être Ici, Maintenant)', type:'video', duration:16*60, status:'locked',
    description:'90% des hommes vivent en pilote automatique. L\'attention est ton bien le plus précieux. Le coût de la distraction sur tes relations et opportunités. La présence comme superpouvoir masculin.',
    keyInsight:'Ta femme ne se plaint pas que tu n\'es pas là. Elle se plaint que tu n\'es pas vraiment là quand tu y es.',
    challenge:'7 jours de méditation quotidienne, 5 min minimum. Check-in de présence 5x/jour.',
    resources:[
      {id:'r-p7s10-audio', lessonId:'p7-s10', pillarId:7, title:'Méditation de Présence et Ancrage', type:'audio', filename:'audio-p7-presence.mp3'},
    ]},
  // P7 S11
  { id:'p7-s11', pillarId:7, weekNumber:11, order:1, title:'Présence Relationnelle (Le Cadeau d\'Attention)', type:'video', duration:18*60, status:'locked',
    description:'L\'écoute active vs simplement entendre. Conversations sans téléphone : le minimum non-négociable. Être pleinement là = le meilleur cadeau.',
    keyInsight:'Dans un monde où tout le monde est distrait 24h/24, ta présence totale est magnétique.',
    challenge:'7 conversations avec 0 distraction cette semaine. Dîner en famille sans téléphones.',
    resources:[
      {id:'r-p7s11-pdf', lessonId:'p7-s11', pillarId:7, title:'Exercice d\'Écoute Profonde', type:'pdf', filename:'pdf-p7-ecoute.pdf'},
    ]},
  // P7 S12
  { id:'p7-s12', pillarId:7, weekNumber:12, order:1, title:'Présence Sensorielle (Réveiller Tes Sens)', type:'audio', duration:14*60, status:'locked',
    description:'La déconnexion du corps. Exercices sensoriels : goût, toucher, odorat, vue, ouïe. La marche consciente. La sexualité présente vs le sexe automatique.',
    keyInsight:'Tu ne peux pas être pleinement présent avec les autres si tu n\'es pas présent dans ton propre corps.',
    challenge:'1 marche de 20 min sans téléphone, sans musique. 1 repas en silence cette semaine.',
    resources:[
      {id:'r-p7s12-pdf', lessonId:'p7-s12', pillarId:7, title:'Guide des 5 Exercices Sensoriels Quotidiens', type:'pdf', filename:'pdf-p7-sensoriels.pdf'},
    ]},
  // P7 S13
  { id:'p7-s13', pillarId:7, weekNumber:13, order:1, title:'Présence au Travail et en Créativité', type:'video', duration:17*60, status:'locked',
    description:'Le coût du multitasking. Deep Work : concentration pure. Éliminer les interruptions. Flow state : comment y entrer.',
    keyInsight:'La première heure de ta journée donne le ton pour les 23 heures suivantes.',
    challenge:'1 session de Deep Work de 90 min. 1 journée sans notifications.',
    resources:[
      {id:'r-p7s13-pdf', lessonId:'p7-s13', pillarId:7, title:'Guide Deep Work et Flow', type:'pdf', filename:'pdf-p7-deep-work.pdf'},
    ]},
  // P8 S14
  { id:'p8-s14', pillarId:8, weekNumber:14, order:1, title:'Maîtriser Tes Émotions (Sans Les Réprimer)', type:'video', duration:21*60, status:'locked',
    description:'Émotions = information, pas commandement. Ressentir vs réagir. Technique "Pause-Observe-Choisis". Pourquoi la maîtrise émotionnelle est attractive.',
    keyInsight:'Ton calme sous pression régule physiologiquement ton entourage. Ils se calment parce que TU es calme.',
    challenge:'Face à chaque frustration : pause de 10 secondes. Journal émotionnel : déclencheurs et réactions.',
    resources:[
      {id:'r-p8s14-audio', lessonId:'p8-s14', pillarId:8, title:'Méditation Stoïcienne de Détachement', type:'audio', filename:'audio-p8-stoicisme.mp3'},
      {id:'r-p8s14-template', lessonId:'p8-s14', pillarId:8, title:'Journal Émotionnel — Déclencheurs', type:'template', filename:'template-p8-journal-emotions.pdf'},
    ]},
  // P8 S15
  { id:'p8-s15', pillarId:8, weekNumber:15, order:1, title:'L\'Art de Ne Pas Réagir', type:'video', duration:19*60, status:'locked',
    description:'Les tests de ta femme, de la vie, des collègues. Pourquoi les gens testent les hommes. Comment passer les tests sans faillir. La puissance du silence stratégique.',
    keyInsight:'Un homme qui réagit automatiquement est prévisible. Un homme qui choisit sa réponse est magnétique.',
    challenge:'Face à une provocation : rester silencieux et calme. Identifier tes déclencheurs automatiques.',
    resources:[
      {id:'r-p8s15-pdf', lessonId:'p8-s15', pillarId:8, title:'Les 10 Tests Fréquents et Comment y Répondre', type:'pdf', filename:'pdf-p8-tests.pdf'},
    ]},
  // P8 S16
  { id:'p8-s16', pillarId:8, weekNumber:16, order:1, title:'Accepter Ce Que Tu Ne Peux Pas Contrôler', type:'video', duration:18*60, status:'locked',
    description:'La dichotomie du contrôle selon Marc Aurèle. Ce qui dépend de toi vs ce qui n\'en dépend pas. Focus 100% sur tes actions, 0% sur les résultats.',
    keyInsight:'"N\'espère pas que les choses se passent comme tu veux. Veux qu\'elles se passent comme elles se passent, et tu seras heureux." — Épictète',
    challenge:'Chaque soir : lister ce que tu ne peux pas contrôler — et le lâcher. Visualisation 10 min/jour.',
    resources:[
      {id:'r-p8s16-template', lessonId:'p8-s16', pillarId:8, title:'Tableau des Sphères de Contrôle', type:'template', filename:'template-p8-controle.pdf'},
    ]},
  // P8 S17
  { id:'p8-s17', pillarId:8, weekNumber:17, order:1, title:'Transformer l\'Adversité en Force', type:'video', duration:16*60, status:'locked',
    description:'Amor Fati : aimer son destin. Chaque échec est un enseignement. Les hommes forts sont forgés dans la difficulté. Comment recadrer n\'importe quelle épreuve.',
    keyInsight:'La chrysalide ne devient pas papillon sans lutte. L\'acier ne devient pas trempé sans feu. L\'homme ne devient pas grand sans épreuve.',
    challenge:'Identifier 1 échec passé et écrire 5 leçons précises. Affronter 1 peur que tu évites depuis longtemps.',
    resources:[
      {id:'r-p8s17-template', lessonId:'p8-s17', pillarId:8, title:'Journal de Gratitude pour les Difficultés', type:'template', filename:'template-p8-gratitude.pdf'},
    ]},
  // BILAN S18
  { id:'bilan-s18', pillarId:2, weekNumber:18, order:1, title:'BILAN PHASE 1 — Fondations Établies', type:'video', duration:25*60, status:'locked',
    description:'Auto-évaluation des 4 piliers de fondation. Refaire le Test des Fondations du Module 1 et comparer. Identifier victoires et points faibles. Préparer les 17 prochaines semaines.',
    keyInsight:'La fondation n\'est jamais parfaite. Elle est suffisamment solide pour commencer à construire l\'identité dessus.',
    challenge:'Lettre à toi-même : "Qui je suis devenu en 17 semaines." Score 1-10 sur chaque pilier. Partager 1 victoire dans la communauté.',
    resources:[
      {id:'r-b1s18-template', lessonId:'bilan-s18', pillarId:2, title:'Grille d\'Autoévaluation Phase 1', type:'template', filename:'template-bilan1.pdf'},
    ]},
  // P3 S19
  { id:'p3-s19', pillarId:3, weekNumber:19, order:1, title:'Leadership de Soi (Avant de Diriger les Autres)', type:'video', duration:20*60, status:'locked',
    description:'On ne peut pas diriger les autres si on ne se dirige pas soi-même. Vision personnelle : où vas-tu dans 5 ans ? Prendre des décisions claires et rapides.',
    keyInsight:'Ta partenaire veut que tu mènes. Pas comme un dictateur — comme un capitaine qui connaît la destination.',
    challenge:'Écrire ta vision de vie sur 5 ans — 1 page minimum. Définir tes 5 valeurs non-négociables.',
    resources:[
      {id:'r-p3s19-pdf', lessonId:'p3-s19', pillarId:3, title:'Questionnaire de Clarification de Vision', type:'pdf', filename:'pdf-p3-vision.pdf'},
    ]},
  // P3 S20
  { id:'p3-s20', pillarId:3, weekNumber:20, order:1, title:'Leadership dans le Couple', type:'video', duration:22*60, status:'locked',
    description:'Pourquoi le couple a besoin d\'un leader. Prendre l\'initiative : dates, décisions, direction. Être le roc émotionnel. Ne jamais demander "qu\'est-ce qu\'on fait ?"',
    keyInsight:'"Pendant 7 ans j\'ai demandé son avis sur TOUT. Elle a dit : J\'ai l\'impression d\'être ta mère, pas ta femme."',
    challenge:'Planifier 1 date surprise — décider seul tout. Au restaurant : commander pour deux après avoir demandé.',
    resources:[
      {id:'r-p3s20-template', lessonId:'p3-s20', pillarId:3, title:'Définir la Vision de Ton Couple', type:'template', filename:'template-p3-couple.pdf'},
    ]},
  // P3 S21
  { id:'p3-s21', pillarId:3, weekNumber:21, order:1, title:'Leadership Familial et Paternel', type:'video', duration:18*60, status:'locked',
    description:'Présence intentionnelle avec les enfants. Établir des règles et limites claires. Modéliser les comportements. Protéger et pourvoir.',
    keyInsight:'Mon fils m\'imite dans mes tractions. Je ne lui enseigne pas à être fort avec des mots. Je lui montre.',
    challenge:'30 min de temps 1-on-1 avec chaque enfant. Écrire les 5 valeurs à transmettre.',
    resources:[
      {id:'r-p3s21-pdf', lessonId:'p3-s21', pillarId:3, title:'Guide Rituel Père-Enfant Hebdomadaire', type:'pdf', filename:'pdf-p3-famille.pdf'},
    ]},
  // P3 S22
  { id:'p3-s22', pillarId:3, weekNumber:22, order:1, title:'Leadership au Travail et Social', type:'video', duration:17*60, status:'locked',
    description:'Prendre des décisions même sans information complète. Assumer la responsabilité — jamais blâmer. Élever ceux qui t\'entourent. Être le pont, pas le mur.',
    keyInsight:'Dans 92% des situations sociales, un leader naturel émerge dans les 5 premières minutes. Sois cet homme.',
    challenge:'Organiser 1 événement social — initiative totale. Introduire 2 personnes l\'une à l\'autre.',
    resources:[]},
  // P3 S23
  { id:'p3-s23', pillarId:3, weekNumber:23, order:1, title:'Prendre des Décisions Sans Torture', type:'video', duration:16*60, status:'locked',
    description:'L\'indécision est plus toxique qu\'une mauvaise décision. La règle 10-10-10. Décider rapidement avec confiance. Assumer sans regret.',
    keyInsight:'Quand tu délègues constamment les décisions, tu délègues aussi ton pouvoir et ton attractivité.',
    challenge:'Prendre 1 décision importante que tu reportais. Trancher sur 1 des 3 décisions que tu évites.',
    resources:[
      {id:'r-p3s23-template', lessonId:'p3-s23', pillarId:3, title:'Matrice de Décision Rapide', type:'template', filename:'template-p3-decision.pdf'},
    ]},
  // P5 S24
  { id:'p5-s24', pillarId:5, weekNumber:24, order:1, title:'Trouver Ta Mission de Vie', type:'video', duration:23*60, status:'locked',
    description:'Un homme sans mission est un bateau à la dérive. Mission vs objectif. Les 3 questions pour identifier ton purpose. Pourquoi la mission rend attirant.',
    keyInsight:'"Ce n\'est pas l\'argent qui m\'attirait. C\'était l\'homme en MISSION. Il avait du FEU dans les yeux."',
    challenge:'Répondre aux 3 questions du purpose — 3 pages minimum. Exercice Ikigai masculin.',
    resources:[
      {id:'r-p5s24-pdf', lessonId:'p5-s24', pillarId:5, title:'Workbook Découverte de Mission (20 questions)', type:'pdf', filename:'pdf-p5-mission.pdf'},
    ]},
  // P5 S25
  { id:'p5-s25', pillarId:5, weekNumber:25, order:1, title:'Aligner Tes Actions Avec Ton Purpose', type:'video', duration:19*60, status:'locked',
    description:'L\'incohérence crée la souffrance. Audit de vie. Comment dire non. Réorganiser ta vie autour de ta mission.',
    keyInsight:'Si ta partenaire est ta raison de vivre, tu mets sur elle un poids qu\'elle ne peut pas porter.',
    challenge:'Audit de tes 168h hebdomadaires. Éliminer 1 activité qui ne sert pas ton purpose.',
    resources:[
      {id:'r-p5s25-template', lessonId:'p5-s25', pillarId:5, title:'Matrice d\'Alignement Vie-Mission', type:'template', filename:'template-p5-alignement.pdf'},
    ]},
  // P5 S26
  { id:'p5-s26', pillarId:5, weekNumber:26, order:1, title:'Transformer Ton Travail en Mission', type:'video', duration:20*60, status:'locked',
    description:'Soit ton travail sert ta mission, soit tu en changes. Trouver du sens même dans un job ordinaire. Créer une side-mission. Ton travail comme expression de ta valeur.',
    keyInsight:'David gagnait 40% moins. Mais il avait du FEU dans les yeux. Sa vie sexuelle avait explosé.',
    challenge:'Identifier comment ton travail peut servir ta mission. Commencer 1 projet personnel aligné.',
    resources:[
      {id:'r-p5s26-pdf', lessonId:'p5-s26', pillarId:5, title:'Plan de Transition de Carrière', type:'pdf', filename:'pdf-p5-transition.pdf'},
    ]},
  // P5 S27
  { id:'p5-s27', pillarId:5, weekNumber:27, order:1, title:'Vivre Avec Intention (Exit le Pilote Automatique)', type:'video', duration:17*60, status:'locked',
    description:'Activité vs accomplissement. Vivre par intention vs par défaut. Le rituel du dimanche soir. "Je suis occupé" est souvent un mensonge.',
    keyInsight:'L\'homme sans vision vit dans la distraction. L\'homme avec une vision vit dans la traction.',
    challenge:'Planifier chaque journée la veille selon ton purpose. Éliminer 3 activités inutiles.',
    resources:[
      {id:'r-p5s27-template', lessonId:'p5-s27', pillarId:5, title:'Template de Planification Hebdomadaire', type:'template', filename:'template-p5-planification.pdf'},
    ]},
  // P6 S28
  { id:'p6-s28', pillarId:6, weekNumber:28, order:1, title:'Ta Parole Est Ton Honneur', type:'video', duration:19*60, status:'locked',
    description:'Un homme sans honneur ne peut rien construire de durable. Tenir ses promesses surtout les petites. Ne jamais promettre sans pouvoir tenir. Réparer quand on a brisé sa parole.',
    keyInsight:'"Il faut 20 ans pour bâtir une réputation et 5 minutes pour la détruire." — Warren Buffett',
    challenge:'Tenir TOUTES tes promesses cette semaine. Audit de parole. Réparer 1 promesse brisée.',
    resources:[]},
  // P6 S29
  { id:'p6-s29', pillarId:6, weekNumber:29, order:1, title:'Intégrité dans Tous Les Domaines', type:'video', duration:18*60, status:'locked',
    description:'Intégrité totale même quand personne ne regarde. Les petites malhonnêtetés qui érodent l\'âme. Le coût réel du mensonge. Comment réparer.',
    keyInsight:'Quand tu vis avec intégrité, tu n\'as rien à cacher. Pas de secrets qui rongent.',
    challenge:'Zéro mensonge pendant 7 jours. Lister où tu manques d\'intégrité. Confesser 1 mensonge.',
    resources:[]},
  // P6 S30
  { id:'p6-s30', pillarId:6, weekNumber:30, order:1, title:'Protéger Les Faibles (Sans Paternalisme)', type:'video', duration:16*60, status:'locked',
    description:'Le devoir masculin de protection — pas contrôle. Différence entre protéger et étouffer. Quand intervenir. Courage face à l\'injustice.',
    keyInsight:'La force sans honneur est dangereuse. L\'honneur sans force est impuissant.',
    challenge:'Défendre quelqu\'un qui en a besoin — action concrète.',
    resources:[
      {id:'r-p6s30-pdf', lessonId:'p6-s30', pillarId:6, title:'Guide de l\'Intervention Sécuritaire', type:'pdf', filename:'pdf-p6-protection.pdf'},
    ]},
  // P6 S31
  { id:'p6-s31', pillarId:6, weekNumber:31, order:1, title:'L\'Honneur dans la Défaite', type:'video', duration:16*60, status:'locked',
    description:'Comment un homme perd révèle son caractère. Accepter sans excuses. Féliciter sincèrement. Apprendre, ajuster, revenir.',
    keyInsight:'Les hommes d\'honneur sont rares. Les gens veulent faire affaire avec eux.',
    challenge:'Reconnaître 1 échec sans excuse. Écrire une lettre de félicitations à quelqu\'un qui t\'a battu.',
    resources:[]},
  // P11 S32
  { id:'p11-s32', pillarId:11, weekNumber:32, order:1, title:'Arrêter de Porter un Masque', type:'video', duration:20*60, status:'locked',
    description:'Le coût épuisant de prétendre. Identifier ses masques. L\'authenticité est magnétique. Enlever les masques progressivement.',
    keyInsight:'Tu arrives chez toi vidé — pas à cause du travail, mais à cause de la performance constante.',
    challenge:'Identifier 3 masques. En retirer 1 consciemment. "Qui suis-je vraiment ?" : 20 réponses sans filtre.',
    resources:[]},
  // P11 S33
  { id:'p11-s33', pillarId:11, weekNumber:33, order:1, title:'Assumer Tes Désirs (Sans Honte)', type:'video', duration:17*60, status:'locked',
    description:'Les désirs masculins ne sont pas toxiques. Déconstruction de la culpabilité masculine moderne. Assumer ses ambitions ouvertement.',
    keyInsight:'L\'authenticité n\'est pas une agression. C\'est un respect de toi-même et des autres.',
    challenge:'Exprimer 1 désir ou ambition caché. Lister 10 désirs authentiques sans honte.',
    resources:[
      {id:'r-p11s33-template', lessonId:'p11-s33', pillarId:11, title:'Lettre de Permission à Toi-Même', type:'template', filename:'template-p11-permission.pdf'},
    ]},
  // P11 S34
  { id:'p11-s34', pillarId:11, weekNumber:34, order:1, title:'Vivre Selon Tes Valeurs (Pas Celles Des Autres)', type:'video', duration:18*60, status:'locked',
    description:'Combien de tes croyances sont vraiment les tiennes ? Identifier le conditionnement. Créer ton propre code. Courage de décevoir pour rester authentique.',
    keyInsight:'Elle veut l\'homme réel — avec ses forces ET ses faiblesses.',
    challenge:'Écrire tes 10 valeurs non-négociables. Dire non à quelque chose qui ne t\'honore pas.',
    resources:[]},
  // BILAN S35
  { id:'bilan-s35', pillarId:3, weekNumber:35, order:1, title:'BILAN PHASE 2 — Identité Clarifiée', type:'video', duration:25*60, status:'locked',
    description:'Auto-évaluation des piliers 3, 5, 6, 11. Témoignage vidéo. Préparer les 18 dernières semaines.',
    keyInsight:'L\'identité sans impact reste personnelle. La Phase 3 est là où tout devient réel pour les autres.',
    challenge:'Partager ta transformation avec 1 proche. Lettre : "Ma mission de vie en une page".',
    resources:[
      {id:'r-b2s35-template', lessonId:'bilan-s35', pillarId:3, title:'Grille d\'Autoévaluation Phase 2', type:'template', filename:'template-bilan2.pdf'},
    ]},
  // P4 S36
  { id:'p4-s36', pillarId:4, weekNumber:36, order:1, title:'Vulnérabilité ≠ Faiblesse', type:'video', duration:21*60, status:'locked',
    description:'Un homme qui ne s\'ouvre jamais est un mur, pas un pont. Vulnérabilité stratégique : avec qui, quand, comment. La vraie force peut se permettre la vulnérabilité.',
    keyInsight:'Ouvrir son cœur tout en gardant son centre — ça, c\'est du vrai leadership.',
    challenge:'Partager 1 difficulté réelle avec ta partenaire ou un ami. Identifier ton cercle de confiance.',
    resources:[
      {id:'r-p4s36-audio', lessonId:'p4-s36', pillarId:4, title:'Méditation sur l\'Ouverture du Cœur', type:'audio', filename:'audio-p4-ouverture.mp3'},
    ]},
  // P4 S37
  { id:'p4-s37', pillarId:4, weekNumber:37, order:1, title:'L\'Art de Demander de l\'Aide', type:'video', duration:16*60, status:'locked',
    description:'Le suicide masculin commence par "je ne veux déranger personne". Demander = courage. Comment demander sans paraître désespéré. Réseau de soutien masculin.',
    keyInsight:'L\'isolement masculin est une crise silencieuse. Un homme qui ne s\'ouvre à personne finit seul.',
    challenge:'Demander de l\'aide à quelqu\'un sur quelque chose de réel. Rejoindre ou créer 1 groupe de soutien.',
    resources:[]},
  // P4 S38
  { id:'p4-s38', pillarId:4, weekNumber:38, order:1, title:'Partager Tes Émotions Sans Te Plaindre', type:'video', duration:17*60, status:'locked',
    description:'Partage vs vomissement émotionnel. Structure de communication saine. Quand partager avec la partenaire vs un frère.',
    keyInsight:'Les couples où les deux articulent les valeurs de l\'autre avec 80% de précision ont 94% de satisfaction supérieure.',
    challenge:'Exprimer 1 émotion difficile avec la technique apprise.',
    resources:[
      {id:'r-p4s38-template', lessonId:'p4-s38', pillarId:4, title:'5 Phrases pour Exprimer une Émotion', type:'template', filename:'template-p4-emotions.pdf'},
    ]},
  // P4 S39
  { id:'p4-s39', pillarId:4, weekNumber:39, order:1, title:'Créer des Amitiés Masculines Profondes', type:'audio', duration:14*60, status:'locked',
    description:'Pourquoi les hommes modernes n\'ont plus d\'amis proches. Le besoin biologique de fraternité. Créer des liens profonds sans superficialité.',
    keyInsight:'La responsabilité partagée multiplie les résultats par 10.',
    challenge:'Organiser 1 activité avec un ami sans alcool ni distractions. 1 conversation profonde.',
    resources:[]},
  // P9 S40
  { id:'p9-s40', pillarId:9, weekNumber:40, order:1, title:'Donner Sans Attendre en Retour', type:'video', duration:18*60, status:'locked',
    description:'Générosité masculine vs générosité "Nice Guy". Donner de sa force. Le paradoxe : plus tu donnes, plus tu reçois. Donner sans s\'épuiser.',
    keyInsight:'Mathieu n\'avait pas changé ses finances. Il avait changé son état d\'esprit. Et sa femme l\'a senti.',
    challenge:'1 acte généreux anonyme par jour pendant 7 jours.',
    resources:[
      {id:'r-p9s40-audio', lessonId:'p9-s40', pillarId:9, title:'Méditation sur l\'Abondance et la Générosité', type:'audio', filename:'audio-p9-abondance.mp3'},
    ]},
  // P9 S41
  { id:'p9-s41', pillarId:9, weekNumber:41, order:1, title:'Mentorat et Transmission', type:'video', duration:17*60, status:'locked',
    description:'Le devoir de transmettre. Comment identifier qui mentorer. Mentorat formel vs informel. Erreurs à éviter.',
    keyInsight:'Mon père ne m\'a pas transmis le Code. La chaîne était brisée. Toi, tu peux la réparer.',
    challenge:'Offrir aide ou conseil à 1 jeune homme. Prendre 1 mentoré informel sous son aile.',
    resources:[]},
  // P9 S42
  { id:'p9-s42', pillarId:9, weekNumber:42, order:1, title:'Service Communautaire et Impact', type:'video', duration:16*60, status:'locked',
    description:'Pourquoi les hommes ont besoin de servir une cause. Trouver une cause qui résonne. Engagement régulier. Impact local.',
    keyInsight:'Un homme généreux en service crée un impact qui dure longtemps après lui.',
    challenge:'Identifier 1 cause locale et faire 1 action concrète. Plan : 4h/mois minimum.',
    resources:[]},
  // P9 S43
  { id:'p9-s43', pillarId:9, weekNumber:43, order:1, title:'Générosité Financière Stratégique', type:'video', duration:15*60, status:'locked',
    description:'Pourquoi donner de l\'argent est important. La règle des 10%. Choisir ses causes avec intention. Investir dans les gens.',
    keyInsight:'Tu donnes → Les gens t\'apprécient → Des opportunités viennent → Tu as plus à donner.',
    challenge:'Donner 10% de ton revenu cette semaine à une cause intentionnelle. Créer un budget de générosité.',
    resources:[
      {id:'r-p9s43-template', lessonId:'p9-s43', pillarId:9, title:'Budget de Générosité Annuel', type:'template', filename:'template-p9-budget-don.pdf'},
    ]},
  // P10 S44
  { id:'p10-s44', pillarId:10, weekNumber:44, order:1, title:'Affronter Tes Peurs (Identification)', type:'video', duration:20*60, status:'locked',
    description:'Tout homme a des peurs. Les 7 peurs masculines universelles. Identifier les siennes. Peur légitime vs peur limitante.',
    keyInsight:'76% des regrets de fin de vie concernent l\'INACTION — ce qu\'on n\'a pas osé faire.',
    challenge:'Écrire la liste complète de ses peurs sans filtre. Classer par impact.',
    resources:[
      {id:'r-p10s44-template', lessonId:'p10-s44', pillarId:10, title:'Inventaire des Peurs', type:'template', filename:'template-p10-peurs.pdf'},
    ]},
  // P10 S45
  { id:'p10-s45', pillarId:10, weekNumber:45, order:1, title:'Le Courage N\'Est Pas l\'Absence de Peur', type:'video', duration:19*60, status:'locked',
    description:'Courage = action malgré la peur. La peur est une information. Utiliser la peur comme carburant. Les hommes courageux tremblent aussi.',
    keyInsight:'"J\'aurais aimé avoir le courage de vivre la vie que je voulais." — Le regret #1 des mourants.',
    challenge:'1 chose qui fait peur chaque jour pendant 7 jours. Journal de courage.',
    resources:[
      {id:'r-p10s45-audio', lessonId:'p10-s45', pillarId:10, title:'Visualisation de Courage et Force', type:'audio', filename:'audio-p10-courage.mp3'},
    ]},
  // P10 S46
  { id:'p10-s46', pillarId:10, weekNumber:46, order:1, title:'Conversations Difficiles (Le Courage Relationnel)', type:'video', duration:18*60, status:'locked',
    description:'Pourquoi tu évites les conversations difficiles. Le coût de ne pas les avoir. Structure d\'une conversation difficile réussie. Scripts pour différentes situations.',
    keyInsight:'Le coût d\'une conversation difficile est toujours inférieur au coût de son absence.',
    challenge:'Avoir 1 conversation difficile évitée. Préparer 1 conversation à venir avec la structure.',
    resources:[
      {id:'r-p10s46-pdf', lessonId:'p10-s46', pillarId:10, title:'10 Scripts de Conversations Difficiles', type:'pdf', filename:'pdf-p10-scripts.pdf'},
    ]},
  // P10 S47
  { id:'p10-s47', pillarId:10, weekNumber:47, order:1, title:'Risquer Intelligemment', type:'video', duration:17*60, status:'locked',
    description:'Risque calculé vs témérité stupide. Sans risque, pas de croissance. Comment évaluer un risque. L\'analyse risque-récompense.',
    keyInsight:'La plupart des hommes surestiment le coût de l\'échec et sous-estiment le coût de ne jamais essayer.',
    challenge:'Prendre 1 risque calculé cette semaine. Utiliser la matrice risque-récompense.',
    resources:[
      {id:'r-p10s47-template', lessonId:'p10-s47', pillarId:10, title:'Matrice Risque-Récompense', type:'template', filename:'template-p10-risque.pdf'},
    ]},
  // P12 S48
  { id:'p12-s48', pillarId:12, weekNumber:48, order:1, title:'Penser Long-Terme (10-50 Ans)', type:'video', duration:22*60, status:'locked',
    description:'La plupart des hommes vivent dans l\'immédiat. Penser en décennies. Tes décisions d\'aujourd\'hui créent ton legacy. Vision sur 10, 25, 50 ans.',
    keyInsight:'Tu n\'es pas un accident. Tu n\'es pas juste en train de passer le temps. Tu es ici pour quelque chose.',
    challenge:'Écrire ta vision à 50, 70 et 90 ans. Ligne de vie sur 90 ans.',
    resources:[
      {id:'r-p12s48-audio', lessonId:'p12-s48', pillarId:12, title:'Méditation Memento Mori', type:'audio', filename:'audio-p12-memento-mori.mp3'},
    ]},
  // P12 S49
  { id:'p12-s49', pillarId:12, weekNumber:49, order:1, title:'Qu\'Est-Ce Qui Te Survivra ?', type:'video', duration:19*60, status:'locked',
    description:'Enfants, entreprise, livre, impact, valeurs. Ce qui reste après la mort. Construire quelque chose de durable. Les différentes formes de legacy.',
    keyInsight:'Les gens ne se souviendront pas de ton salaire. Ils se souviendront si tu étais un homme de parole.',
    challenge:'Choisir 1 projet legacy. Écrire "Le Testament de Vie" — lettre aux descendants.',
    resources:[
      {id:'r-p12s49-template', lessonId:'p12-s49', pillarId:12, title:'Testament de Vie — Lettre aux Descendants', type:'template', filename:'template-p12-testament.pdf'},
    ]},
  // P12 S50
  { id:'p12-s50', pillarId:12, weekNumber:50, order:1, title:'Documenter et Transmettre', type:'video', duration:18*60, status:'locked',
    description:'Pourquoi documenter sa vie. Les leçons à transmettre. Capsules temporelles pour les enfants. L\'importance des histoires familiales.',
    keyInsight:'Ce livre contient tout ce que j\'aurais voulu qu\'on m\'enseigne. Tu peux écrire le tien.',
    challenge:'Enregistrer 1 vidéo-message pour ses descendants. Commencer son "Livre de Sagesse".',
    resources:[
      {id:'r-p12s50-template', lessonId:'p12-s50', pillarId:12, title:'Template de Capsule Temporelle', type:'template', filename:'template-p12-capsule.pdf'},
    ]},
  // P12 S51
  { id:'p12-s51', pillarId:12, weekNumber:51, order:1, title:'Construire Ton Propre Code', type:'video', duration:20*60, status:'locked',
    description:'Le Code Masculin est une base, pas une religion. Créer TON code : tes règles, tes valeurs. Document vivant à réviser chaque année. Transmettre à ses fils.',
    keyInsight:'Marc Aurèle avait ses Pensées pour moi-même. L\'homme du Code a son Code Personnel.',
    challenge:'"Mon Code Personnel" — 1 à 2 pages, 12 principes. Signer, dater, partager.',
    resources:[]},
  // GRAD S52
  { id:'grad-s52', pillarId:12, weekNumber:52, order:1, title:'GRADUATION — L\'Homme Que Tu Es Devenu', type:'video', duration:30*60, status:'locked',
    description:'Auto-évaluation finale des 12 piliers. Comparaison Semaine 1 vs 52. Refaire le Test des Fondations. Témoignage vidéo. Les 7 Rituels de Clôture. Contrat de Maintenance du Code.',
    keyInsight:'Ce programme n\'est pas une destination. C\'est le début d\'une vie consciente. Le Code t\'appartient. Va le vivre.',
    challenge:'7 Rituels de Clôture — 1 par jour : lettre, partage, célébration, mentorer 1 homme, Contrat 2.0, 3 objectifs, rituel personnel.',
    resources:[
      {id:'r-g52-pdf', lessonId:'grad-s52', pillarId:12, title:'Certificat de Graduation du Code Masculin', type:'pdf', filename:'certificat-graduation.pdf'},
      {id:'r-g52-template', lessonId:'grad-s52', pillarId:12, title:'Contrat de Maintenance du Code v2.0', type:'template', filename:'template-graduation-contrat.pdf'},
      {id:'r-g52-eval', lessonId:'grad-s52', pillarId:12, title:'Grille d\'Évaluation Finale 52 Semaines', type:'template', filename:'template-graduation-evaluation.pdf'},
    ]},
];

// ─── Utilitaires ───────────────────────────────────────────────────

const WEEK_TITLES: Record<number,string> = {
  1:'Ton Corps, Ton Premier Domaine',2:'Entraînement Non-Négociable',3:'Nutrition de Guerrier',4:'Sommeil et Récupération',
  5:'Discipline = Liberté',6:'Discipline Matinale',7:'Discipline Digitale',8:'Discipline Alimentaire & Financière',9:'Serment des 30 Jours',
  10:'Sortir du Mode Zombie',11:'Présence Relationnelle',12:'Présence Sensorielle',13:'Présence au Travail',
  14:'Maîtriser Tes Émotions',15:'L\'Art de Ne Pas Réagir',16:'Accepter Ce Tu Ne Contrôles Pas',17:'Transformer l\'Adversité',
  18:'Bilan Phase 1',
  19:'Leadership de Soi',20:'Leadership dans le Couple',21:'Leadership Familial',22:'Leadership au Travail',23:'Décisions Sans Torture',
  24:'Trouver Ta Mission',25:'Aligner Tes Actions',26:'Travail en Mission',27:'Vivre Avec Intention',
  28:'Ta Parole Est Ton Honneur',29:'Intégrité Totale',30:'Protéger les Faibles',31:'Honneur dans la Défaite',
  32:'Arrêter le Masque',33:'Assumer Tes Désirs',34:'Vivre Selon Tes Valeurs',
  35:'Bilan Phase 2',
  36:'Vulnérabilité ≠ Faiblesse',37:'Demander de l\'Aide',38:'Partager Sans Se Plaindre',39:'Amitiés Profondes',
  40:'Donner Sans Attendre',41:'Mentorat et Transmission',42:'Service Communautaire',43:'Générosité Financière',
  44:'Identifier Tes Peurs',45:'Agir Malgré la Peur',46:'Conversations Difficiles',47:'Risquer Intelligemment',
  48:'Penser Long-Terme',49:'Ce Qui Te Survivra',50:'Documenter et Transmettre',51:'Ton Propre Code',52:'Graduation',
};

export function getWeeksForPillar(pillarId: number): Week[] {
  const lessons = ALL_LESSONS.filter(l => l.pillarId === pillarId);
  if (!lessons.length) return [];
  const map = new Map<number, Lesson[]>();
  lessons.forEach(l => { if (!map.has(l.weekNumber)) map.set(l.weekNumber,[]);  map.get(l.weekNumber)!.push(l); });
  return Array.from(map.keys()).sort((a,b)=>a-b).map(n => ({ number:n, title:WEEK_TITLES[n]??`Semaine ${n}`, lessons:map.get(n)!.sort((a,b)=>a.order-b.order) }));
}

export function getLessonById(id: string): Lesson | undefined { return ALL_LESSONS.find(l=>l.id===id); }

export function getPillarProgress(pillarId: number): {completed:number;total:number} {
  const l = ALL_LESSONS.filter(l=>l.pillarId===pillarId);
  return { completed:l.filter(l=>l.status==='completed').length, total:l.length };
}

export function formatDuration(seconds: number): string {
  if (seconds<3600) return `${Math.floor(seconds/60)} min`;
  const h=Math.floor(seconds/3600), m=Math.floor((seconds%3600)/60);
  return m>0?`${h}h ${m}min`:`${h}h`;
}

export function getAllLessons(): Lesson[] { return [...ALL_LESSONS].sort((a,b)=>a.weekNumber-b.weekNumber); }
export function getActiveLesson(): Lesson|undefined { return ALL_LESSONS.find(l=>l.status==='active'); }

/** Toutes les ressources des leçons complétées → BIBLIOTHÈQUE */
export function getUnlockedResources(): Resource[] {
  return ALL_LESSONS.filter(l=>l.status==='completed').flatMap(l=>l.resources);
}

export function getUnlockedResourcesByPillar(pillarId:number): Resource[] {
  return ALL_LESSONS.filter(l=>l.pillarId===pillarId&&l.status==='completed').flatMap(l=>l.resources);
}

export function getUnlockedResourcesByType(type:ResourceType): Resource[] {
  return getUnlockedResources().filter(r=>r.type===type);
}
