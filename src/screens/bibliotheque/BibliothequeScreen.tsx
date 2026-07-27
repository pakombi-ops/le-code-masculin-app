import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, Dimensions,
  Modal, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { WebView } from 'react-native-webview';

import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
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
const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// Étend Resource avec les champs ajoutés par l'API
// ─────────────────────────────────────────────────────────────────────────────

interface ResourceWithUrl extends Resource {
  url?: string;
  weekNumber?: number;
}

// Forme brute retournée par wp-json/pc-bib/v1/resources
interface ApiAudio {
  pilier: number;
  phase: string;
  nom: string;
  duree: string;
  theme: string;
  url: string;
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
  disponible: boolean;
}
interface ApiTemplate {
  slug: string;
  titre: string;
  description: string;
  categorie: string;
  url: string;
  disponible: boolean;
}
interface ApiEbook {
  slug: string;
  titre: string;
  description: string;
  url: string;
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
      isDownloaded: false,
    }));

  const ebooks: ResourceWithUrl[] = (api.ebooks ?? []).map(e => ({
    id:           `ebook-${e.slug}`,
    title:        e.titre,
    description:  e.description,
    type:         'ebook' as ResourceType,
    access:       'free' as const,
    url:          e.url ?? '',
    isDownloaded: false,
  }));

  const templates: ResourceWithUrl[] = api.templates.map(t => ({
    id:           `tpl-${t.slug}`,
    title:        t.titre,
    description:  t.description,
    type:         'template' as ResourceType,
    access:       'premium' as const,
    url:          t.url ?? '',
    isDownloaded: false,
  }));

  return [...audios, ...ebooks, ...pdfs, ...templates];
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTEUR AUDIO MODAL — expo-audio (compatible Expo Go)
// ─────────────────────────────────────────────────────────────────────────────

interface AudioPlayerModalProps {
  visible: boolean;
  resource: ResourceWithUrl | null;
  onClose: () => void;
}

// Détecte si une URL est SoundCloud (lien web, pas fichier audio direct)
function isSoundCloudUrl(url: string): boolean {
  return url.includes('soundcloud.com');
}

// Détecte si une URL est un fichier audio direct (mp3, m4a, ogg, wav...)
function isDirectAudioUrl(url: string): boolean {
  return /\.(mp3|m4a|ogg|wav|aac|flac)(\?|$)/i.test(url);
}

// ── Lecteur SoundCloud (WebView) ──────────────────────────────────────────────
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

// ── Lecteur audio direct (expo-audio) ─────────────────────────────────────────
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
          <Text style={playerStyles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={playerStyles.seekBtn} onPress={() => seekBy(15)}>
          <Text style={playerStyles.seekTxt}>+15s</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── Modal principal audio ─────────────────────────────────────────────────────
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
          <Text style={playerStyles.closeTxt}>✕ Fermer</Text>
        </TouchableOpacity>

        <View style={playerStyles.content}>
          <View style={[playerStyles.artwork, { backgroundColor: accentColor + '22' }]}>
            <Text style={[playerStyles.artworkNum, { color: accentColor }]}>
              {resource.pillarId ? `P${resource.pillarId}` : '🎧'}
            </Text>
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
            <Text style={pdfStyles.closeTxt}>✕</Text>
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
                <Text style={{ color: '#fff', fontSize: 15, textAlign: 'center' }}>
                  ⚠️ Impossible d'afficher ce PDF
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
// RESOURCE CARD
// ─────────────────────────────────────────────────────────────────────────────

interface ResourceCardProps {
  resource: ResourceWithUrl;
  unlocked: boolean;
  onPlay: (r: ResourceWithUrl) => void;
  onOpenPdf: (r: ResourceWithUrl) => void;
}

function ResourceCard({ resource, unlocked, onPlay, onOpenPdf }: ResourceCardProps) {
  const [downloaded, setDownloaded] = useState(resource.isDownloaded ?? false);
  const [downloading, setDownloading] = useState(false);

  const pillar = resource.pillarId ? getPillarById(resource.pillarId) : null;
  const isLocked = resource.access === 'premium' && !unlocked;
  const icon = getTypeIcon(resource.type);
  const typeLabel = getTypeLabel(resource.type);
  const accentColor = pillar?.color ?? Colors.brand.gold;

  const handleAction = () => {
    if (isLocked) {
      const message = (resource.type === 'pdf' || resource.type === 'audio')
        ? "Cette ressource se débloque quand tu complètes la leçon ou le pilier correspondant."
        : "Passe à l'abonnement Premium pour accéder à cette ressource.";

      Alert.alert(
        '🔒 Contenu verrouillé',
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
      if (resource.type === 'audio') {
        onPlay(resource);
        return;
      }
      if (resource.type === 'pdf' || resource.type === 'template' || resource.type === 'ebook') {
        onOpenPdf(resource);
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
      Alert.alert('✅ Téléchargé', `"${resource.title}" est maintenant disponible hors-ligne.`);
    }, 1500);
  };

  return (
    <View style={[styles.card, isLocked && styles.cardLocked]}>
      {isLocked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>👑</Text>
          <Text style={styles.lockTxt}>Premium</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { borderColor: isLocked ? Colors.border.default : accentColor }]}>
          <Text style={styles.typeIconTxt}>{icon}</Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.typeBadge, {
            backgroundColor: isLocked ? Colors.background.tertiary : accentColor + '22',
            borderColor: isLocked ? Colors.border.default : accentColor,
          }]}>
            <Text style={[styles.typeBadgeTxt, { color: isLocked ? Colors.text.muted : accentColor }]}>
              {typeLabel}
            </Text>
          </View>
          {pillar && (
            <Text style={styles.pillarTag} numberOfLines={1}>Pilier {pillar.id}</Text>
          )}
        </View>
        {downloaded && !isLocked && (
          <View style={styles.downloadedBadge}>
            <Text style={styles.downloadedTxt}>✓ Offline</Text>
          </View>
        )}
      </View>

      <Text style={[styles.cardTitle, isLocked && styles.textMuted]}>
        {resource.title}
      </Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {resource.description}
      </Text>

      <View style={styles.cardMeta}>
        {resource.duration && <Text style={styles.metaTxt}>⏱ {resource.duration}</Text>}
        {resource.pages    && <Text style={styles.metaTxt}>📃 {resource.pages} pages</Text>}
        {resource.fileSize && <Text style={styles.metaTxt}>💾 {resource.fileSize}</Text>}
      </View>

      <TouchableOpacity
        style={[
          styles.cardCta,
          isLocked && styles.cardCtaLocked,
          downloaded && !isLocked && styles.cardCtaDownloaded,
        ]}
        onPress={handleAction}
        activeOpacity={0.85}
      >
        <Text style={[
          styles.cardCtaTxt,
          isLocked && styles.cardCtaTxtLocked,
          downloaded && !isLocked && styles.cardCtaTxtDownloaded,
        ]}>
          {isLocked
            ? '🔒 Verrouillé'
            : (resource.url && resource.url.length > 0)
              ? resource.type === 'audio'
                ? '▶ Écouter'
                : resource.type === 'ebook'
                  ? "📖 Lire l'ebook"
                  : '📄 Ouvrir'
              : downloading
                ? '⏳ Téléchargement...'
                : downloaded
                  ? '▶ Ouvrir'
                  : '🔒 À venir'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉCRAN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function BibliothequeScreen() {
  const [activeFilter, setActiveFilter] = useState<ResourceType | 'all'>('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const { entitlement, userProgress } = useAuthStore();
  const isPremium = entitlement.active;
  const completedIds = getCompletedLessonIds(userProgress);

  const [apiResources, setApiResources] = useState<ResourceWithUrl[]>([]);
  const [apiLoading, setApiLoading]     = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then((data: ApiResponse) => setApiResources(mapApiToResources(data)))
      .catch(() => {
        setApiResources(RESOURCES as ResourceWithUrl[]);
      })
      .finally(() => setApiLoading(false));
  }, []);

  const allResources: ResourceWithUrl[] = apiLoading
    ? (RESOURCES as ResourceWithUrl[])
    : apiResources;

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

  const isResourceUnlocked = (r: ResourceWithUrl): boolean => {
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

  const filteredResources = allResources.filter(r => {
    const matchType   = activeFilter === 'all' || r.type === activeFilter;
    const matchSearch = searchQuery === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const freeResources    = filteredResources.filter(r => r.access === 'free');
  const premiumResources = filteredResources.filter(r => r.access === 'premium');
  const downloadedCount  = allResources.filter(r => r.isDownloaded).length;

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bibliothèque</Text>
        {downloadedCount > 0 && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineTxt}>📥 {downloadedCount} hors-ligne</Text>
          </View>
        )}
      </View>

      <View style={styles.searchArea}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une ressource..."
            placeholderTextColor={Colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {RESOURCE_TYPES.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key as ResourceType | 'all')}
          >
            <Text style={[styles.filterTxt, activeFilter === f.key && styles.filterTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => router.push('/(tabs)/profil')}
            activeOpacity={0.9}
          >
            <Text style={styles.premiumBannerIcon}>👑</Text>
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
                  <ResourceCard resource={r} unlocked={isResourceUnlocked(r)} onPlay={handlePlay} onOpenPdf={handleOpenPdf} />
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
              <Text style={styles.premiumTag}>👑</Text>
            </View>
            <View style={styles.grid}>
              {premiumResources.map(r => (
                <View key={r.id} style={styles.gridItem}>
                  <ResourceCard resource={r} unlocked={isResourceUnlocked(r)} onPlay={handlePlay} onOpenPdf={handleOpenPdf} />
                </View>
              ))}
            </View>
          </View>
        )}

        {filteredResources.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptyTxt}>
              Essaie un autre terme ou change le filtre.
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

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
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const CARD_WIDTH = (width - Spacing.xl * 2 - Spacing.sm) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h2, color: Colors.text.primary },
  offlineBadge: {
    backgroundColor: Colors.status.successBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  offlineTxt: { ...Typography.caption, color: Colors.status.success },

  searchArea: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchBarFocused: { borderColor: Colors.brand.gold },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  clearBtn: { fontSize: 14, color: Colors.text.muted, padding: Spacing.xs },

  filtersScroll: { marginBottom: Spacing.base, maxHeight: 44 },
  filtersContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    alignItems: 'center',
    height: 44,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
    height: 32,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.brand.gold,
    borderColor: Colors.brand.gold,
  },
  filterTxt: { ...Typography.label, color: Colors.text.muted, textTransform: 'none', letterSpacing: 0 },
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  gridItem: { width: CARD_WIDTH },

  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  cardLocked: { opacity: 0.85 },
  lockOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.brand.gold + '22',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 1,
  },
  lockIcon: { fontSize: 10 },
  lockTxt: { ...Typography.caption, color: Colors.brand.gold, fontSize: 10 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    height: 36,
    overflow: 'hidden',
  },
  typeIcon: {
    width: 36, height: 36, borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background.primary,
    flexShrink: 0,
  },
  typeIconTxt: { fontSize: 16 },
  badges: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
    overflow: 'hidden',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  typeBadgeTxt: { ...Typography.caption, fontSize: 10, fontWeight: '600' },
  pillarTag: { ...Typography.caption, color: Colors.text.muted, fontSize: 10 },
  downloadedBadge: {
    backgroundColor: Colors.status.successBg,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  downloadedTxt: { ...Typography.caption, color: Colors.status.success, fontSize: 10 },

  cardTitle: {
    ...Typography.bodySmall,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  textMuted: { color: Colors.text.muted },
  cardDesc: {
    ...Typography.caption,
    color: Colors.text.muted,
    lineHeight: 17,
    marginBottom: Spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metaTxt: { ...Typography.caption, color: Colors.text.muted, fontSize: 10 },

  cardCta: {
    backgroundColor: Colors.brand.gold,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  cardCtaLocked: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  cardCtaDownloaded: {
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.brand.gold,
  },
  cardCtaTxt: {
    ...Typography.caption,
    color: Colors.text.inverse,
    fontWeight: '700',
    fontSize: 11,
  },
  cardCtaTxtLocked: { color: Colors.text.muted },
  cardCtaTxtDownloaded: { color: Colors.brand.gold },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.sm },
  emptyTxt: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', lineHeight: 24 },
});
