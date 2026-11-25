import { useState, useEffect } from 'react';
import { XMLParser } from 'fast-xml-parser';

const PODCAST_RSS_URL = 'https://pilierconscient.com/feed/podcast';
const ARTICLES_API_URL = 'https://pilierconscient.com/wp-json/wp/v2/posts?per_page=50&_embed';

export type DiscoverItem = {
  id: string;
  type: 'article' | 'podcast';
  title: string;
  thumbnailUrl?: string;
  duration?: string;
};

function decodeHtmlEntities(text: string): string {
  const namedEntities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&apos;': "'", '&nbsp;': ' ',
    '&rsquo;': "'", '&lsquo;': "'", '&ldquo;': '"', '&rdquo;': '"',
    '&hellip;': '…', '&mdash;': '—', '&ndash;': '–',
    '&eacute;': 'é', '&egrave;': 'è', '&ecirc;': 'ê', '&euml;': 'ë',
    '&agrave;': 'à', '&acirc;': 'â', '&ccedil;': 'ç',
    '&ocirc;': 'ô', '&ugrave;': 'ù', '&ucirc;': 'û', '&icirc;': 'î',
  };
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&\w+;/g, (match) => namedEntities[match] ?? match);
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

function formatItunesDuration(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) {
    const totalSeconds = parseInt(raw, 10);
    return `${Math.round(totalSeconds / 60)} min`;
  }
  const parts = raw.split(':').map(Number);
  if (parts.length === 2) return `${parts[0]} min`;
  if (parts.length === 3) return `${parts[0] * 60 + parts[1]} min`;
  return raw;
}

async function fetchArticlePicks(): Promise<DiscoverItem[]> {
  const response = await fetch(ARTICLES_API_URL);
  const posts: any[] = await response.json();
  return posts.map((post) => ({
    id: `article-${post.id}`,
    type: 'article' as const,
    title: decodeHtmlEntities(stripHtml(post.title?.rendered ?? '')),
    thumbnailUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
  }));
}

async function fetchPodcastPicks(): Promise<DiscoverItem[]> {
  const response = await fetch(PODCAST_RSS_URL);
  const xml = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const data = parser.parse(xml);
  const rawItems = data?.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return items.map((item: any, index: number): DiscoverItem => {
    const rawTitle = item.title;
    const title = decodeHtmlEntities(
      typeof rawTitle === 'string' ? rawTitle : (rawTitle?.['#text'] ?? `Épisode ${index + 1}`)
    );
    const guid = typeof item.guid === 'string' ? item.guid : (item.guid?.['#text'] ?? `${index}`);
    return {
      id: `podcast-${guid}`,
      type: 'podcast' as const,
      title,
      thumbnailUrl: item['itunes:image']?.['@_href'],
      duration: formatItunesDuration(item['itunes:duration']),
    };
  });
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// PRNG déterministe (mulberry32) — seedé sur la date du jour, pas Math.random.
// Même seed = même séquence = même sélection toute la journée.
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  let state = h;
  return () => {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickStableRandom<T>(arr: T[], n: number, seed: string): T[] {
  const rand = seededRandom(seed);
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

export function useDiscoverPicks() {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const seed = todayStr();
    Promise.all([fetchArticlePicks(), fetchPodcastPicks()])
      .then(([articles, episodes]) => {
        setItems([
          ...pickStableRandom(articles, 2, `${seed}-articles`),
          ...pickStableRandom(episodes, 1, `${seed}-podcast`),
        ]);
      })
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { items, isLoading };
}