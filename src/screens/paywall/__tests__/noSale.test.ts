/**
 * Paywall sans vente : aucun écran accessible de l'app ne démarre un paiement
 * ni n'affiche de prix. Les fichiers anciens non montés par expo-router
 * (src/navigation, src/screens/main) sont exclus.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..', '..');
const EXCLUDED = [
  path.join('src', 'navigation'),
  path.join('src', 'screens', 'main'),
  path.join('src', 'services', 'appCheckout.ts'),
];

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e: any) => {
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full);
    if (e.name === '__tests__' || EXCLUDED.some((x) => rel === x || rel.startsWith(x + path.sep))) return [];
    if (e.isDirectory()) return sources(full);
    return /\.(ts|tsx)$/.test(e.name) ? [full] : [];
  });
}

const files = [...sources(path.join(ROOT, 'app')), ...sources(path.join(ROOT, 'src'))];
const read = (f: string) => fs.readFileSync(f, 'utf8');

describe('paywall sans vente', () => {
  it("aucun écran n'importe le checkout Stripe de l'app", () => {
    const offenders = files.filter((f) => /startAppCheckout|services\/appCheckout|app-checkout/.test(read(f)));
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it("le paywall n'ouvre ni navigateur ni lien externe", () => {
    const paywall = read(path.join(ROOT, 'src', 'screens', 'paywall', 'PaywallScreen.tsx'));
    expect(paywall).not.toMatch(/openAuthSessionAsync|openBrowserAsync|Linking\.openURL|https?:\/\//);
  });

  it("aucun prix sur les écrans qui mènent au paywall", () => {
    const screens = [
      ['src', 'screens', 'paywall', 'PaywallScreen.tsx'],
      ['src', 'screens', 'profil', 'ProfilScreen.tsx'],
      ['src', 'screens', 'programme', 'ProgrammeScreen.tsx'],
      ['app', 'feature-info', '[featureId].tsx'],
    ];
    for (const parts of screens) {
      expect({ file: parts.join('/'), price: /\d\s?€|€\s?\d|\/mois|\/an\b|essai gratuit/i.test(read(path.join(ROOT, ...parts))) })
        .toEqual({ file: parts.join('/'), price: false });
    }
  });
});
