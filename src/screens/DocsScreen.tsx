// src/screens/DocsScreen.tsx
//
// Écran "Lectures & Outils" (onglet Docs). Remplace `MOCK_RESOURCES`
// par ton fetch Supabase (table `resources` par ex., colonnes proches
// de src/types/resource.ts).

import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { docsColors, docsTypography, docsSpacing, docsRadius } from '../constants/docsDesignTokens';
import { ResourceCard } from '../components/ResourceCard';
import { Resource, ResourceType } from '../types/resource';

type FilterKey = 'all' | ResourceType;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'TOUT' },
  { key: 'ebook', label: 'EBOOKS' },
  { key: 'pdf', label: 'PDF' },
  { key: 'audio', label: 'AUDIO' },
  { key: 'podcast', label: 'PODCASTS' },
  { key: 'template', label: 'TEMPLATES' },
];

// --- Données de démo — à remplacer par tes vraies ressources ---
const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    type: 'ebook',
    title: 'Le Système Stoïcien',
    description:
      "Un guide complet pour appliquer la philosophie ancienne à des environnements de haute performance modernes.",
    thumbnailUrl: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0',
    meta: '45 MIN DE LECTURE',
    isFeatured: true,
  },
  {
    id: '2',
    type: 'pdf',
    title: 'Checklist Protocole Matinal',
    description: "Un PDF d'une page définissant les 90 premières minutes optimales pour une concentration durable.",
    thumbnailUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db',
    meta: '1.2 MB',
  },
  {
    id: '3',
    type: 'template',
    title: 'Matrice de Revue Trimestrielle',
    description: 'Template Notion pour évaluer tes métriques pro et perso sur des cycles de 90 jours.',
    meta: 'LIEN NOTION',
  },
  {
    id: '4',
    type: 'audio',
    title: 'Méditation — Ancrage du Guerrier',
    description: 'Une séance audio guidée de 12 minutes pour retrouver ton centre avant une journée exigeante.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0',
    meta: '12 MIN',
  },
  {
    id: '5',
    type: 'podcast',
    title: 'Épisode 14 — Discipline et Clarté Mentale',
    description: "L'épisode du podcast Pilier Conscient sur la construction d'une discipline qui tient dans le temps.",
    thumbnailUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618',
    meta: '45 MIN',
  },
  {
    id: '6',
    type: 'pdf',
    title: 'Exercices de Recadrage Cognitif',
    description: 'Des fiches conçues pour identifier et démonter systématiquement les croyances limitantes.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1441829266145-1a3a0fefa9a4',
    meta: '3.4 MB',
    isSaved: true,
  },
];

export function DocsScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filteredResources = useMemo(() => {
    if (activeFilter === 'all') return MOCK_RESOURCES;
    return MOCK_RESOURCES.filter((r) => r.type === activeFilter);
  }, [activeFilter]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredResources}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.headerTitle}>Lectures & Outils</Text>
            <Text style={styles.headerSubtitle}>
              Accède à des ressources premium, des workbooks pratiques et des analyses pour affûter ta clarté.
            </Text>

            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={(f) => f.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
              renderItem={({ item }) => {
                const active = item.key === activeFilter;
                return (
                  <Pressable
                    style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}
                    onPress={() => setActiveFilter(item.key)}
                  >
                    <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{item.label}</Text>
                  </Pressable>
                );
              }}
            />
          </>
        }
        renderItem={({ item }) => (
          <ResourceCard
            resource={item}
            onPress={(r) => {
              // TODO: brancher sur l'action réelle (téléchargement / lecteur audio / lien externe)
              console.log('open resource', r.id);
            }}
            onToggleSave={(r) => {
              // TODO: brancher sur ta mutation Supabase pour les favoris
              console.log('toggle save', r.id);
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: docsColors.background,
  },
  listContent: {
    paddingHorizontal: docsSpacing.marginPage,
    paddingTop: docsSpacing.stackLg,
    paddingBottom: 120, // laisse la place à la tab bar
  },
  headerTitle: {
    ...docsTypography.headlineLgMobile,
    color: docsColors.primary,
    marginBottom: docsSpacing.stackSm,
  },
  headerSubtitle: {
    ...docsTypography.bodyLg,
    color: docsColors.onSurfaceVariant,
    marginBottom: docsSpacing.stackLg,
  },
  filterRow: {
    gap: docsSpacing.stackSm,
    paddingBottom: docsSpacing.stackLg,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: docsRadius.full,
    borderWidth: 1,
  },
  filterChipActive: {
    borderColor: docsColors.secondary,
    backgroundColor: docsColors.secondary + '1A',
  },
  filterChipInactive: {
    borderColor: docsColors.outlineVariant,
    backgroundColor: 'transparent',
  },
  filterLabel: {
    ...docsTypography.labelCaps,
    color: docsColors.onSurfaceVariant,
  },
  filterLabelActive: {
    color: docsColors.secondary,
  },
});
