import { Platform } from 'react-native';

/**
 * Système typographique de l'app Le Code Masculin
 * iOS → SF Pro (système) | Android → Roboto (système)
 * Pas besoin d'importer de police externe — on utilise les polices natives.
 */

const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto',
    bold: 'Roboto',
  },
  default: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
});

export const Typography = {
  // ── Titres ─────────────────────────────────────────────
  h1: {
    fontFamily: fontFamily!.bold,
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamily!.bold,
    fontSize: 26,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamily!.bold,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: fontFamily!.medium,
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
  },

  // ── Corps ──────────────────────────────────────────────
  bodyLarge: {
    fontFamily: fontFamily!.regular,
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  body: {
    fontFamily: fontFamily!.regular,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 23,
  },
  bodySmall: {
    fontFamily: fontFamily!.regular,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 19,
  },

  // ── Labels ─────────────────────────────────────────────
  label: {
    fontFamily: fontFamily!.medium,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.08,
    textTransform: 'uppercase' as const,
  },
  labelSmall: {
    fontFamily: fontFamily!.medium,
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.1,
    textTransform: 'uppercase' as const,
  },

  // ── Boutons ────────────────────────────────────────────
  button: {
    fontFamily: fontFamily!.bold,
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 22,
    letterSpacing: 0.03,
  },
  buttonSmall: {
    fontFamily: fontFamily!.medium,
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },

  // ── Spéciaux ───────────────────────────────────────────
  caption: {
    fontFamily: fontFamily!.regular,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  quote: {
    fontFamily: fontFamily!.regular,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 26,
    fontStyle: 'italic' as const,
  },
  number: {
    fontFamily: fontFamily!.bold,
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 42,
  },
} as const;
