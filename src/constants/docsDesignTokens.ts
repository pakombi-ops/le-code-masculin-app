// src/constants/docsDesignTokens.ts
//
// Tokens extraits du design de référence (Stitch "Modern Archetype").
// Palette volontairement différente du thème Navy/Or existant de l'app
// (#1A1A2E / #C4A35A) — c'est un thème "Deep Dark" dédié à l'onglet Docs.
// Si tu veux unifier avec le reste de l'app, remplace `secondary` par
// ton gold #C4A35A et `background` par ta navy #1A1A2E.

export const docsColors = {
  background: '#131313',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerLow: '#1c1b1b',
  surfaceContainer: '#201f1f',       // fond des cartes
  surfaceContainerHigh: '#2a2a2a',   // bordure des cartes, bg badges neutres
  surfaceContainerHighest: '#353534',

  onSurface: '#e5e2e1',              // texte primaire
  onSurfaceVariant: '#c4c7c8',       // texte secondaire (descriptions, meta)
  outlineVariant: '#444748',         // séparateurs, bordures fines

  primary: '#ffffff',
  onPrimary: '#2f3131',

  secondary: '#e0c38f',              // gold/bronze — badges "EBOOK", accents premium
  onSecondary: '#3f2d06',
  secondaryContainer: '#58441b',
  onSecondaryContainer: '#ceb17f',
} as const;

export const docsTypography = {
  displayLg: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 42, lineHeight: 48 },
  headlineLg: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 32, lineHeight: 40 },
  headlineLgMobile: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 28, lineHeight: 34 },
  titleMd: { fontFamily: 'HankenGrotesk_600SemiBold', fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 16, lineHeight: 26 },
  bodySm: { fontFamily: 'HankenGrotesk_400Regular', fontSize: 14, lineHeight: 20 },
  labelCaps: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2, // ~0.1em
    textTransform: 'uppercase' as const,
  },
} as const;

export const docsSpacing = {
  marginPage: 24,
  gutterGrid: 16,
  stackSm: 8,
  stackMd: 16,
  stackLg: 32,
  sectionGap: 48,
} as const;

export const docsRadius = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Police + couleur + libellé de badge par type de ressource.
// EBOOK garde le badge doré (comme dans la référence) ; les autres
// utilisent le badge neutre gris. Ajuste si tu préfères tout uniformiser.
export const resourceBadgeStyle: Record<
  string,
  { label: string; gold: boolean }
> = {
  ebook: { label: 'EBOOK', gold: true },
  pdf: { label: 'PDF', gold: false },
  template: { label: 'TEMPLATE', gold: false },
  audio: { label: 'AUDIO', gold: false },
  podcast: { label: 'PODCAST', gold: false },
};
