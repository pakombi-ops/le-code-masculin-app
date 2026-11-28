import { Alert } from 'react-native';

/** Accord non enregistré (réseau, serveur) : la fonction reste fermée. */
export function showConsentError() {
  Alert.alert('Accord non enregistré', "Ton accord n'a pas pu être enregistré. Vérifie ta connexion et réessaie.");
}
