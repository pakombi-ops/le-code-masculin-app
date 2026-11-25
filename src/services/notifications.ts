import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const PREFS_KEY = 'notification_prefs_v1';
const LAST_SEEN_EPISODE_KEY = 'notification_last_seen_episode';
const SESSION_NOTIF_ID_KEY = 'notification_id_session';
const STREAK_NOTIF_ID_KEY = 'notification_id_streak';
const CITATION_NOTIF_ID_KEY = 'notification_id_citation';
const REACTIVATION_J3_ID_KEY = 'notification_id_reactivation_j3';
const REACTIVATION_J7_ID_KEY = 'notification_id_reactivation_j7';

const PODCAST_RSS_URL = 'https://pilierconscient.com/feed/podcast';

export interface NotificationPrefs {
  session: boolean;
  streak: boolean;
  citation: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = { session: true, streak: true, citation: true };

const QUOTES = [
  "La discipline est le pont entre les objectifs et les résultats.",
  "Un homme sans but est un homme perdu.",
  "Le courage n'est pas l'absence de peur, c'est agir malgré elle.",
  "Ta parole est ta loi.",
  "La vraie force réside dans la vulnérabilité choisie.",
  "Ce que tu tolères, tu l'enseignes.",
  "Sois pleinement ici — c'est le cadeau le plus rare.",
  "La motivation est temporaire. La discipline est permanente.",
  "Quelle trace veux-tu laisser ?",
];

// Affichage en foreground — sans ça, une notif reçue app ouverte ne s'affiche jamais.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// PRÉFÉRENCES — persistées localement (AsyncStorage), pas en base Supabase
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

async function savePrefs(prefs: NotificationPrefs) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS & CHANNEL ANDROID
// ─────────────────────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Obligatoire sur Android 8+ — sans channel, les notifications sont
// silencieusement ignorées, sans erreur visible nulle part.
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Le Code Masculin',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C4A35A',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRE — prochaine occurrence d'une heure donnée
// Si l'heure est déjà passée aujourd'hui, notifie quasi immédiatement plutôt
// que d'attendre demain — un rappel en retard reste plus utile qu'aucun rappel.
// ─────────────────────────────────────────────────────────────────────────────

function nextTimeAt(hour: number, minute: number) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) {
    return {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    } as const;
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: target,
  } as const;
}

async function cancelScheduled(storageKey: string) {
  const id = await AsyncStorage.getItem(storageKey);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    await AsyncStorage.removeItem(storageKey);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BASCULE D'UNE PRÉFÉRENCE — appelé depuis ProfilScreen quand l'homme
// active/désactive un des 3 switches
// ─────────────────────────────────────────────────────────────────────────────

export async function setNotificationPref(
  key: keyof NotificationPrefs,
  value: boolean
): Promise<NotificationPrefs> {
  const prefs = await getNotificationPrefs();
  prefs[key] = value;
  await savePrefs(prefs);

  if (value) {
    const granted = await requestNotificationPermission();
    if (!granted) {
      // Permission refusée par l'OS — on ne peut pas activer, on revient à false
      prefs[key] = false;
      await savePrefs(prefs);
      return prefs;
    }
    await setupNotificationChannel();
    if (key === 'citation') await scheduleWeeklyCitation();
    // 'session' (podcast) et 'streak' sont recalculés dynamiquement au prochain
    // appel de checkForNewPodcastEpisode() / refreshStreakAlert(), pas ici.
  } else {
    if (key === 'citation') await cancelScheduled(CITATION_NOTIF_ID_KEY);
    if (key === 'session') await cancelScheduled(SESSION_NOTIF_ID_KEY);
    if (key === 'streak') await cancelScheduled(STREAK_NOTIF_ID_KEY);
  }

  return prefs;
}

// ─────────────────────────────────────────────────────────────────────────────
// CITATION HEBDOMADAIRE — dimanche 18h00, répétée chaque semaine
// ─────────────────────────────────────────────────────────────────────────────

export async function scheduleWeeklyCitation() {
  await cancelScheduled(CITATION_NOTIF_ID_KEY);

  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Citation de la semaine',
      body: quote,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // 1 = dimanche (convention Expo : 1-7, dimanche=1)
      hour: 18,
      minute: 0,
      repeats: true,
    },
  });

  await AsyncStorage.setItem(CITATION_NOTIF_ID_KEY, id);
}

// ─────────────────────────────────────────────────────────────────────────────
// NOUVEAU CONTENU — vérifie le flux podcast, notifie si nouvel épisode
// ─────────────────────────────────────────────────────────────────────────────

export async function checkForNewPodcastEpisode(): Promise<void> {
  const prefs = await getNotificationPrefs();
  if (!prefs.session) return;

  try {
    const response = await fetch(PODCAST_RSS_URL);
    const xml = await response.text();

    // Extraction légère du premier épisode — suffisant ici, on ne compare
    // que le dernier épisode connu, pas besoin d'un parseur XML complet.
    const guidMatch = xml.match(/<item>[\s\S]*?<guid[^>]*>([\s\S]*?)<\/guid>/);
    const titleMatch = xml.match(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>/);
    const latestGuid = guidMatch?.[1]?.trim();
    const rawTitle = titleMatch?.[1]?.trim() ?? '';
    const latestTitle = rawTitle
      .replace(/<!\[CDATA\[(.*?)\]\]>/, '$1')
      .replace(/&#039;|&#39;|&apos;/g, "'")
      .trim();

    if (!latestGuid) return;

    const lastSeen = await AsyncStorage.getItem(LAST_SEEN_EPISODE_KEY);
    if (lastSeen === latestGuid) return; // déjà connu, rien à faire

    const isFirstCheck = lastSeen === null;
    await AsyncStorage.setItem(LAST_SEEN_EPISODE_KEY, latestGuid);

    // Ne pas notifier au tout premier lancement — sinon chaque nouvel inscrit
    // reçoit une notif pour un épisode qui existe peut-être depuis des mois.
    if (isFirstCheck) return;

    await cancelScheduled(SESSION_NOTIF_ID_KEY);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nouvel épisode disponible',
        body: latestTitle || 'Un nouvel épisode du podcast Pilier Conscient vient de sortir.',
        sound: true,
      },
      trigger: nextTimeAt(18, 0),
    });
    await AsyncStorage.setItem(SESSION_NOTIF_ID_KEY, id);
  } catch {
    // Échec silencieux — un problème réseau ici ne doit jamais bloquer le reste de l'app
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STREAK EN DANGER — ce soir 20h00, uniquement si pas encore actif aujourd'hui
// ─────────────────────────────────────────────────────────────────────────────

export async function refreshStreakAlert(
  streak: { current_streak: number; last_activity_date: string } | null
): Promise<void> {
  const prefs = await getNotificationPrefs();
  await cancelScheduled(STREAK_NOTIF_ID_KEY);

  if (!prefs.streak || !streak || streak.current_streak <= 0) return;

  const today = new Date().toISOString().split('T')[0];
  const activeToday = streak.last_activity_date === today;
  if (activeToday) return; // streak déjà sécurisé aujourd'hui, rien à faire

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ton streak est en danger',
      body: `${streak.current_streak} jour${streak.current_streak > 1 ? 's' : ''} de suite — ne le laisse pas s'éteindre ce soir.`,
      sound: true,
    },
    trigger: nextTimeAt(20, 0),
  });

  await AsyncStorage.setItem(STREAK_NOTIF_ID_KEY, id);
}

// ─────────────────────────────────────────────────────────────────────────────
// RÉACTIVATION APRÈS SILENCE PROLONGÉ
// Appelée à chaque ouverture de session (loadUser). Reprogramme deux rappels
// futurs (J+3, J+7) à chaque fois — donc pour un homme actif régulièrement,
// ces notifications sont sans cesse repoussées et ne se déclenchent jamais.
// Si l'homme cesse d'ouvrir l'app, le dernier rappel programmé lors de sa
// dernière visite se déclenche normalement, faute d'avoir été repoussé.
// Indépendant des 3 préférences existantes — n'est désactivé que si la
// permission notifications n'a jamais été accordée.
// ─────────────────────────────────────────────────────────────────────────────

export async function scheduleReactivationReminders(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  await cancelScheduled(REACTIVATION_J3_ID_KEY);
  await cancelScheduled(REACTIVATION_J7_ID_KEY);

  if (status !== 'granted') return; // ne jamais redemander la permission ici

  const in3Days = new Date();
  in3Days.setDate(in3Days.getDate() + 3);
  in3Days.setHours(18, 0, 0, 0);

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  in7Days.setHours(18, 0, 0, 0);

  const id3 = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ça fait quelques jours',
      body: "On ne t'a pas revu depuis un moment. Ton Code t'attend, même 10 minutes suffisent pour reprendre le fil.",
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: in3Days },
  });
  await AsyncStorage.setItem(REACTIVATION_J3_ID_KEY, id3);

  const id7 = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Une semaine de silence',
      body: 'Le silence peut devenir une habitude. Reviens — pas pour rattraper, juste pour reprendre.',
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: in7Days },
  });
  await AsyncStorage.setItem(REACTIVATION_J7_ID_KEY, id7);
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISATION — à appeler une fois au démarrage de l'app (session active)
// ─────────────────────────────────────────────────────────────────────────────

export async function initNotifications(): Promise<NotificationPrefs> {
  await setupNotificationChannel();
  const prefs = await getNotificationPrefs();

  if (prefs.citation) {
    const existing = await AsyncStorage.getItem(CITATION_NOTIF_ID_KEY);
    if (!existing) await scheduleWeeklyCitation();
  }
  if (prefs.session) {
    await checkForNewPodcastEpisode();
  }

  await scheduleReactivationReminders();

  return prefs;
}
