export type PillarPhase = 'fondation' | 'identite' | 'impact';
export type PillarStatus = 'locked' | 'active' | 'completed';

export interface Pillar {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  phase: PillarPhase;
  phaseWeeks: { start: number; end: number };
  totalModules: number;
  icon: string;
  color: string;
}

export const PILLAR_ZERO: Pillar = {
  id: 0,
  slug: 'avant-de-commencer',
  name: 'Avant de Commencer',
  tagline: 'Prépare-toi à entrer dans Le Code.',
  description: "Les bases pour bien démarrer ton parcours dans Le Code Masculin.",
  phase: 'fondation',
  phaseWeeks: { start: 0, end: 0 },
  totalModules: 2,
  icon: 'flag',
  color: '#8A8395',
};
export const PILLARS: Pillar[] = [
  { id: 1, slug: 'force-physique', name: 'Force Physique', tagline: 'Mon corps est mon premier domaine de conqu\u00eate.', description: 'Un homme fort physiquement est un homme fort mentalement.', phase: 'fondation', phaseWeeks: { start: 1, end: 4 }, totalModules: 4, icon: 'barbell', color: '#C4A35A' },
  { id: 2, slug: 'discipline', name: 'Discipline', tagline: 'Fais ce qui doit \u00eatre fait.', description: 'La motivation est temporaire. La discipline est permanente.', phase: 'fondation', phaseWeeks: { start: 5, end: 8 }, totalModules: 4, icon: 'target', color: '#C4A35A' },
  { id: 3, slug: 'leadership', name: 'Leadership', tagline: 'Guide avec sagesse, pas avec autorit\u00e9.', description: 'Le vrai leadership commence par se diriger soi-m\u00eame.', phase: 'identite', phaseWeeks: { start: 19, end: 22 }, totalModules: 4, icon: 'crown', color: '#7B68EE' },
  { id: 4, slug: 'vulnerabilite-strategique', name: 'Vuln\u00e9rabilit\u00e9 Strat\u00e9gique', tagline: 'Ouvre-toi avec discernement.', description: 'La vraie force r\u00e9side dans la vuln\u00e9rabilit\u00e9 choisie.', phase: 'impact', phaseWeeks: { start: 36, end: 39 }, totalModules: 4, icon: 'shield', color: '#4A9EFF' },
  { id: 5, slug: 'but', name: 'But', tagline: 'Vis pour ta mission.', description: 'Un homme sans but est un homme perdu.', phase: 'identite', phaseWeeks: { start: 23, end: 26 }, totalModules: 4, icon: 'compass', color: '#7B68EE' },
  { id: 6, slug: 'honneur', name: 'Honneur', tagline: 'Ma parole est ma loi.', description: "L'honneur est la colonne vert\u00e9brale du caract\u00e8re.", phase: 'identite', phaseWeeks: { start: 27, end: 30 }, totalModules: 4, icon: 'medal', color: '#7B68EE' },
  { id: 7, slug: 'presence', name: 'Pr\u00e9sence', tagline: 'Sois pleinement ici.', description: 'La pr\u00e9sence totale est le cadeau le plus rare.', phase: 'fondation', phaseWeeks: { start: 9, end: 13 }, totalModules: 5, icon: 'eye', color: '#C4A35A' },
  { id: 8, slug: 'stoicisme', name: 'Sto\u00efcisme', tagline: 'Ma\u00eetrise tes \u00e9motions.', description: 'Tu contr\u00f4les comment tu r\u00e9ponds, pas ce qui arrive.', phase: 'fondation', phaseWeeks: { start: 14, end: 17 }, totalModules: 4, icon: 'anchor', color: '#C4A35A' },
  { id: 9, slug: 'generosite', name: 'G\u00e9n\u00e9rosit\u00e9', tagline: 'Donne librement.', description: 'La vraie g\u00e9n\u00e9rosit\u00e9 vient de l\'abondance int\u00e9rieure.', phase: 'impact', phaseWeeks: { start: 40, end: 43 }, totalModules: 4, icon: 'hand-heart', color: '#4A9EFF' },
  { id: 10, slug: 'courage', name: 'Courage', tagline: 'Agis malgr\u00e9 la peur.', description: 'Le courage est l\'action en d\u00e9pit de la peur.', phase: 'impact', phaseWeeks: { start: 44, end: 47 }, totalModules: 4, icon: 'lightning', color: '#4A9EFF' },
  { id: 11, slug: 'authenticite', name: 'Authenticit\u00e9', tagline: 'Sois, ne para\u00efs pas.', description: "L'authenticit\u00e9 est le refus du masque social.", phase: 'identite', phaseWeeks: { start: 31, end: 34 }, totalModules: 4, icon: 'fingerprint', color: '#7B68EE' },
  { id: 12, slug: 'heritage', name: 'H\u00e9ritage', tagline: 'Construis ce qui dure.', description: 'Quelle trace veux-tu laisser ?', phase: 'impact', phaseWeeks: { start: 48, end: 52 }, totalModules: 5, icon: 'tree', color: '#4A9EFF' },
];

export const PHASES = {
  fondation: { label: 'FONDATION', subtitle: 'Semaines 1-17', color: '#C4A35A', pillars: [1, 2, 7, 8] },
  identite: { label: 'IDENTIT\u00c9', subtitle: 'Semaines 18-34', color: '#7B68EE', pillars: [3, 5, 6, 11] },
  impact: { label: 'IMPACT', subtitle: 'Semaines 35-52', color: '#4A9EFF', pillars: [4, 9, 10, 12] },
} as const;

export const getPillarById = (id: number) => (id === 0 ? PILLAR_ZERO : PILLARS.find((p) => p.id === id));
export const getPillarsByPhase = (phase: PillarPhase) => PILLARS.filter((p) => p.phase === phase);
