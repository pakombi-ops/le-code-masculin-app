/**
 * SERVICE — passwordChange (src/services/passwordChange.ts)
 * « Changer le mot de passe » (Profil) : le mot de passe ACTUEL est vérifié par
 * une reconnexion (signInWithPassword) avant d'enregistrer le nouveau.
 * Sans cela, quelqu'un qui tient le téléphone déverrouillé pourrait changer le
 * mot de passe, puis supprimer le compte.
 *
 * Le parcours « Mot de passe oublié » (code reçu par email) n'utilise PAS ce
 * service : il reste sur updatePassword (src/services/supabase.ts).
 */
type AuthError = { message?: string; status?: number } | null;

export interface PasswordChangeAuth {
  signInWithPassword: (args: { email: string; password: string }) => Promise<{ data: { session: unknown } | null; error: AuthError }>;
  updateUser: (args: { password: string }) => Promise<{ error: AuthError }>;
}

export const MIN_PASSWORD_LENGTH = 8;

export type PasswordChangeResult =
  | 'changed' | 'missing_current' | 'too_short' | 'mismatch' | 'same'
  | 'wrong_current' | 'rate_limited' | 'no_email' | 'error';

export async function changePassword(
  input: { email: string; currentPassword: string; newPassword: string; confirmPassword: string },
  auth: PasswordChangeAuth
): Promise<PasswordChangeResult> {
  const { email, currentPassword, newPassword, confirmPassword } = input;
  if (!email) return 'no_email';
  if (!currentPassword) return 'missing_current';
  if (newPassword.length < MIN_PASSWORD_LENGTH) return 'too_short';
  if (newPassword !== confirmPassword) return 'mismatch';
  if (newPassword === currentPassword) return 'same';

  // 1. Mot de passe actuel : reconnexion. Rien n'est changé s'il est faux.
  try {
    const { data, error } = await auth.signInWithPassword({ email, password: currentPassword });
    if (error?.status === 429) return 'rate_limited';
    if (error && error.status !== 400) return 'error';
    if (error || !data?.session) return 'wrong_current';
  } catch {
    return 'error';
  }

  // 2. Nouveau mot de passe, sur la session neuve.
  try {
    const { error } = await auth.updateUser({ password: newPassword });
    if (!error) return 'changed';
    return error.status === 429 ? 'rate_limited' : 'error';
  } catch {
    return 'error';
  }
}

export function passwordChangeMessage(result: Exclude<PasswordChangeResult, 'changed'>): string {
  switch (result) {
    case 'missing_current': return 'Saisis ton mot de passe actuel.';
    case 'too_short': return `${MIN_PASSWORD_LENGTH} caractères minimum.`;
    case 'mismatch': return 'Les nouveaux mots de passe ne correspondent pas.';
    case 'same': return "Le nouveau mot de passe doit être différent de l'actuel.";
    case 'wrong_current': return 'Mot de passe actuel incorrect.';
    case 'rate_limited': return 'Trop de tentatives. Attends quelques minutes et réessaie.';
    case 'no_email': return 'Session expirée. Reconnecte-toi.';
    default: return 'Impossible de changer le mot de passe. Réessaie.';
  }
}
