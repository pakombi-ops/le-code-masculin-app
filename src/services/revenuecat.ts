import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
  type CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useAuthStore } from '../store/authStore';

// ── Clés RevenueCat ───────────────────────────────────────────────────────────
// Remplace par tes vraies clés depuis RevenueCat Dashboard → App Settings
const RC_ANDROID_KEY = 'goog_REMPLACE_PAR_TA_CLE';
const RC_IOS_KEY = 'appl_REMPLACE_PAR_TA_CLE';

const ENTITLEMENT_ID = 'premium';

/**
 * Initialise RevenueCat au démarrage de l'app
 */
export async function initRevenueCat(userId?: string) {
  try {
    Purchases.setLogLevel(LOG_LEVEL.WARN);

    const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
    await Purchases.configure({ apiKey });

    // Identifier l'utilisateur si connecté
    if (userId) {
      await Purchases.logIn(userId);
    }

    console.log('✅ RevenueCat initialisé');
  } catch (err) {
    console.error('❌ Erreur RevenueCat init:', err);
  }
}

/**
 * Récupère les packages disponibles (mensuel, annuel)
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (err) {
    console.error('Erreur getOfferings:', err);
    return [];
  }
}

/**
 * Lance l'achat d'un package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<{
  success: boolean;
  isPremium: boolean;
  error?: string;
}> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    if (isPremium) {
      await activatePremium();
    }

    return { success: true, isPremium };
  } catch (err: any) {
    if (err.userCancelled) {
      return { success: false, isPremium: false, error: 'Achat annulé.' };
    }
    return { success: false, isPremium: false, error: err.message };
  }
}

/**
 * Restaurer les achats (obligatoire sur iOS)
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    if (isPremium) {
      await activatePremium();
    }
    return isPremium;
  } catch (err) {
    console.error('Erreur restore:', err);
    return false;
  }
}

/**
 * Vérifie si l'utilisateur est Premium
 */
export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (err) {
    return false;
  }
}

/**
 * Active le Premium dans Supabase + store local
 */
async function activatePremium() {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;

  // Mettre à jour Supabase
  await supabase
    .from('ai_quota')
    .update({ is_premium: true })
    .eq('user_id', userId);

  // Mettre à jour le store local immédiatement
  const currentQuota = useAuthStore.getState().aiQuota;
  if (currentQuota) {
    useAuthStore.setState({
      aiQuota: { ...currentQuota, is_premium: true },
    });
  }

  console.log('✅ Premium activé');
}
