import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  TouchableOpacity, Alert, Dimensions, Share,
  Modal, SafeAreaView, ActivityIndicator, Image,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { WebView } from 'react-native-webview';
import { XMLParser } from 'fast-xml-parser';
import {
  X, Lock, Crown, Clock, FileText, HardDrive,
  Play, Pause, BookOpen, Download, Headphones, Mic,
  ClipboardList, PlayCircle, CheckCircle2, Search, Newspaper,
  Share2, Camera,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { SafeScreen } from '../../components/layout/SafeScreen';
import {
  RESOURCES, RESOURCE_TYPES, getTypeIcon, getTypeLabel,
  type Resource, type ResourceType,
} from '../../constants/resources';
import { getPillarById } from '../../constants/pillars';
import { useAuthStore } from '../../store/authStore';
import { getCompletedLessonIds, isPdfUnlockedByWeek, isAudioUnlockedByPillar } from '../../constants/progression';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = 'https://pilierconscient.com/wp-json/pc-bib/v1/resources';
const PODCAST_RSS_URL = 'https://pilierconscient.com/feed/podcast';
// API REST native de WordPress — pas besoin de plugin custom, ?_embed
// permet de récupérer l'image mise en avant en un seul appel.
const ARTICLES_API_URL = 'https://pilierconscient.com/wp-json/wp/v2/posts?per_page=50&_embed';
const { width } = Dimensions.get('window');

// Hauteur de la barre de filtres fixe en haut de l'écran
const FILTERS_BAR_HEIGHT = 68;
// Distance de scroll sur laquelle le fond de la barre passe de transparent à teinté
const BACKDROP_FADE_DISTANCE = 60;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// Étend Resource avec les champs ajoutés par l'API
// ─────────────────────────────────────────────────────────────────────────────

interface ResourceWithUrl extends Resource {
  url?: string;
  weekNumber?: number;
  thumbnailUrl?: string;
  // Contenu HTML brut de l'article, utilisé pour construire les écrans du
  // lecteur "story" plutôt que de recharger la page web
  articleContent?: string;
}

// Forme brute retournée par wp-json/pc-bib/v1/resources
interface ApiAudio {
  pilier: number;
  phase: string;
  nom: string;
  duree: string;
  theme: string;
  url: string;
  thumbnail_url?: string;
  disponible: boolean;
}
interface ApiPdf {
  module: number;
  titre: string;
  phase: string;
  phase_nom: string;
  pilier: number | null;
  pilier_nom: string;
  url: string;
  thumbnail_url?: string;
  disponible: boolean;
}
interface ApiTemplate {
  slug: string;
  titre: string;
  description: string;
  categorie: string;
  url: string;
  thumbnail_url?: string;
  disponible: boolean;
}
interface ApiEbook {
  slug: string;
  titre: string;
  description: string;
  url: string;
  thumbnail_url?: string;
  disponible: boolean;
}

interface ApiResponse {
  audios: ApiAudio[];
  pdfs: ApiPdf[];
  templates: ApiTemplate[];
  ebooks: ApiEbook[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP AUDIO SESSION — appeler au démarrage depuis App.tsx
// ─────────────────────────────────────────────────────────────────────────────

export async function setupPlayer() {
  // expo-audio gère automatiquement la session audio
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPPING API → ResourceWithUrl[]
// L'API WordPress est la source unique de vérité.
// Ce qui est configuré dans wp-admin = ce qui s'affiche dans l'app.
// ─────────────────────────────────────────────────────────────────────────────

function mapApiToResources(api: ApiResponse): ResourceWithUrl[] {
  const audios: ResourceWithUrl[] = api.audios.map(a => ({
    id:           `audio-${a.pilier}`,
    title:        a.nom,
    description:  a.theme,
    type:         'audio' as ResourceType,
    access:       'premium' as const,
    pillarId:     a.pilier,
    duration:     a.duree,
    url:          a.url ?? '',
    thumbnailUrl: a.thumbnail_url || undefined,
    isDownloaded: false,
  }));

  const pdfs: ResourceWithUrl[] = api.pdfs
    .filter(p => p.disponible)           // n'afficher que les modules avec un PDF
    .map(p => ({
      id:           `pdf-${p.module}`,
      title:        p.titre,
      description:  `${p.phase_nom}${p.pilier_nom ? ' · ' + p.pilier_nom : ''}`,
      type:         'pdf' as ResourceType,
      access:       'premium' as const,
      pillarId:     p.pilier ?? undefined,
      weekNumber:   p.module,
      url:          p.url ?? '',
      thumbnailUrl: p.thumbnail_url || undefined,
      isDownloaded: false,
    }));

  const ebooks: ResourceWithUrl[] = (api.ebooks ?? []).map(e => ({
    id:           `ebook-${e.slug}`,
    title:        e.titre,
    description:  e.description,
    type:         'ebook' as ResourceType,
    access:       'free' as const,
    url:          e.url ?? '',
    thumbnailUrl: e.thumbnail_url || undefined,
    isDownloaded: false,
  }));

  const templates: ResourceWithUrl[] = api.templates.map(t => ({
    id:           `tpl-${t.slug}`,
    title:        t.titre,
    description:  t.description,
    type:         'template' as ResourceType,
    access:       'premium' as const,
    url:          t.url ?? '',
    thumbnailUrl: t.thumbnail_url || undefined,
    isDownloaded: false,
  }));

  return [...audios, ...ebooks, ...pdfs, ...templates];
}

// ─────────────────────────────────────────────────────────────────────────────
// PODCAST — lecture directe du flux RSS
// ─────────────────────────────────────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  const namedEntities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&apos;': "'", '&nbsp;': ' ',
    // Apostrophes et guillemets typographiques (Gutenberg les utilise en nommé ET en numérique)
    '&rsquo;': "'", '&lsquo;': "'", '&ldquo;': '"', '&rdquo;': '"',
    '&hellip;': '…', '&mdash;': '—', '&ndash;': '–',
    '&eacute;': 'é', '&egrave;': 'è', '&ecirc;': 'ê', '&euml;': 'ë',
    '&agrave;': 'à', '&acirc;': 'â', '&ccedil;': 'ç',
    '&ocirc;': 'ô', '&ugrave;': 'ù', '&ucirc;': 'û', '&icirc;': 'î',
  };

  return text
    // CORRIGÉ : entités numériques décimales (&#8217; → ') — c'est le
    // format utilisé par WordPress/Gutenberg pour les apostrophes courbes,
    // absent de l'ancienne liste fixe, d'où les apostrophes mal affichées.
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    // Entités numériques hexadécimales (&#x2019; → ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Entités nommées restantes
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

async function fetchPodcastEpisodes(): Promise<ResourceWithUrl[]> {
  const response = await fetch(PODCAST_RSS_URL);
  const xml = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  const data = parser.parse(xml);

  const rawItems = data?.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return items
    .map((item: any, index: number): ResourceWithUrl => {
      const enclosureUrl: string = item.enclosure?.['@_url'] ?? '';
      const rawTitle = item.title;
      const title = decodeHtmlEntities(
        typeof rawTitle === 'string' ? rawTitle : (rawTitle?.['#text'] ?? `Épisode ${index + 1}`)
      );
      const rawDescription = item.description ?? item['itunes:summary'];
      const description = stripHtml(
        typeof rawDescription === 'string' ? rawDescription : (rawDescription?.['#text'] ?? '')
      );
      const guid = typeof item.guid === 'string' ? item.guid : (item.guid?.['#text'] ?? `${index}`);
      const episodeImage: string | undefined = item['itunes:image']?.['@_href'];

      return {
        id: `podcast-${guid}`,
        title,
        description: description.slice(0, 220),
        type: 'podcast' as ResourceType,
        access: 'free' as const,
        filename: enclosureUrl.split('/').pop()?.split('?')[0] ?? `episode-${index}.mp3`,
        url: enclosureUrl,
        thumbnailUrl: episodeImage,
        duration: formatItunesDuration(item['itunes:duration']),
        isDownloaded: false,
      };
    })
    .filter((ep: ResourceWithUrl) => !!ep.url);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLES DE BLOG — API REST native WordPress (wp-json/wp/v2/posts)
// ─────────────────────────────────────────────────────────────────────────────

interface WpPost {
  id: number;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string }>;
  };
}

// Vitesse de lecture moyenne en français, pour estimer le temps de lecture
const WORDS_PER_MINUTE = 200;

function estimateReadingTime(html: string): string {
  const wordCount = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
  return `${minutes} min de lecture`;
}

// ─────────────────────────────────────────────────────────────────────────────
// DÉCOUPAGE DE L'ARTICLE EN ÉCRANS "STORY"
// ─────────────────────────────────────────────────────────────────────────────

// Longueur cible par écran, en caractères — calibrée pour rester lisible
// d'un coup d'œil sans avoir à scroller (~50-80 mots)
const SLIDE_TARGET_CHARS = 380;

type ContentBlockType = 'heading' | 'paragraph' | 'list-item' | 'quote';

interface ContentBlock {
  type: ContentBlockType;
  text: string;
}

export interface StorySlide {
  type: 'heading' | 'text';
  text: string;
}

// CORRIGÉ : l'ancien découpage ne coupait que sur </p>, donc tout ce qui
// est dans un titre (<h2>/<h3>), une liste (<li>) ou une citation
// (<blockquote>) se retrouvait fondu dans le texte sans distinction visuelle,
// voire perdu selon la structure. Ce parseur capture explicitement chaque
// bloc de contenu avec son type, pour ne rien perdre et pouvoir styliser
// les titres différemment des paragraphes.
function parseContentBlocks(html: string): ContentBlock[] {
  const blockRegex = /<(h[2-4]|p|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  const blocks: ContentBlock[] = [];
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const text = decodeHtmlEntities(stripHtml(match[2])).trim();
    if (!text) continue;

    let type: ContentBlockType = 'paragraph';
    if (/^h[2-4]$/.test(tag)) type = 'heading';
    else if (tag === 'li') type = 'list-item';
    else if (tag === 'blockquote') type = 'quote';

    blocks.push({ type, text });
  }

  return blocks;
}

function buildSlides(blocks: ContentBlock[]): StorySlide[] {
  const slides: StorySlide[] = [];
  let current = '';

  const flush = () => {
    if (current.trim()) {
      slides.push({ type: 'text', text: current.trim() });
      current = '';
    }
  };

  for (const block of blocks) {
    // Un titre obtient toujours son propre écran dédié, pour bien marquer
    // visuellement le début d'une nouvelle section — comme dans l'exemple
    // de référence (écran de titre seul, puis écran(s) de contenu).
    if (block.type === 'heading') {
      flush();
      slides.push({ type: 'heading', text: block.text });
      continue;
    }

    const chunk = block.type === 'list-item' ? `•  ${block.text}` : block.text;

    if (current && current.length + chunk.length > SLIDE_TARGET_CHARS) {
      flush();
    }
    current = current ? `${current}\n\n${chunk}` : chunk;
  }
  flush();

  return slides.length > 0 ? slides : [{ type: 'text', text: '' }];
}

async function fetchArticles(): Promise<ResourceWithUrl[]> {
  const response = await fetch(ARTICLES_API_URL);
  const posts: WpPost[] = await response.json();

  return posts.map((post): ResourceWithUrl => ({
    id: `article-${post.id}`,
    title: decodeHtmlEntities(stripHtml(post.title.rendered)),
    description: stripHtml(post.excerpt.rendered).slice(0, 220),
    type: 'article' as ResourceType,
    access: 'free' as const,
    filename: `article-${post.id}`,
    url: post.link,
    thumbnailUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
    duration: estimateReadingTime(post.content?.rendered ?? post.excerpt.rendered),
    articleContent: post.content?.rendered ?? '',
    isDownloaded: false,
  }));
}



function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// CORRIGÉ : retire tout emoji/symbole en tête de label ("🎧 Audio" → "Audio")
// pour un rendu texte seul, plus sobre/premium comme demandé.
function stripLeadingEmoji(label: string): string {
  return label.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim() || label;
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTEUR AUDIO MODAL — expo-audio (compatible Expo Go)
// ─────────────────────────────────────────────────────────────────────────────

interface AudioPlayerModalProps {
  visible: boolean;
  resource: ResourceWithUrl | null;
  onClose: () => void;
}

function isSoundCloudUrl(url: string): boolean {
  return url.includes('soundcloud.com');
}

function isDirectAudioUrl(url: string): boolean {
  return /\.(mp3|m4a|ogg|wav|aac|flac)(\?|$)/i.test(url);
}

function SoundCloudPlayer({ url, accentColor }: { url: string; accentColor: string }) {
  const [loaded, setLoaded] = useState(false);
  const widgetUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=${encodeURIComponent(accentColor.replace('#',''))}&show_artwork=true&buying=false&sharing=false&download=false&show_comments=false&show_playcount=false&show_user=false&visual=true`;

  return (
    <View style={{ width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
      {!loaded && (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <ActivityIndicator color={accentColor} />
          <Text style={{ color: '#888', fontSize: 12, marginTop: 8 }}>Chargement du lecteur...</Text>
        </View>
      )}
      <WebView
        source={{ uri: widgetUrl }}
        style={{ flex: 1, opacity: loaded ? 1 : 0 }}
        onLoadEnd={() => setLoaded(true)}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        onShouldStartLoadWithRequest={request => {
          const allowed = request.url.includes('w.soundcloud.com') || request.url.includes('api.soundcloud.com');
          return allowed;
        }}
      />
    </View>
  );
}

function DirectAudioPlayer({
  url, accentColor,
}: { url: string; accentColor: string }) {
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing ?? false;
  const position  = status.currentTime ?? 0;
  const duration  = status.duration ?? 0;
  const loading   = status.isBuffering ?? false;
  const progress  = duration > 0 ? position / duration : 0;

  useEffect(() => {
    player.play();
    return () => { try { player.pause(); } catch {} };
  }, []);

  const seekBy = (delta: number) => {
    player.seekTo(Math.max(0, Math.min(position + delta, duration)));
  };

  if (loading) return <ActivityIndicator color={accentColor} style={{ marginVertical: 32 }} />;

  return (
    <>
      <View style={playerStyles.progressBar}>
        <View style={[playerStyles.progressFill, { width: `${progress * 100}%`, backgroundColor: accentColor }]} />
      </View>
      <View style={playerStyles.timesRow}>
        <Text style={playerStyles.time}>{formatTime(position)}</Text>
        <Text style={playerStyles.time}>{formatTime(duration)}</Text>
      </View>
      <View style={playerStyles.controls}>
        <TouchableOpacity style={playerStyles.seekBtn} onPress={() => seekBy(-15)}>
          <Text style={playerStyles.seekTxt}>−15s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[playerStyles.playBtn, { backgroundColor: accentColor }]} onPress={() => isPlaying ? player.pause() : player.play()}>
          {isPlaying ? <Pause size={22} color={Colors.text.inverse} /> : <Play size={22} color={Colors.text.inverse} />}
        </TouchableOpacity>
        <TouchableOpacity style={playerStyles.seekBtn} onPress={() => seekBy(15)}>
          <Text style={playerStyles.seekTxt}>+15s</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function AudioPlayerModal({ visible, resource, onClose }: AudioPlayerModalProps) {
  if (!resource) return null;

  const pillar      = resource.pillarId ? getPillarById(resource.pillarId) : null;
  const accentColor = pillar?.color ?? Colors.brand.gold;
  const url         = resource.url ?? '';
  const useSoundCloud = isSoundCloudUrl(url);
  const useDirect     = isDirectAudioUrl(url);
  const canPlay       = useSoundCloud || useDirect;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={playerStyles.container}>
        <TouchableOpacity style={playerStyles.closeRow} onPress={onClose}>
          <X size={22} color={Colors.text.muted} />
        </TouchableOpacity>

        <View style={playerStyles.content}>
          <View style={[playerStyles.artwork, { backgroundColor: accentColor + '22' }]}>
            {resource.pillarId ? (
              <Text style={[playerStyles.artworkNum, { color: accentColor }]}>{`P${resource.pillarId}`}</Text>
            ) : (
              <Headphones size={40} color={accentColor} />
            )}
          </View>

          <Text style={playerStyles.title}>{resource.title}</Text>
          <Text style={playerStyles.sub} numberOfLines={2}>{resource.description}</Text>

          {!canPlay ? (
            <Text style={{ color: Colors.text.muted, fontSize: 13, textAlign: 'center', marginTop: 24 }}>
              Lien audio non disponible.
            </Text>
          ) : useSoundCloud ? (
            <SoundCloudPlayer url={url} accentColor={accentColor} />
          ) : (
            <DirectAudioPlayer url={url} accentColor={accentColor} />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const playerStyles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background.primary },
  closeRow:    { padding: Spacing.xl, alignItems: 'flex-end' },
  closeTxt:    { ...Typography.body, color: Colors.text.muted },
  content:     { flex: 1, alignItems: 'center', paddingHorizontal: Spacing['2xl'], justifyContent: 'center' },
  artwork:     { width: 160, height: 160, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['2xl'] },
  artworkNum:  { fontSize: 40, fontWeight: '800' },
  title:       { ...Typography.h3, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.sm },
  sub:         { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'] },
  progressBar: { width: '100%', height: 4, backgroundColor: Colors.border.default, borderRadius: 2, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill:{ height: '100%', borderRadius: 2 },
  timesRow:    { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing['2xl'] },
  time:        { ...Typography.caption, color: Colors.text.muted },
  controls:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  playBtn:     { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  playIcon:    { fontSize: 24, color: Colors.text.inverse },
  seekBtn:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default },
  seekTxt:     { ...Typography.label, color: Colors.text.secondary },
});

// ─────────────────────────────────────────────────────────────────────────────
// VISIONNEUSE PDF MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface PdfViewerModalProps {
  visible: boolean;
  url: string;
  title: string;
  onClose: () => void;
}

function PdfViewerModal({ visible, url, title, onClose }: PdfViewerModalProps) {
  const [webLoading, setWebLoading] = useState(true);
  const [errored, setErrored]       = useState(false);

  useEffect(() => {
    if (visible) { setWebLoading(true); setErrored(false); }
  }, [visible, url]);

  const viewerUrl = `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(url)}`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={pdfStyles.container}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {visible && url ? (
          <View style={{ flex: 1 }}>
            {webLoading && !errored && (
              <View style={pdfStyles.loading}>
                <ActivityIndicator color={Colors.brand.gold} size="large" />
                <Text style={{ color: '#fff', marginTop: 12, fontSize: 13 }}>
                  Chargement du PDF...
                </Text>
              </View>
            )}
            {errored ? (
              <View style={[pdfStyles.loading, { gap: 16 }]}>
                <FileText size={32} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, textAlign: 'center' }}>
                  Impossible d'afficher ce PDF
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: Colors.brand.gold, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}
                  onPress={onClose}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <WebView
                key={viewerUrl}
                source={{ uri: viewerUrl }}
                style={[pdfStyles.pdf, webLoading && { opacity: 0 }]}
                onLoadEnd={() => setWebLoading(false)}
                onError={() => { setWebLoading(false); setErrored(true); }}
                onHttpError={({ nativeEvent }) => {
                  if (nativeEvent.statusCode >= 400) { setWebLoading(false); setErrored(true); }
                }}
                javaScriptEnabled
                domStorageEnabled
                onShouldStartLoadWithRequest={request => {
                  if (request.url.startsWith('blob:') || request.url.startsWith('content:')) return false;
                  return true;
                }}
              />
            )}
          </View>
        ) : (
          <View style={pdfStyles.loading}>
            <ActivityIndicator color={Colors.brand.gold} />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const pdfStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: '#333' },
  title:     { flex: 1, ...Typography.h4, color: '#fff', marginRight: Spacing.md },
  closeTxt:  { fontSize: 20, color: '#fff' },
  pdf:       { flex: 1, width },
  loading:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// LECTEUR ARTICLE "STORY" — découpe le contenu en plusieurs écrans courts
// avec barre de progression segmentée, navigation par tap (zones gauche/
// droite), et actions de partage en bas (partage natif + Instagram Story).
// ─────────────────────────────────────────────────────────────────────────────

interface ArticleStoryModalProps {
  visible: boolean;
  resource: ResourceWithUrl | null;
  onClose: () => void;
}

function ArticleStoryModal({ visible, resource, onClose }: ArticleStoryModalProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [generatingStory, setGeneratingStory] = useState(false);
  const storyCardRef = useRef<ViewShot>(null);

  const slides = useMemo(
    () => (resource ? buildSlides(parseContentBlocks(resource.articleContent ?? '')) : [{ type: 'text' as const, text: '' }]),
    [resource?.id]
  );

  useEffect(() => {
    if (visible) setSlideIndex(0);
  }, [visible, resource?.id]);

  if (!resource) return null;
  const total = slides.length;

  const goNext = () => {
    if (slideIndex < total - 1) setSlideIndex(i => i + 1);
    else onClose();
  };

  const goPrev = () => {
    if (slideIndex > 0) setSlideIndex(i => i - 1);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${resource.title}\n\n${resource.url ?? ''}`,
        title: resource.title,
      });
    } catch {
      // partage annulé par l'utilisateur — rien à faire
    }
  };

  // CORRIGÉ : capture la carte "story" (rendue hors-écran juste en dessous)
  // en image PNG, puis ouvre le sheet de partage natif du téléphone avec
  // cette image. L'utilisateur choisit Instagram dans ce sheet — l'image
  // arrive directement dans le compositeur de story Instagram.
  //
  // ⚠️ Ce n'est pas un lien "direct en un tap" vers le compositeur (ça,
  // ça demanderait un build natif custom, incompatible avec Expo Go) —
  // mais c'est un partage réel et fonctionnel dès maintenant.
  const handleShareStory = async () => {
    if (!storyCardRef.current?.capture) {
      Alert.alert('Erreur', "Impossible de générer l'image pour le moment.");
      return;
    }
    setGeneratingStory(true);
    try {
      const uri = await storyCardRef.current.capture();
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Indisponible', "Le partage n'est pas disponible sur cet appareil.");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Partager en story',
      });
    } catch (err) {
      Alert.alert('Erreur', "Impossible de générer l'image de partage.");
    } finally {
      setGeneratingStory(false);
    }
  };

  const storySlideText = slides[slideIndex]?.text ?? '';

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView style={storyStyles.container}>

        {/* Barre de progression segmentée */}
        <View style={storyStyles.progressRow}>
          {slides.map((_, i) => (
            <View key={i} style={storyStyles.progressTrack}>
              <View
                style={[
                  storyStyles.progressFill,
                  i <= slideIndex && storyStyles.progressFillActive,
                ]}
              />
            </View>
          ))}
        </View>

        {/* En-tête : titre + temps de lecture + fermeture */}
        <View style={storyStyles.header}>
          <View style={{ flex: 1 }}>
            <Text style={storyStyles.headerTitle} numberOfLines={1}>{resource.title}</Text>
            {resource.duration && (
              <Text style={storyStyles.headerMeta}>{resource.duration.toUpperCase()}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={storyStyles.closeBtn}>
            <X size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Contenu de l'écran courant + zones de tap pour naviguer */}
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              storyStyles.slideContent,
              slides[slideIndex].type === 'heading' && storyStyles.slideContentHeading,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {slides[slideIndex].type === 'heading' ? (
              <Text style={storyStyles.headingSlideText}>{slides[slideIndex].text}</Text>
            ) : (
              <>
                <View style={storyStyles.bullet} />
                <Text style={storyStyles.slideText}>{slides[slideIndex].text}</Text>
              </>
            )}
            {slideIndex === 0 && resource.thumbnailUrl && (
              <Image
                source={{ uri: resource.thumbnailUrl }}
                style={storyStyles.slideImage}
                resizeMode="cover"
              />
            )}
          </ScrollView>

          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            <View style={{ flexDirection: 'row', flex: 1 }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={goPrev} activeOpacity={1} />
              <TouchableOpacity style={{ flex: 2 }} onPress={goNext} activeOpacity={1} />
            </View>
          </View>
        </View>

        {/* Actions : partage natif + partage Story Instagram */}
        <View style={storyStyles.actionsRow}>
          <TouchableOpacity style={storyStyles.actionBtn} onPress={handleShare} activeOpacity={0.85}>
            <Share2 size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[storyStyles.actionBtn, storyStyles.actionBtnWide]}
            onPress={handleShareStory}
            activeOpacity={0.85}
            disabled={generatingStory}
          >
            {generatingStory ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : (
              <>
                <Camera size={20} color={Colors.text.primary} />
                <Text style={storyStyles.actionBtnTxt}>Story</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Carte "story" hors-écran — sert uniquement de source à la
            capture d'image ci-dessus, jamais visible par l'utilisateur. */}
        <View style={storyStyles.hiddenCardWrap} pointerEvents="none">
          <ViewShot ref={storyCardRef} options={{ format: 'png', quality: 0.92 }}>
            <View style={storyStyles.storyCard}>
              {resource.thumbnailUrl ? (
                <Image
                  source={{ uri: resource.thumbnailUrl }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
              ) : null}
              <View style={storyStyles.storyCardOverlay} />
              <View style={storyStyles.storyCardContent}>
                <Text style={storyStyles.storyCardBrand}>LE CODE MASCULIN</Text>
                <Text style={storyStyles.storyCardTitle} numberOfLines={4}>
                  {resource.title}
                </Text>
                <Text style={storyStyles.storyCardExcerpt} numberOfLines={6}>
                  {storySlideText}
                </Text>
                <Text style={storyStyles.storyCardFooter}>pilierconscient.com</Text>
              </View>
            </View>
          </ViewShot>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const storyStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.brand.navy },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(245, 240, 232, 0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '0%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  progressFillActive: {
    width: '100%',
    backgroundColor: Colors.brand.gold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTitle: { ...Typography.h4, color: Colors.text.primary },
  headerMeta: { ...Typography.caption, color: Colors.brand.gold, marginTop: 4, letterSpacing: 0.5 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(245, 240, 232, 0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  slideContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
  },
  slideContentHeading: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  bullet: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.brand.gold,
    marginBottom: Spacing.lg,
  },
  slideText: {
    ...Typography.h4,
    color: Colors.text.primary,
    lineHeight: 34,
    fontWeight: '500',
  },
  headingSlideText: {
    ...Typography.h1,
    color: Colors.text.primary,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800',
  },
  slideImage: {
    width: '100%',
    height: 220,
    borderRadius: Radius.lg,
    marginTop: Spacing['2xl'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  actionBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(245, 240, 232, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnWide: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    borderRadius: Radius.full,
  },
  actionBtnTxt: { ...Typography.button, color: Colors.text.primary },

  // Carte story hors-écran (jamais visible, sert uniquement à la capture)
  hiddenCardWrap: {
    position: 'absolute',
    top: -9999,
    left: -9999,
  },
  storyCard: {
    width: 360,
    height: 640,
    backgroundColor: Colors.brand.navy,
    overflow: 'hidden',
  },
  storyCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 26, 46, 0.72)',
  },
  storyCardContent: {
    flex: 1,
    padding: 32,
    justifyContent: 'flex-end',
  },
  storyCardBrand: {
    color: Colors.brand.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  storyCardTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 16,
  },
  storyCardExcerpt: {
    color: 'rgba(245, 240, 232, 0.85)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  storyCardFooter: {
    color: Colors.brand.gold,
    fontSize: 13,
    fontWeight: '600',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCE CARD
// ─────────────────────────────────────────────────────────────────────────────

interface ResourceCardProps {
  resource: ResourceWithUrl;
  unlocked: boolean;
  onPlay: (r: ResourceWithUrl) => void;
  onOpenPdf: (r: ResourceWithUrl) => void;
  onOpenArticle: (r: ResourceWithUrl) => void;
}

function ResourceCard({ resource, unlocked, onPlay, onOpenPdf, onOpenArticle }: ResourceCardProps) {
  const [downloaded, setDownloaded] = useState(resource.isDownloaded ?? false);
  const [downloading, setDownloading] = useState(false);

  const pillar = resource.pillarId ? getPillarById(resource.pillarId) : null;
  const isLocked = resource.access === 'premium' && !unlocked;
  const typeLabel = getTypeLabel(resource.type);
  const accentColor = pillar?.color ?? Colors.brand.gold;

  const TypeIcon = {
    audio: Headphones,
    pdf: FileText,
    template: ClipboardList,
    video: PlayCircle,
    ebook: BookOpen,
    podcast: Mic,
    article: Newspaper,
  }[resource.type] ?? FileText;

  const handleAction = () => {
    if (isLocked) {
      const message = (resource.type === 'pdf' || resource.type === 'audio')
        ? "Cette ressource se débloque quand tu complètes la leçon ou le pilier correspondant."
        : "Passe à l'abonnement Premium pour accéder à cette ressource.";

      Alert.alert(
        'Contenu verrouillé',
        message,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Voir le programme', style: 'default',
            onPress: () => router.push('/(tabs)/programme'),
          },
        ],
      );
      return;
    }

    if (resource.url && resource.url.length > 0) {
      if (resource.type === 'audio' || resource.type === 'podcast') {
        onPlay(resource);
        return;
      }
      if (resource.type === 'pdf' || resource.type === 'template' || resource.type === 'ebook') {
        onOpenPdf(resource);
        return;
      }
      if (resource.type === 'article') {
        onOpenArticle(resource);
        return;
      }
    }

    if (downloaded) {
      Alert.alert('Ouvrir', `Ouverture de "${resource.title}"...`);
      return;
    }
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      Alert.alert('Téléchargé', `"${resource.title}" est maintenant disponible hors-ligne.`);
    }, 1500);
  };

  const actionIcon = (() => {
    if (isLocked) return Lock;
    if (resource.url && resource.url.length > 0) {
      if (resource.type === 'audio' || resource.type === 'podcast') return Play;
      if (resource.type === 'ebook') return BookOpen;
      if (resource.type === 'article') return Newspaper;
      return FileText;
    }
    if (downloaded) return Play;
    return Lock;
  })();

  const primaryMeta = resource.duration
    ? resource.duration
    : resource.pages
      ? `${resource.pages} pages`
      : resource.fileSize;

  return (
    <View style={[styles.card, isLocked && styles.cardLocked]}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardMetaLine} numberOfLines={1}>
          {typeLabel}{primaryMeta ? ` • ${primaryMeta}` : ''}
        </Text>
        <Text style={[styles.cardTitle, isLocked && styles.textMuted]} numberOfLines={2}>
          {resource.title}
        </Text>
        {resource.type !== 'article' && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {resource.description}
          </Text>
        )}
      </View>

      <View style={styles.cardRight}>
        {resource.thumbnailUrl ? (
          <Image
            source={{ uri: resource.thumbnailUrl }}
            style={[styles.thumbImage, isLocked && { opacity: 0.5 }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbImage, styles.thumbFallback, { backgroundColor: isLocked ? Colors.background.tertiary : accentColor + '14' }]}>
            <TypeIcon size={26} color={isLocked ? Colors.text.muted : accentColor} />
          </View>
        )}

        {isLocked ? (
          <View style={styles.overlayPill}>
            <Crown size={10} color={Colors.brand.gold} />
          </View>
        ) : downloaded ? (
          <View style={[styles.overlayPill, styles.overlayPillSuccess]}>
            <CheckCircle2 size={10} color={Colors.status.success} />
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.actionBtn,
            isLocked && styles.actionBtnLocked,
            downloaded && !isLocked && styles.actionBtnDownloaded,
          ]}
          onPress={handleAction}
          activeOpacity={0.85}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={Colors.text.inverse} />
          ) : (
            React.createElement(actionIcon, {
              size: 15,
              color: isLocked ? Colors.text.muted : downloaded ? Colors.brand.gold : Colors.text.inverse,
            })
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉCRAN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function BibliothequeScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<ResourceType | 'all'>('all');

  const { entitlement, userProgress } = useAuthStore();
  const isPremium = entitlement.active;
  const completedIds = getCompletedLessonIds(userProgress);

  const [apiResources, setApiResources] = useState<ResourceWithUrl[]>([]);
  const [apiLoading, setApiLoading]     = useState(true);
  const [podcastEpisodes, setPodcastEpisodes] = useState<ResourceWithUrl[]>([]);
  const [articles, setArticles] = useState<ResourceWithUrl[]>([]);

  // CORRIGÉ : suit le scroll vertical pour animer le fond de la barre de
  // filtres fixe (transparent → légèrement teinté une fois le titre passé).
  const scrollY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = scrollY.interpolate({
    inputRange: [0, BACKDROP_FADE_DISTANCE],
    outputRange: [0, 0.94],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then((data: ApiResponse) => setApiResources(mapApiToResources(data)))
      .catch(() => {
        setApiResources(RESOURCES as ResourceWithUrl[]);
      })
      .finally(() => setApiLoading(false));
  }, []);

  useEffect(() => {
    fetchPodcastEpisodes()
      .then(setPodcastEpisodes)
      .catch(() => {
        setPodcastEpisodes([]);
      });
  }, []);

  useEffect(() => {
    // Échec silencieux — le blog est optionnel, le reste de la bibliothèque
    // doit rester utilisable même si l'API WordPress est indisponible.
    fetchArticles()
      .then(setArticles)
      .catch(() => {
        setArticles([]);
      });
  }, []);

  const allResources: ResourceWithUrl[] = apiLoading
    ? (RESOURCES as ResourceWithUrl[])
    : [...apiResources, ...podcastEpisodes, ...articles];

  const [playerVisible, setPlayerVisible]   = useState(false);
  const [currentAudio, setCurrentAudio]     = useState<ResourceWithUrl | null>(null);

  const handlePlay = useCallback((resource: ResourceWithUrl) => {
    if (!resource.url) return;
    setCurrentAudio(resource);
    setPlayerVisible(true);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setPlayerVisible(false);
    setCurrentAudio(null);
  }, []);

  const [pdfVisible, setPdfVisible]   = useState(false);
  const [pdfUrl, setPdfUrl]           = useState('');
  const [pdfTitle, setPdfTitle]       = useState('');

  const handleOpenPdf = useCallback((resource: ResourceWithUrl) => {
    if (!resource.url) return;
    setPdfUrl(resource.url);
    setPdfTitle(resource.title);
    setPdfVisible(true);
  }, []);

  const [articleVisible, setArticleVisible] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<ResourceWithUrl | null>(null);

  const handleOpenArticle = useCallback((resource: ResourceWithUrl) => {
    setCurrentArticle(resource);
    setArticleVisible(true);
  }, []);

    const { openId } = useLocalSearchParams<{ openId?: string }>();
  const lastOpenedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!openId || openId === lastOpenedIdRef.current) return;

    const podcastMatch = podcastEpisodes.find((p) => p.id === openId);
    if (podcastMatch) {
      lastOpenedIdRef.current = openId;
      handlePlay(podcastMatch);
      return;
    }

    const articleMatch = articles.find((a) => a.id === openId);
    if (articleMatch) {
      lastOpenedIdRef.current = openId;
      handleOpenArticle(articleMatch);
    }
  }, [openId, podcastEpisodes, articles, handlePlay, handleOpenArticle]);

  const isResourceUnlocked = (r: ResourceWithUrl): boolean => {
    if (r.type === 'podcast' || r.type === 'article') return true;
    if (!isPremium) return false;

    if (r.type === 'template' || r.type === 'ebook') return true;

    if (r.type === 'pdf') {
      if (r.weekNumber === undefined) return false;
      return isPdfUnlockedByWeek(r.weekNumber, completedIds);
    }

    if (r.type === 'audio') {
      if (r.pillarId === undefined) return false;
      return isAudioUnlockedByPillar(r.pillarId, completedIds);
    }

    return false;
  };

  // CORRIGÉ : recherche textuelle retirée — seul le filtre par type reste
  const filteredResources = allResources.filter(r => {
    return activeFilter === 'all' || r.type === activeFilter;
  });

  const freeResources    = filteredResources.filter(r => r.access === 'free');
  const premiumResources = filteredResources.filter(r => r.access === 'premium');
  const downloadedCount  = allResources.filter(r => r.isDownloaded).length;

  return (
    <SafeScreen edges={['top']}>
      <View style={styles.container}>

        {/* CORRIGÉ : barre de filtres fixe en haut de l'écran, transparente
            au repos. Le titre "Bibliothèque" (déplacé dans le contenu
            scrollable ci-dessous) défile derrière elle ; une fois qu'il est
            passé, le fond de la barre se teinte légèrement pour rester
            lisible, sans jamais cacher le défilement horizontal des formats. */}
        <View style={styles.fixedFiltersBar} pointerEvents="box-none">
          <Animated.View style={[styles.filtersBackdrop, { opacity: backdropOpacity }]} pointerEvents="none" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {RESOURCE_TYPES.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key as ResourceType | 'all')}
              >
                <Text style={[styles.filterTxt, activeFilter === f.key && styles.filterTxtActive]}>
                  {stripLeadingEmoji(f.label)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={{ paddingTop: FILTERS_BAR_HEIGHT + Spacing.md }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Titre — fait maintenant partie du contenu scrollable, il défile
              normalement avec le reste au lieu d'être fixe */}
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Bibliothèque</Text>
            {downloadedCount > 0 && (
              <View style={styles.offlineBadge}>
                <Download size={12} color={Colors.status.success} />
                <Text style={styles.offlineTxt}>{downloadedCount} hors-ligne</Text>
              </View>
            )}
          </View>

          {!isPremium && (
            <TouchableOpacity
              style={styles.premiumBanner}
              onPress={() => router.push('/(tabs)/profil')}
              activeOpacity={0.9}
            >
              <Crown size={28} color={Colors.brand.gold} />
              <View style={styles.premiumBannerText}>
                <Text style={styles.premiumBannerTitle}>Passe à Premium</Text>
                <Text style={styles.premiumBannerSub}>
                  Accède aux {premiumResources.length} ressources verrouillées
                </Text>
              </View>
              <Text style={styles.premiumBannerArrow}>›</Text>
            </TouchableOpacity>
          )}

          {freeResources.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {isPremium ? 'Toutes les ressources' : 'Ressources gratuites'}
                <Text style={styles.sectionCount}> · {freeResources.length}</Text>
              </Text>
              <View style={styles.grid}>
                {freeResources.map(r => (
                  <View key={r.id} style={styles.gridItem}>
                    <ResourceCard resource={r} unlocked={isResourceUnlocked(r)} onPlay={handlePlay} onOpenPdf={handleOpenPdf} onOpenArticle={handleOpenArticle} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {premiumResources.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Ressources Premium
                  <Text style={styles.sectionCount}> · {premiumResources.length}</Text>
                </Text>
                <Crown size={16} color={Colors.brand.gold} />
              </View>
              <View style={styles.grid}>
                {premiumResources.map(r => (
                  <View key={r.id} style={styles.gridItem}>
                    <ResourceCard resource={r} unlocked={isResourceUnlocked(r)} onPlay={handlePlay} onOpenPdf={handleOpenPdf} onOpenArticle={handleOpenArticle} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {filteredResources.length === 0 && (
            <View style={styles.emptyState}>
              <Search size={40} color={Colors.text.muted} style={{ marginBottom: Spacing.lg }} />
              <Text style={styles.emptyTitle}>Aucun résultat</Text>
              <Text style={styles.emptyTxt}>
                Essaie un autre filtre.
              </Text>
            </View>
          )}

          {/* Dégagement dynamique pour la pill flottante de navigation */}
          <View style={{ height: 68 + 16 + insets.bottom + 16 }} />
        </Animated.ScrollView>

        <AudioPlayerModal
          visible={playerVisible}
          resource={currentAudio}
          onClose={handleClosePlayer}
        />
        <PdfViewerModal
          visible={pdfVisible}
          url={pdfUrl}
          title={pdfTitle}
          onClose={() => setPdfVisible(false)}
        />
        <ArticleStoryModal
          visible={articleVisible}
          resource={currentArticle}
          onClose={() => setArticleVisible(false)}
        />
      </View>
    </SafeScreen>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  // Barre de filtres fixe
  fixedFiltersBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: FILTERS_BAR_HEIGHT,
    zIndex: 20,
    justifyContent: 'center',
  },
  filtersBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background.primary,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerTitle: { ...Typography.h2, color: Colors.text.primary },
  offlineBadge: {
    backgroundColor: Colors.status.successBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offlineTxt: { ...Typography.caption, color: Colors.status.success },

  filtersContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    alignItems: 'center',
    height: FILTERS_BAR_HEIGHT,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 0,
    backgroundColor: Colors.background.secondary,
    height: 44,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.brand.gold,
  },
  filterTxt: {
    ...Typography.body,
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text.muted,
    textTransform: 'none',
    letterSpacing: 0,
  },
  filterTxtActive: { color: Colors.text.inverse },

  scroll: { flex: 1 },

  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.brand.gold,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadow.gold,
  },
  premiumBannerIcon: { fontSize: 28 },
  premiumBannerText: { flex: 1 },
  premiumBannerTitle: { ...Typography.h4, color: Colors.text.primary },
  premiumBannerSub: { ...Typography.bodySmall, color: Colors.text.secondary, marginTop: 2 },
  premiumBannerArrow: { fontSize: 24, color: Colors.brand.gold },

  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.label, color: Colors.text.secondary },
  sectionCount: { color: Colors.text.muted },
  premiumTag: { fontSize: 16 },

  grid: {
    flexDirection: 'column',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  gridItem: { width: '100%' },

  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  cardLocked: { opacity: 0.85 },

  cardLeft: {
    flex: 2,
    justifyContent: 'center',
  },
  cardMetaLine: {
    ...Typography.caption,
    color: Colors.text.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  textMuted: { color: Colors.text.muted },
  cardDesc: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
    lineHeight: 19,
  },

  cardRight: {
    flex: 1,
    position: 'relative',
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.background.tertiary,
  },
  thumbImage: {
    flex: 1,
    width: '100%',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  overlayPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.full,
    padding: 4,
  },
  overlayPillSuccess: {
    backgroundColor: Colors.status.successBg,
  },

  actionBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLocked: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  actionBtnDownloaded: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: Colors.brand.gold,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.sm },
  emptyTxt: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', lineHeight: 24 },
});
