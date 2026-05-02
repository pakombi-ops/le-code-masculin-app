/**
 * PILIER CONSCIENT — Palette de couleurs officielle
 * Utilise toujours ces constantes. Ne jamais hardcoder des hex dans les composants.
 */
export const Colors = {
  // ── Fonds ──────────────────────────────────────────────
  background: {
    primary: '#0D0D1A',    // Fond principal (noir navy profond)
    secondary: '#1A1A2E',  // Cards, headers, onglets
    tertiary: '#242440',   // Éléments légèrement surélevés
  },

  // ── Marque ─────────────────────────────────────────────
  brand: {
    gold: '#C4A35A',        // OR — CTA primaires, accents actifs
    goldLight: '#E8C87A',   // Or clair — hover states, variantes
    goldMuted: '#8A6F3D',   // Or atténué — éléments désactivés or
    navy: '#1A1A2E',        // Navy de marque
    cream: '#F2EDE3',       // Crème — texte principal dark mode
  },

  // ── Texte ──────────────────────────────────────────────
  text: {
    primary: '#F2EDE3',     // Crème — corps de texte principal
    secondary: '#A0A0B8',   // Gris moyen — labels, métadonnées
    muted: '#606078',       // Gris atténué — placeholders, désactivé
    inverse: '#0D0D1A',     // Texte sur fond or (bouton gold)
    gold: '#C4A35A',        // Texte doré (liens, accents)
  },

  // ── Bordures ───────────────────────────────────────────
  border: {
    default: '#2E2E45',     // Bordure standard
    active: '#C4A35A',      // Bordure active (or)
    subtle: '#1E1E35',      // Très subtile (séparateurs)
  },

  // ── États sémantiques ──────────────────────────────────
  status: {
    success: '#4CAF50',     // Vert — complété, succès
    successBg: '#1A3320',   // Fond vert atténué
    warning: '#FF9800',     // Orange — attention
    warningBg: '#2D1F00',   // Fond orange atténué
    error: '#CF6679',       // Rouge doux — erreur
    errorBg: '#2D1018',     // Fond rouge atténué
    info: '#4A9EFF',        // Bleu — information
  },

  // ── Phases du programme ────────────────────────────────
  phase: {
    foundation: '#C4A35A',  // Phase 1 Fondation — Or
    identity: '#7B68EE',    // Phase 2 Identité — Mauve
    impact: '#4A9EFF',      // Phase 3 Impact — Bleu
  },

  // ── Utilitaires ────────────────────────────────────────
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(13, 13, 26, 0.85)',
} as const;

export type ColorKeys = typeof Colors;
