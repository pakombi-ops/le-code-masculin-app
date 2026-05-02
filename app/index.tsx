import { Redirect } from 'expo-router';

/**
 * Point d'entrée — redirige vers le splash.
 * Le splash vérifie la session et route vers auth ou tabs.
 */
export default function Index() {
  return <Redirect href="/(auth)/splash" />;
}
