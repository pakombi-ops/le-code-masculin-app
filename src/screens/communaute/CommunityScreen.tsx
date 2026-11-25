import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MessageCircle, Shield, Plus } from 'lucide-react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { fetchPosts, CommunityPost } from '../../services/communityService';
import { useAuthStore } from '../../store/authStore';

const PILLAR_TAGS = [
  'Force Physique',
  'Discipline',
  'Leadership',
  'Vulnérabilité Stratégique',
  'But',
  'Honneur',
  'Présence',
  'Stoïcisme',
  'Générosité',
  'Courage',
  'Authenticité',
  'Héritage',
]; // 12 piliers — synchronisé avec src/constants/pillars.ts

export default function CommunityScreen() {
  const isPremium = useAuthStore((s) => s.aiQuota?.is_premium ?? false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Écran entièrement verrouillé — contrairement au Mandala/Tracker (freemium
  // visible, action bloquée), la communauté n'est ni lisible ni écrivable
  // sans abonnement actif. isPremium reflète l'entitlement en temps réel :
  // si l'abonnement s'arrête, la redirection s'applique dès la prochaine
  // fois que l'homme revient sur cet écran.
  useFocusEffect(
    useCallback(() => {
      if (!isPremium) {
        router.replace('/feature-info/communaute');
      }
    }, [isPremium])
  );

  const load = useCallback(async (filter?: string) => {
    try {
      setError(null);
      const data = await fetchPosts(filter);
      setPosts(data);
    } catch (e) {
      setError("Impossible de charger le fil. Vérifie ta connexion.");
    }
  }, []);

  useEffect(() => {
    if (!isPremium) return;
    setLoading(true);
    load(activeFilter).finally(() => setLoading(false));
  }, [activeFilter, load, isPremium]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(activeFilter);
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: CommunityPost }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/post-detail', params: { postId: item.id } })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.pseudonym, item.is_founder && styles.founderName]}>
          {item.pseudonym}
        </Text>
        {item.is_founder && (
          <View style={styles.founderBadge}>
            <Shield size={12} color={Colors.text.inverse} />
            <Text style={styles.founderBadgeText}>Fondateur</Text>
          </View>
        )}
      </View>

      {item.pillar_tag && (
        <View style={styles.pillarTag}>
          <Text style={styles.pillarTagText}>{item.pillar_tag}</Text>
        </View>
      )}

      <Text style={styles.content} numberOfLines={4}>
        {item.content}
      </Text>

      <View style={styles.cardFooter}>
        <MessageCircle size={14} color={Colors.text.muted} />
        <Text style={styles.replyCount}>
          {item.reply_count === 0
            ? 'Aucune réponse — sois le premier'
            : `${item.reply_count} réponse${item.reply_count > 1 ? 's' : ''}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!isPremium) {
    return (
      <SafeScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.brand.gold} size="large" />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, !activeFilter && styles.filterChipActive]}
          onPress={() => setActiveFilter(undefined)}
        >
          <Text style={[styles.filterText, !activeFilter && styles.filterTextActive]}>
            Tout
          </Text>
        </TouchableOpacity>
        {PILLAR_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.filterChip, activeFilter === tag && styles.filterChipActive]}
            onPress={() => setActiveFilter(tag)}
          >
            <Text style={[styles.filterText, activeFilter === tag && styles.filterTextActive]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.brand.gold} size="large" />
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Aucun post pour l'instant. Sois le premier à partager.
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.gold} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/nouveau-post')}
        activeOpacity={0.85}
      >
        <Plus size={24} color={Colors.text.inverse} />
      </TouchableOpacity>
    </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: Colors.background.primary },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginBottom: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.brand.gold, borderColor: Colors.brand.gold },
  filterText: { ...Typography.caption, color: Colors.text.muted },
  filterTextActive: { color: Colors.text.inverse, fontWeight: '600' },
  list: { padding: Spacing.base, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  pseudonym: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  founderName: { color: Colors.brand.gold },
  founderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.gold,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginLeft: Spacing.sm,
    gap: 4,
  },
  founderBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.text.inverse },
  pillarTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginBottom: Spacing.sm,
  },
  pillarTagText: { ...Typography.caption, color: Colors.brand.gold, fontWeight: '600' },
  content: { ...Typography.bodySmall, color: Colors.text.secondary },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: 6 },
  replyCount: { ...Typography.caption, color: Colors.text.muted },
  loader: { marginTop: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.text.muted, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
