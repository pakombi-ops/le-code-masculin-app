// src/components/ResourceCard.tsx
//
// Carte utilisée dans le listing de l'onglet Docs. Deux variantes :
// - featured: grande carte pleine largeur (première ressource "à la une")
// - standard: carte compacte (le gros du listing)
//
// Usage:
//   <ResourceCard resource={r} onPress={() => open(r)} onToggleSave={() => toggleSave(r.id)} />

import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { docsColors, docsTypography, docsRadius, docsSpacing, resourceBadgeStyle } from '../constants/docsDesignTokens';
import { Resource } from '../types/resource';

interface ResourceCardProps {
  resource: Resource;
  onPress: (resource: Resource) => void;
  onToggleSave?: (resource: Resource) => void;
}

// Icône + action du bouton en fonction du type de ressource
function getActionIcon(type: Resource['type']): keyof typeof MaterialIcons.glyphMap {
  switch (type) {
    case 'pdf':
    case 'ebook':
      return 'file-download';
    case 'template':
      return 'open-in-new';
    case 'audio':
    case 'podcast':
      return 'play-arrow';
    default:
      return 'file-download';
  }
}

export function ResourceCard({ resource, onPress, onToggleSave }: ResourceCardProps) {
  const badge = resourceBadgeStyle[resource.type] ?? { label: resource.type.toUpperCase(), gold: false };
  const isTemplate = resource.type === 'template';

  if (resource.isFeatured) {
    return (
      <Pressable style={styles.featuredCard} onPress={() => onPress(resource)}>
        <View style={styles.featuredText}>
          <View>
            <View style={styles.badgeRow}>
              <Badge label={badge.label} gold={badge.gold} />
              <Text style={styles.metaInline}>• {resource.meta}</Text>
            </View>
            <Text style={styles.featuredTitle}>{resource.title}</Text>
            <Text style={styles.description} numberOfLines={3}>
              {resource.description}
            </Text>
          </View>
          <View style={styles.actionRow}>
            <MaterialIcons name={getActionIcon(resource.type)} size={18} color={docsColors.primary} />
            <Text style={styles.actionLabel}>
              {resource.type === 'template' ? 'OUVRIR LE LIEN' : `TÉLÉCHARGER ${resource.type === 'ebook' ? 'EPUB' : ''}`.trim()}
            </Text>
          </View>
        </View>
        {resource.thumbnailUrl ? (
          <Image source={{ uri: resource.thumbnailUrl }} style={styles.featuredImage} />
        ) : (
          <View style={[styles.featuredImage, styles.placeholderFill]} />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={() => onPress(resource)}>
      <View style={styles.badgeRow}>
        <Badge label={badge.label} gold={badge.gold} />
        <Pressable hitSlop={8} onPress={() => onToggleSave?.(resource)}>
          <MaterialIcons
            name={resource.isSaved ? 'bookmark' : 'bookmark-border'}
            size={20}
            color={resource.isSaved ? docsColors.secondary : docsColors.onSurfaceVariant}
          />
        </Pressable>
      </View>

      {resource.thumbnailUrl ? (
        <Image source={{ uri: resource.thumbnailUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderFill]}>
          {isTemplate && <MaterialIcons name="table-chart" size={36} color={docsColors.outlineVariant} />}
        </View>
      )}

      <Text style={styles.title}>{resource.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {resource.description}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.metaLabel}>{resource.meta}</Text>
        <Pressable style={styles.actionButton} onPress={() => onPress(resource)}>
          <MaterialIcons name={getActionIcon(resource.type)} size={18} color={docsColors.onSurface} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function Badge({ label, gold }: { label: string; gold: boolean }) {
  return (
    <View style={[styles.badge, gold ? styles.badgeGold : styles.badgeNeutral]}>
      <Text style={[styles.badgeText, gold ? styles.badgeTextGold : styles.badgeTextNeutral]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Carte standard ---
  card: {
    backgroundColor: docsColors.surfaceContainer,
    borderRadius: docsRadius.lg,
    borderWidth: 1,
    borderColor: docsColors.surfaceContainerHigh,
    padding: docsSpacing.stackMd,
    marginBottom: docsSpacing.gutterGrid,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: docsSpacing.stackMd,
  },
  thumbnail: {
    height: 128,
    width: '100%',
    borderRadius: docsRadius.md,
    marginBottom: docsSpacing.stackMd,
    backgroundColor: docsColors.surfaceContainerHighest,
  },
  placeholderFill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...docsTypography.titleMd,
    color: docsColors.onSurface,
    marginBottom: docsSpacing.stackSm,
  },
  description: {
    ...docsTypography.bodySm,
    color: docsColors.onSurfaceVariant,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: docsSpacing.stackMd,
    paddingTop: docsSpacing.stackMd,
    borderTopWidth: 1,
    borderTopColor: docsColors.outlineVariant + '1A', // ~10% opacité
  },
  metaLabel: {
    ...docsTypography.labelCaps,
    color: docsColors.onSurfaceVariant,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: docsRadius.full,
    backgroundColor: docsColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Badge ---
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: docsRadius.sm,
  },
  badgeGold: {
    backgroundColor: docsColors.secondary + '33', // ~20% opacité
  },
  badgeNeutral: {
    backgroundColor: docsColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: docsColors.outlineVariant + '33',
  },
  badgeText: {
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  badgeTextGold: { color: docsColors.secondary },
  badgeTextNeutral: { color: docsColors.onSurface },

  // --- Carte featured ---
  featuredCard: {
    backgroundColor: docsColors.surfaceContainer,
    borderRadius: docsRadius.lg,
    borderWidth: 1,
    borderColor: docsColors.surfaceContainerHigh,
    marginBottom: docsSpacing.gutterGrid,
    overflow: 'hidden',
  },
  featuredText: {
    padding: docsSpacing.stackLg - 8,
    justifyContent: 'space-between',
  },
  featuredTitle: {
    ...docsTypography.headlineLgMobile,
    color: docsColors.primary,
    marginBottom: docsSpacing.stackSm,
  },
  featuredImage: {
    height: 180,
    width: '100%',
    backgroundColor: docsColors.surfaceContainerHigh,
  },
  metaInline: {
    ...docsTypography.labelCaps,
    color: docsColors.onSurfaceVariant,
    marginLeft: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: docsSpacing.stackMd,
  },
  actionLabel: {
    ...docsTypography.labelCaps,
    color: docsColors.primary,
  },
});
