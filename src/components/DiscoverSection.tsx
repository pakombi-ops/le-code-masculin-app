import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Newspaper, Mic } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useDiscoverPicks } from '../hooks/useDiscoverPicks';



export function DiscoverSection() {
  const { items, isLoading } = useDiscoverPicks();

  if (isLoading || items.length === 0) return null;

  return (
    <View style={{ marginTop: Spacing.xl }}>
      <Text style={styles.sectionTitle}>À découvrir</Text>
      <View style={{ gap: Spacing.sm }}>
        {items.map((item) => {
          const Icon = item.type === 'podcast' ? Mic : Newspaper;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
                            onPress={() => router.push({ pathname: '/(tabs)/bibliotheque', params: { openId: item.id } })}
              activeOpacity={0.85}
            >
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Icon size={20} color={Colors.brand.gold} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.typeLabel}>{item.type === 'podcast' ? 'PODCAST' : 'ARTICLE'}</Text>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...Typography.label, color: Colors.text.secondary, marginBottom: Spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.background.secondary, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.sm,
  },
  thumb: { width: 56, height: 56, borderRadius: Radius.md },
  thumbFallback: { backgroundColor: Colors.background.tertiary, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { ...Typography.caption, color: Colors.brand.gold, fontWeight: '700', marginBottom: 2 },
  title: { ...Typography.body, color: Colors.text.primary },
});