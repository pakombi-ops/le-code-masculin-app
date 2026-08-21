/**
 * services/lessonVideosService.ts
 * ================================
 * Récupère la map { lessonId: urlLoom } depuis l'endpoint WordPress
 * /wp-json/pc-videos/v1/all, avec cache local pour le offline/fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ENDPOINT = 'https://pilierconscient.com/wp-json/pc-videos/v1/all';
const CACHE_KEY = 'pc_lesson_videos_cache';

export type LessonVideoMap = Record<string, string>;

/**
 * Récupère la map des vidéos. Tente le réseau d'abord, retombe sur le
 * cache local si l'appel échoue (offline, WordPress down, etc.)
 */
export async function fetchLessonVideos(): Promise<LessonVideoMap> {
  try {
    const response = await fetch(ENDPOINT);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: LessonVideoMap = await response.json();
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn('[lessonVideosService] Échec réseau, utilisation du cache local.', error);
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }
}

/**
 * Convertit une URL de partage Loom (loom.com/share/xxx) en URL d'embed
 * (loom.com/embed/xxx) utilisable dans une WebView.
 * Si l'URL ne matche pas le format attendu, la renvoie telle quelle.
 */
export function toLoomEmbedUrl(url: string): string {
  const match = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (!match) return url;
  return `https://www.loom.com/embed/${match[1]}`;
}
