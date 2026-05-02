/**
 * Ressources de la Bibliothèque — Le Code Masculin
 * PDFs, Audios, Ebooks par pilier
 */

export type ResourceType = 'pdf' | 'audio' | 'ebook' | 'template';
export type ResourceAccess = 'free' | 'premium';

export interface Resource {
  id: string;
  pillarId: number | null;  // null = général
  type: ResourceType;
  title: string;
  description: string;
  duration?: string;        // pour les audios
  pages?: number;           // pour les PDFs/ebooks
  access: ResourceAccess;
  isDownloaded?: boolean;
  fileSize?: string;
}

export const RESOURCES: Resource[] = [
  // ── PDFs gratuits ──────────────────────────────────────────────────────────
  {
    id: 'pdf-p2-guide',
    pillarId: 2, type: 'pdf',
    title: 'Guide Discipline Extrême',
    description: 'Le protocole complet pour construire une discipline à toute épreuve en 30 jours.',
    pages: 24, access: 'free', isDownloaded: true, fileSize: '1.2 Mo',
  },
  {
    id: 'pdf-tracker',
    pillarId: null, type: 'template',
    title: 'Tracker 90 Jours',
    description: 'Le tableau de suivi de tes 12 piliers sur 90 jours. Imprimable ou digital.',
    pages: 8, access: 'free', isDownloaded: false, fileSize: '0.8 Mo',
  },
  {
    id: 'pdf-p1-guide',
    pillarId: 1, type: 'pdf',
    title: 'Standards Physiques Non-Négociables',
    description: 'Tes standards minimums physiques et le plan des 4 piliers de la force.',
    pages: 18, access: 'free', isDownloaded: false, fileSize: '0.9 Mo',
  },

  // ── Audios guidés ──────────────────────────────────────────────────────────
  {
    id: 'audio-p1-med',
    pillarId: 1, type: 'audio',
    title: 'Méditation Force Intérieure',
    description: 'Audio guidé pour ancrer la force physique dans ton identité. Idéal avant l\'entraînement.',
    duration: '12 min', access: 'free', isDownloaded: false, fileSize: '11 Mo',
  },
  {
    id: 'audio-p2-prog',
    pillarId: 2, type: 'audio',
    title: 'Reprogrammation Auto-Discipline',
    description: 'Visualisation guidée pour installer la discipline comme réflexe identitaire.',
    duration: '18 min', access: 'premium', isDownloaded: false, fileSize: '16 Mo',
  },
  {
    id: 'audio-p7-presence',
    pillarId: 7, type: 'audio',
    title: 'Méditation Présence Totale',
    description: 'Entraîne ton cerveau à être pleinement ici, maintenant.',
    duration: '15 min', access: 'premium', isDownloaded: false, fileSize: '14 Mo',
  },
  {
    id: 'audio-p8-stoic',
    pillarId: 8, type: 'audio',
    title: 'Maîtrise Émotionnelle',
    description: 'Protocole audio pour développer la réponse stoïque face aux situations difficiles.',
    duration: '20 min', access: 'premium', isDownloaded: false, fileSize: '18 Mo',
  },

  // ── Ebooks premium ─────────────────────────────────────────────────────────
  {
    id: 'ebook-transmission',
    pillarId: 12, type: 'ebook',
    title: 'Guide de Transmission',
    description: 'Le manuel pour devenir un homme-pilier et transmettre le Code à ceux qui t\'entourent. Valorisé à 97€.',
    pages: 87, access: 'premium', isDownloaded: false, fileSize: '3.4 Mo',
  },
  {
    id: 'ebook-energie',
    pillarId: 1, type: 'ebook',
    title: 'Ravivez Votre Énergie Vitale',
    description: 'Protocoles avancés pour optimiser ton énergie physique et mentale au quotidien.',
    pages: 52, access: 'premium', isDownloaded: false, fileSize: '2.1 Mo',
  },
  {
    id: 'ebook-couple',
    pillarId: 3, type: 'ebook',
    title: 'Leadership dans le Couple',
    description: 'Comprendre et incarner le leadership bienveillant dans ta relation de couple.',
    pages: 64, access: 'premium', isDownloaded: false, fileSize: '2.8 Mo',
  },
  {
    id: 'ebook-anxiete',
    pillarId: 8, type: 'ebook',
    title: 'Libérez-vous de l\'Anxiété',
    description: 'Protocoles stoïciens et techniques concrètes pour maîtriser l\'anxiété masculine.',
    pages: 48, access: 'premium', isDownloaded: false, fileSize: '1.9 Mo',
  },

  // ── PDFs premium ───────────────────────────────────────────────────────────
  {
    id: 'pdf-p3-leader',
    pillarId: 3, type: 'pdf',
    title: 'Les 7 Décisions du Leader',
    description: 'Guide pratique sur les décisions quotidiennes qui construisent l\'autorité naturelle.',
    pages: 32, access: 'premium', isDownloaded: false, fileSize: '1.5 Mo',
  },
  {
    id: 'pdf-p10-courage',
    pillarId: 10, type: 'pdf',
    title: 'Les 4 Domaines du Courage Masculin',
    description: 'Applications concrètes du courage dans le couple, le travail, le social et l\'intime.',
    pages: 28, access: 'premium', isDownloaded: false, fileSize: '1.3 Mo',
  },
];

export const RESOURCE_TYPES: { key: ResourceType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'pdf', label: 'PDFs' },
  { key: 'audio', label: 'Audios' },
  { key: 'ebook', label: 'Ebooks' },
  { key: 'template', label: 'Templates' },
];

export function getResourcesByFilter(
  type: ResourceType | 'all',
  isPremium: boolean
): Resource[] {
  return RESOURCES.filter(r => {
    if (type !== 'all' && r.type !== type) return false;
    return true;
  });
}

export function getTypeIcon(type: ResourceType): string {
  const icons: Record<ResourceType, string> = {
    pdf: '📄',
    audio: '🎧',
    ebook: '📖',
    template: '📋',
  };
  return icons[type];
}

export function getTypeLabel(type: ResourceType): string {
  const labels: Record<ResourceType, string> = {
    pdf: 'PDF',
    audio: 'Audio',
    ebook: 'Ebook',
    template: 'Template',
  };
  return labels[type];
}
