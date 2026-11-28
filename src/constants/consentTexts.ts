/**
 * TEXTES DES CONSENTEMENTS (journal + pacte, coach) — textes définitifs validés le 2026-11-28.
 *
 * Changer un texte = changer sa `version` (la version est enregistrée avec
 * chaque accord, table user_consents).
 *
 * Ne pas ajouter de phrase sur l'entraînement des modèles (décision du 2026-11-28 ;
 * contrôlé par src/services/__tests__/consents.test.ts).
 */
export type ConsentPurpose = 'journal' | 'coach';

export type ConsentText = {
  version: string;
  title: string;
  intro: string;
  points: string[];
  checkbox: string;
};

export const CONSENT_TEXTS: Record<ConsentPurpose, ConsentText> = {
  // Première ouverture du journal ou du pacte.
  journal: {
    version: 'journal-v1',
    title: 'Ton journal reste à toi.',
    intro:
      'Ce que tu y écris peut révéler des informations sur ta santé, physique ou mentale. ' +
      "Nous avons besoin de ton accord explicite pour l'enregistrer.",
    points: [
      "Il est stocké chez notre hébergeur, Supabase (Union européenne), et ne sert qu'à te rendre ce service.",
      "L'équipe ne le consulte jamais, sauf si tu le demandes pour une assistance.",
      'Tu peux retirer ton accord à tout moment : Profil › Mes données › Consentements.',
    ],
    checkbox:
      "J'accepte que mon journal et mon pacte, qui peuvent contenir des informations sur ma santé, " +
      'soient enregistrés pour me fournir ce service.',
  },
  // Premier message envoyé au coach (l'écran du coach s'ouvre normalement).
  coach: {
    version: 'coach-v1',
    title: 'Avant de parler au coach.',
    intro:
      'Ce que tu lui confies peut révéler des informations sur ta santé. Pour te répondre, tes messages ' +
      "sont envoyés à deux prestataires d'intelligence artificielle aux États-Unis : Anthropic (rédaction " +
      'des réponses) et Voyage AI (recherche dans le programme).',
    points: [
      "Ils ne servent qu'à te répondre.",
      'Tes conversations sont conservées dans ton compte, et tu peux les supprimer.',
      'Le coach ne remplace pas un professionnel de santé. En cas de détresse, appelle le 3114 (France) ou le 988 (Canada).',
    ],
    checkbox:
      "J'accepte que mes messages au coach, qui peuvent contenir des informations sur ma santé, " +
      'soient envoyés à ces prestataires et conservés pour me fournir ce service.',
  },
};

/** Libellés de l'écran « Consentements ». */
export const CONSENT_LABELS: Record<ConsentPurpose, string> = {
  journal: 'Journal et pacte',
  coach: 'Coach',
};

export const DELETE_CONVERSATIONS_TEXT = {
  button: 'Supprimer mes conversations',
  title: 'Supprimer mes conversations ?',
  message: 'Tous tes échanges avec le coach seront effacés définitivement. Ton accord reste en place : tu peux continuer à parler au coach.',
  confirm: 'Supprimer',
  cancel: 'Annuler',
  done: 'Tes conversations avec le coach ont été supprimées.',
};

export const WITHDRAW_TEXT = {
  title: 'Retirer mon accord ?',
  message: (purpose: ConsentPurpose) =>
    purpose === 'journal'
      ? "Le journal et le pacte seront bloqués jusqu'à ce que tu donnes à nouveau ton accord. Ce que tu as déjà écrit :"
      : "Le coach sera bloqué jusqu'à ce que tu donnes à nouveau ton accord. Ce que tu as déjà écrit :",
  keep: 'Garder mes entrées',
  erase: 'Tout supprimer',
  cancel: 'Annuler',
};
