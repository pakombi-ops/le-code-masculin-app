import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import {
  RESOURCES, RESOURCE_TYPES, getTypeIcon, getTypeLabel,
  type Resource, type ResourceType,
} from '../../constants/resources';
import { getPillarById } from '../../constants/pillars';

const { width } = Dimensions.get('window');
const IS_PREMIUM = false; // TODO: connecter au store d'abonnement

// ── Carte Ressource ───────────────────────────────────────────────────────────

function ResourceCard({ resource }: { resource: Resource }) {
  const [downloaded, setDownloaded] = useState(resource.isDownloaded ?? false);
  const [downloading, setDownloading] = useState(false);

  const pillar = resource.pillarId ? getPillarById(resource.pillarId) : null;
  const isLocked = resource.access === 'premium' && !IS_PREMIUM;
  const icon = getTypeIcon(resource.type);
  const typeLabel = getTypeLabel(resource.type);
  const accentColor = pillar?.color ?? Colors.brand.gold;

  const handleAction = () => {
    if (isLocked) {
      Alert.alert(
        '👑 Contenu Premium',
        'Passe à l\'abonnement Premium pour accéder à cette ressource.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Voir les plans', style: 'default',
            onPress: () => Alert.alert('Premium', 'Fonctionnalité paiement bientôt disponible.') },
        ]
      );
      return;
    }

    if (downloaded) {
      Alert.alert('Ouvrir', `Ouverture de "${resource.title}"...`);
      return;
    }

    // Simuler téléchargement
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      Alert.alert('✅ Téléchargé', `"${resource.title}" est maintenant disponible hors-ligne.`);
    }, 1500);
  };

  return (
    <View style={[styles.card, isLocked && styles.cardLocked]}>
      {/* Overlay verrouillé */}
      {isLocked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>👑</Text>
          <Text style={styles.lockTxt}>Premium</Text>
        </View>
      )}

      {/* Header carte */}
      <View style={styles.cardHeader}>
        {/* Icône type */}
        <View style={[styles.typeIcon, { borderColor: isLocked ? Colors.border.default : accentColor }]}>
          <Text style={styles.typeIconTxt}>{icon}</Text>
        </View>

        {/* Badge type + pilier */}
        <View style={styles.badges}>
          <View style={[styles.typeBadge, { backgroundColor: isLocked ? Colors.background.tertiary : accentColor + '22', borderColor: isLocked ? Colors.border.default : accentColor }]}>
            <Text style={[styles.typeBadgeTxt, { color: isLocked ? Colors.text.muted : accentColor }]}>
              {typeLabel}
            </Text>
          </View>
          {pillar && (
            <Text style={styles.pillarTag} numberOfLines={1} >Pilier {pillar.id}</Text>
          )}
        </View>

        {/* Statut téléchargement */}
        {downloaded && !isLocked && (
          <View style={styles.downloadedBadge}>
            <Text style={styles.downloadedTxt}>✓ Offline</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <Text style={[styles.cardTitle, isLocked && styles.textMuted]}>
        {resource.title}
      </Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {resource.description}
      </Text>

      {/* Métadonnées */}
      <View style={styles.cardMeta}>
        {resource.duration && (
          <Text style={styles.metaTxt}>⏱ {resource.duration}</Text>
        )}
        {resource.pages && (
          <Text style={styles.metaTxt}>📃 {resource.pages} pages</Text>
        )}
        {resource.fileSize && (
          <Text style={styles.metaTxt}>💾 {resource.fileSize}</Text>
        )}
      </View>

      {/* CTA */}
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
            ? '🔒 Débloquer avec Premium'
            : downloading
              ? '⏳ Téléchargement...'
              : downloaded
                ? '▶ Ouvrir'
                : '📥 Télécharger'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function BibliothequeScreen() {
  const [activeFilter, setActiveFilter] = useState<ResourceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredResources = RESOURCES.filter(r => {
    const matchType = activeFilter === 'all' || r.type === activeFilter;
    const matchSearch = searchQuery === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const freeResources = filteredResources.filter(r => r.access === 'free');
  const premiumResources = filteredResources.filter(r => r.access === 'premium');
  const downloadedCount = RESOURCES.filter(r => r.isDownloaded).length;

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bibliothèque</Text>
        {downloadedCount > 0 && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineTxt}>📥 {downloadedCount} hors-ligne</Text>
          </View>
        )}
      </View>

      {/* ── Barre de recherche ── */}
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

      {/* ── Filtres ── */}
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

      {/* ── Liste des ressources ── */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* Banner Premium si pas abonné */}
        {!IS_PREMIUM && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => Alert.alert('Premium', 'Fonctionnalité paiement bientôt disponible.')}
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

        {/* Section gratuite */}
        {freeResources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {IS_PREMIUM ? 'Toutes les ressources' : 'Ressources gratuites'}
              <Text style={styles.sectionCount}> · {freeResources.length}</Text>
            </Text>
            <View style={styles.grid}>
              {freeResources.map(r => (
                <View key={r.id} style={styles.gridItem}>
                  <ResourceCard resource={r} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section premium */}
        {!IS_PREMIUM && premiumResources.length > 0 && (
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
                  <ResourceCard resource={r} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
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
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD_WIDTH = (width - Spacing.xl * 2 - Spacing.sm) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  // Header
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

  // Recherche
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

  // Filtres
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

  /*filtersScroll: { marginBottom: Spacing.base },
  filtersContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.secondary,
  },*/
  filterChipActive: {
    backgroundColor: Colors.brand.gold,
    borderColor: Colors.brand.gold,
  },
  filterTxt: { ...Typography.label, color: Colors.text.muted, textTransform: 'none', letterSpacing: 0 },
  filterTxtActive: { color: Colors.text.inverse },

  // Scroll
  scroll: { flex: 1 },

  // Premium banner
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

  // Sections
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

  // Grille 2 colonnes
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  gridItem: { width: CARD_WIDTH },

  // Carte
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
  /*cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },*/
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
  /*badges: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  typeBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },*/
  typeBadgeTxt: { ...Typography.caption, fontSize: 10, fontWeight: '600' },
  pillarTag: { 
  ...Typography.caption, 
  color: Colors.text.muted, 
  fontSize: 10,
  numberOfLines: 1,
},
  /*pillarTag: { ...Typography.caption, color: Colors.text.muted, fontSize: 10 },
  downloadedBadge: {
    backgroundColor: Colors.status.successBg,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },*/
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

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.sm },
  emptyTxt: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', lineHeight: 24 },
});
