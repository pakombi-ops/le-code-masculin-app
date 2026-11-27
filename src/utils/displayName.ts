/**
 * Prénom affiché dans l'app (« Bonjour, … », profil, checkout).
 *
 * Ordre de lecture :
 *   1. profiles.prenom — source de vérité, remplie aussi par le backend pour un
 *      compte créé par un paiement sur le site (sans inscription dans l'app) ;
 *   2. user_metadata.prenom — posé à l'inscription dans l'app (signUp) ;
 *   3. chaîne vide : l'écran choisit son texte de repli (« Ami », « Utilisateur »).
 *
 * « Utilisateur » est la valeur par défaut d'un profil neuf, pas un vrai prénom :
 * elle est ignorée comme une valeur vide.
 */
const PLACEHOLDER_PRENOM = 'utilisateur';

function cleanPrenom(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.toLowerCase() !== PLACEHOLDER_PRENOM ? trimmed : null;
}

export function resolvePrenom(profilePrenom: unknown, metadataPrenom: unknown): string {
  return cleanPrenom(profilePrenom) ?? cleanPrenom(metadataPrenom) ?? '';
}
