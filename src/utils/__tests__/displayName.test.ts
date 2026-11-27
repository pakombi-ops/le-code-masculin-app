import { resolvePrenom } from '../displayName';

describe('resolvePrenom', () => {
  it('profiles.prenom en priorité', () => {
    expect(resolvePrenom('Tonton', 'Jean')).toBe('Tonton');
  });

  it('espaces retirés', () => {
    expect(resolvePrenom('  Tonton ', null)).toBe('Tonton');
  });

  it('repli sur user_metadata.prenom si le profil est vide, absent ou « Utilisateur »', () => {
    for (const profile of [null, undefined, '', '   ', 'Utilisateur', ' utilisateur ', 42]) {
      expect(resolvePrenom(profile, 'Jean')).toBe('Jean');
    }
  });

  it('chaîne vide si aucune source utilisable (l’écran choisit son repli)', () => {
    expect(resolvePrenom(null, undefined)).toBe('');
    expect(resolvePrenom('Utilisateur', '')).toBe('');
    expect(resolvePrenom('', 'Utilisateur')).toBe('');
  });
});
