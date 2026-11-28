/**
 * TEXTES DES CONSENTEMENTS (journal + pacte, coach)
 *
 * ⚠ TEXTES PROVISOIRES : à remplacer par les deux blocs validés par Prince
 * AVANT toute mise en production. Changer un texte = changer sa `version`
 * (la version est enregistrée avec chaque accord, table user_consents).
 *
 * Ne pas ajouter de phrase sur l'entraînement des modèles tant qu'elle n'est
 * pas vérifiée.
 */
export type ConsentPurpose = 'journal' | 'coach';

export type ConsentText = {
  version: string;
  title: string;
  intro: string;
  points: string[];
  checkbox: string;
};

export const CONSENT_TEXTS_PROVISIONAL = true;

export const CONSENT_TEXTS: Record<ConsentPurpose, ConsentText> = {
  journal: {
    version: 'journal-v1',
    title: 'Ton journal et ton pacte restent à toi',
    intro:
      'Ce que tu écris dans ton journal et dans ton pacte peut révéler des informations sur ta santé, ' +
      'physique ou mentale : sommeil, stress, humeur, addictions, vie intime… Ce sont des données sensibles. ' +
      'Nous avons besoin de ton accord explicite pour les enregistrer.',
    points: [
      "Ton journal et ton pacte sont enregistrés chez notre hébergeur, Supabase, et ne servent qu'à te rendre ce service.",
      'Nous ne vendons pas tes données et ne les utilisons pas pour de la publicité.',
      'Tu peux retirer ton accord à tout moment : Profil › Mes données › Mes consentements.',
    ],
    checkbox:
      "J'accepte que mon journal et mon pacte, qui peuvent contenir des informations sur ma santé, " +
      'soient enregistrés pour me fournir ce service.',
  },
  coach: {
    version: 'coach-v1',
    title: 'Ce que tu confies au coach',
    intro:
      'Ce que tu confies au coach peut révéler des informations sur ta santé, physique ou mentale : ' +
      'sommeil, stress, humeur, addictions, vie intime… Ce sont des données sensibles. ' +
      'Nous avons besoin de ton accord explicite pour les traiter.',
    points: [
      "Pour te répondre, tes messages sont envoyés à nos prestataires d'intelligence artificielle, aux États-Unis : " +
        'Anthropic (réponses du coach) et Voyage AI (recherche dans les contenus du Code Masculin).',
      'Nous ne vendons pas tes données et ne les utilisons pas pour de la publicité.',
      'Tu peux retirer ton accord à tout moment : Profil › Mes données › Mes consentements.',
    ],
    checkbox:
      "J'accepte que mes messages au coach, qui peuvent contenir des informations sur ma santé, " +
      'soient traités par Anthropic et Voyage AI pour me répondre.',
  },
};

/** Libellés de l'écran « Mes consentements ». */
export const CONSENT_LABELS: Record<ConsentPurpose, string> = {
  journal: 'Journal et pacte',
  coach: 'Coach',
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
