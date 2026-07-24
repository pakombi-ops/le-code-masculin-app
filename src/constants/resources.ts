import { getAllLessons } from './lessons';

export type ResourceType = 'audio' | 'pdf' | 'template' | 'video' | 'ebook';
export type ResourceAccess = 'free' | 'premium';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  access: ResourceAccess;
  pillarId?: number;
  weekNumber?: number;
  lessonId?: string;
  filename: string;
  duration?: string;
  pages?: string;
  fileSize?: string;
  isDownloaded?: boolean;
}

const RESOURCE_META: Record<string, { description: string; duration?: string; pages?: string; fileSize?: string }> = {
  'audio-p1-respect-corps.mp3':    { description: 'Méditation guidée pour ancrer le respect de ton corps.', duration: '8 min', fileSize: '7.2 MB' },
  'audio-p2-discipline.mp3':       { description: 'Reprogrammation mentale pour l\'auto-discipline.', duration: '10 min', fileSize: '9.1 MB' },
  'audio-p7-presence.mp3':         { description: 'Méditation d\'ancrage dans le moment présent.', duration: '9 min', fileSize: '8.3 MB' },
  'audio-p8-stoicisme.mp3':        { description: 'Méditation stoïcienne de détachement émotionnel.', duration: '11 min', fileSize: '10.0 MB' },
  'audio-p4-ouverture.mp3':        { description: 'Méditation sur la vulnérabilité stratégique.', duration: '12 min', fileSize: '11.0 MB' },
  'audio-p9-abondance.mp3':        { description: 'Méditation sur la générosité et l\'abondance.', duration: '10 min', fileSize: '9.2 MB' },
  'audio-p10-courage.mp3':         { description: 'Visualisation de courage et de force intérieure.', duration: '13 min', fileSize: '11.9 MB' },
  'audio-p12-memento-mori.mp3':    { description: 'Méditation Memento Mori — ce qui compte vraiment.', duration: '15 min', fileSize: '13.7 MB' },
  'pdf-p1-autoevaluation.pdf':     { description: 'Évaluation de ta condition physique actuelle.', pages: '4 pages', fileSize: '1.2 MB' },
  'pdf-p1-recettes.pdf':           { description: '10 recettes haute-protéine en 15 minutes.', pages: '12 pages', fileSize: '2.4 MB' },
  'pdf-p1-routine-soir.pdf':       { description: 'Protocole du soir pour optimiser ton sommeil.', pages: '3 pages', fileSize: '0.9 MB' },
  'pdf-p2-ecrans.pdf':             { description: 'Audit temps d\'écran et plan de réduction 30 jours.', pages: '6 pages', fileSize: '1.4 MB' },
  'pdf-p3-vision.pdf':             { description: 'Questionnaire de clarification de vision 5-10-25 ans.', pages: '8 pages', fileSize: '1.8 MB' },
  'pdf-p3-famille.pdf':            { description: 'Guide rituel père-enfant hebdomadaire.', pages: '5 pages', fileSize: '1.3 MB' },
  'pdf-p5-mission.pdf':            { description: 'Workbook découverte de mission — 20 questions.', pages: '14 pages', fileSize: '2.8 MB' },
  'pdf-p5-transition.pdf':         { description: 'Plan de transition de carrière vers ta mission.', pages: '7 pages', fileSize: '1.6 MB' },
  'pdf-p6-protection.pdf':         { description: 'Guide de l\'intervention sécuritaire.', pages: '4 pages', fileSize: '1.0 MB' },
  'pdf-p7-ecoute.pdf':             { description: 'Exercice d\'écoute profonde avec un proche.', pages: '3 pages', fileSize: '0.8 MB' },
  'pdf-p7-sensoriels.pdf':         { description: 'Guide des 5 exercices sensoriels quotidiens.', pages: '5 pages', fileSize: '1.2 MB' },
  'pdf-p7-deep-work.pdf':          { description: 'Guide Deep Work et entrée en état de flow.', pages: '6 pages', fileSize: '1.5 MB' },
  'pdf-p8-tests.pdf':              { description: 'Les 10 tests fréquents et comment y répondre.', pages: '8 pages', fileSize: '1.7 MB' },
  'pdf-p10-scripts.pdf':           { description: '10 scripts de conversations difficiles prêts.', pages: '10 pages', fileSize: '2.0 MB' },
  'template-p1-entrainement.pdf':  { description: 'Programme d\'entraînement 12 semaines — 3 niveaux.', pages: '8 pages', fileSize: '1.8 MB' },
  'template-p1-nutrition.pdf':     { description: 'Calculateur besoins caloriques et protéiques.', pages: '2 pages', fileSize: '0.6 MB' },
  'template-p2-routine-matinale.pdf': { description: 'Routine matinale débutant / intermédiaire / avancé.', pages: '4 pages', fileSize: '1.0 MB' },
  'template-p2-budget.pdf':        { description: 'Budget mensuel simplifié avec épargne automatique.', pages: '3 pages', fileSize: '0.8 MB' },
  'template-p2-contrat.pdf':       { description: 'Contrat avec toi-même — à imprimer et signer.', pages: '1 page', fileSize: '0.5 MB' },
  'template-p3-couple.pdf':        { description: 'Définir la vision de ton couple ensemble.', pages: '4 pages', fileSize: '1.1 MB' },
  'template-p3-decision.pdf':      { description: 'Matrice de décision rapide — règle 10-10-10.', pages: '2 pages', fileSize: '0.6 MB' },
  'template-p4-emotions.pdf':      { description: '5 phrases pour exprimer une émotion sainement.', pages: '2 pages', fileSize: '0.5 MB' },
  'template-p5-alignement.pdf':    { description: 'Matrice alignement vie-mission — 168h hebdo.', pages: '3 pages', fileSize: '0.9 MB' },
  'template-p5-planification.pdf': { description: 'Planification hebdomadaire intentionnelle.', pages: '2 pages', fileSize: '0.6 MB' },
  'template-p8-journal-emotions.pdf': { description: 'Journal émotionnel — déclencheurs et réactions.', pages: '3 pages', fileSize: '0.8 MB' },
  'template-p8-controle.pdf':      { description: 'Tableau sphères de contrôle — stoïcisme pratique.', pages: '1 page', fileSize: '0.4 MB' },
  'template-p8-gratitude.pdf':     { description: 'Journal de gratitude pour les difficultés.', pages: '2 pages', fileSize: '0.5 MB' },
  'template-p9-budget-don.pdf':    { description: 'Budget de générosité annuel intentionnel.', pages: '2 pages', fileSize: '0.6 MB' },
  'template-p10-peurs.pdf':        { description: 'Inventaire des peurs — identifier et classer.', pages: '3 pages', fileSize: '0.8 MB' },
  'template-p10-risque.pdf':       { description: 'Matrice risque-récompense pour grands choix.', pages: '2 pages', fileSize: '0.6 MB' },
  'template-p11-permission.pdf':   { description: 'Lettre de permission à toi-même.', pages: '1 page', fileSize: '0.4 MB' },
  'template-p12-testament.pdf':    { description: 'Testament de Vie — lettre aux descendants.', pages: '4 pages', fileSize: '1.1 MB' },
  'template-p12-capsule.pdf':      { description: 'Capsule temporelle pour tes enfants.', pages: '3 pages', fileSize: '0.8 MB' },
  'template-bilan1.pdf':           { description: 'Autoévaluation Phase 1 — avant/après fondation.', pages: '4 pages', fileSize: '1.0 MB' },
  'template-bilan2.pdf':           { description: 'Autoévaluation Phase 2 — avant/après identité.', pages: '4 pages', fileSize: '1.0 MB' },
  'certificat-graduation.pdf':     { description: 'Certificat officiel de graduation du Code Masculin.', pages: '1 page', fileSize: '0.8 MB' },
  'template-graduation-contrat.pdf': { description: 'Contrat de Maintenance du Code v2.0.', pages: '2 pages', fileSize: '0.6 MB' },
  'template-graduation-evaluation.pdf': { description: 'Grille évaluation finale 52 semaines.', pages: '6 pages', fileSize: '1.4 MB' },
  'ebook-energie-vitale.pdf':    { description: 'Ravivez votre énergie vitale — récupérer ta vitalité masculine au quotidien.', pages: '45 pages', fileSize: '1.7 MB' },
'ebook-7-erreurs-couple.pdf':  { description: 'Les 7 erreurs qui tuent ton autorité dans le couple — et comment les corriger.', pages: '32 pages', fileSize: '1.0 MB' },
'ebook-rallumer-feu.pdf':      { description: 'Rallumer le feu — 21 techniques pour maintenir la passion dans une relation établie.', pages: '38 pages', fileSize: '1.4 MB' },
'ebook-decoder-femme.pdf':     { description: 'Décoder sa femme — le guide de la psychologie féminine pour mieux la comprendre.', pages: '52 pages', fileSize: '1.6 MB' },
'ebook-liberer-anxiete.pdf':   { description: 'Libérez-vous de l\'anxiété — protocole pratique pour retrouver ton calme intérieur.', pages: '48 pages', fileSize: '1.8 MB' },
};

function buildResources(): Resource[] {
  const lessons = getAllLessons();
  const result: Resource[] = [];
  for (const lesson of lessons) {
    for (const lr of lesson.resources) {
      const meta = RESOURCE_META[lr.filename];
      result.push({
        id: lr.id,
        title: lr.title,
        description: meta?.description ?? `Ressource — ${lesson.title}`,
        type: lr.type,
        access: lesson.status === 'completed' ? 'free' : 'premium',
        pillarId: lr.pillarId,
        weekNumber: lesson.weekNumber,
        lessonId: lr.lessonId,
        filename: lr.filename,
        duration: meta?.duration,
        pages: meta?.pages,
        fileSize: meta?.fileSize,
        isDownloaded: false,
      });
    }
  }
  // ── eBooks offerts — toujours gratuits ──────────────────────────
const FREE_EBOOKS: Resource[] = [
  {
    id: 'ebook-energie-vitale',
    title: 'Ravivez Votre Énergie Vitale',
    description: 'Récupère ta vitalité masculine au quotidien — énergie, testostérone, puissance.',
    type: 'ebook',
    access: 'free',
    pillarId: 1,
    filename: 'ebook-energie-vitale.pdf',
    pages: '45 pages',
    fileSize: '1.7 MB',
  },
  {
    id: 'ebook-7-erreurs-couple',
    title: 'Les 7 Erreurs qui Tuent Ton Autorité dans le Couple',
    description: 'Les 7 erreurs masculines les plus fréquentes — et comment les corriger immédiatement.',
    type: 'ebook',
    access: 'free',
    pillarId: 3,
    filename: 'ebook-7-erreurs-couple.pdf',
    pages: '32 pages',
    fileSize: '1.0 MB',
  },
  {
    id: 'ebook-rallumer-feu',
    title: 'Rallumer le Feu — 21 Techniques',
    description: '21 techniques concrètes pour maintenir la passion et le désir dans une relation établie.',
    type: 'ebook',
    access: 'free',
    pillarId: 3,
    filename: 'ebook-rallumer-feu.pdf',
    pages: '38 pages',
    fileSize: '1.4 MB',
  },
  {
    id: 'ebook-decoder-femme',
    title: 'Décoder Sa Femme',
    description: 'Le guide complet de la psychologie féminine pour mieux comprendre et connecter avec ta partenaire.',
    type: 'ebook',
    access: 'free',
    pillarId: 4,
    filename: 'ebook-decoder-femme.pdf',
    pages: '52 pages',
    fileSize: '1.6 MB',
  },
  {
    id: 'ebook-liberer-anxiete',
    title: 'Libérez-Vous de l\'Anxiété',
    description: 'Protocole pratique en 7 étapes pour retrouver ton calme intérieur et maîtriser l\'anxiété.',
    type: 'ebook',
    access: 'free',
    pillarId: 8,
    filename: 'ebook-liberer-anxiete.pdf',
    pages: '48 pages',
    fileSize: '1.8 MB',
  },
];

result.push(...FREE_EBOOKS);
  return result.sort((a, b) => {
    if (a.access !== b.access) return a.access === 'free' ? -1 : 1;
    return (a.pillarId ?? 99) - (b.pillarId ?? 99);
  });
}

export const RESOURCES: Resource[] = buildResources();

export const RESOURCE_TYPES = [
  { key: 'all',      label: 'Tout' },
  { key: 'ebook',    label: '📚 eBooks' },  // ← ajouter en 2ème position
  { key: 'audio',    label: '🎧 Audios' },
  { key: 'pdf',      label: '📄 PDFs' },
  { key: 'template', label: '📋 Templates' },
];

export function getTypeIcon(type: ResourceType): string {
  return { audio:'🎧', pdf:'📄', template:'📋', video:'▶️', ebook:'📚' }[type] ?? '📁';
}

export function getTypeLabel(type: ResourceType): string {
  return { audio:'Audio guidé', pdf:'PDF', template:'Template', video:'Vidéo', ebook:'eBook' }[type] ?? 'Fichier';
}

export function getUnlockedResources(): Resource[] {
  return RESOURCES.filter(r => r.access === 'free');
}

export function getResourceStats() {
  const unlocked = RESOURCES.filter(r => r.access === 'free').length;
  return { unlocked, total: RESOURCES.length };
}