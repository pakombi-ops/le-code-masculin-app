import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Shield, Flag, Send } from 'lucide-react-native';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import {
  fetchPostWithReplies,
  createReply,
  reportContent,
  CommunityPost,
  CommunityReply,
} from '../../services/communityService';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const { post, replies } = await fetchPostWithReplies(postId);
      setPost(post);
      setReplies(replies);
    } catch {
      Alert.alert('Erreur', "Impossible de charger ce post.");
    }
  }, [postId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await createReply(postId, replyText.trim());
      setReplyText('');
      await load();
    } catch {
      Alert.alert('Erreur', "La réponse n'a pas pu être envoyée.");
    } finally {
      setSending(false);
    }
  };

  const handleReport = (targetType: 'post' | 'reply', targetId: string) => {
    Alert.alert(
      'Signaler ce contenu',
      'Un contenu signalé par plusieurs hommes est automatiquement masqué. Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signaler',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportContent(targetType, targetId);
              Alert.alert('Merci', 'Ton signalement a été enregistré.');
            } catch {
              Alert.alert('Erreur', 'Le signalement a échoué.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brand.gold} size="large" />
        </View>
      </SafeScreen>
    );
  }

  if (!post) {
    return (
      <SafeScreen>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Ce post n'existe plus.</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <FlatList
        style={styles.flatList}
        data={replies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.postCard}>
            <View style={styles.header}>
              <Text style={[styles.pseudonym, post.is_founder && styles.founderName]}>
                {post.pseudonym}
              </Text>
              {post.is_founder && (
                <View style={styles.founderBadge}>
                  <Shield size={12} color={Colors.text.inverse} />
                  <Text style={styles.founderBadgeText}>Fondateur</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => handleReport('post', post.id)}
              >
                <Flag size={16} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>
            {post.pillar_tag && (
              <View style={styles.pillarTag}>
                <Text style={styles.pillarTagText}>{post.pillar_tag}</Text>
              </View>
            )}
            <Text style={styles.content}>{post.content}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.replyCard}>
            <View style={styles.header}>
              <Text style={[styles.pseudonym, item.is_founder && styles.founderName]}>
                {item.pseudonym}
              </Text>
              {item.is_founder && (
                <View style={styles.founderBadge}>
                  <Shield size={12} color={Colors.text.inverse} />
                  <Text style={styles.founderBadgeText}>Fondateur</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() => handleReport('reply', item.id)}
              >
                <Flag size={16} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.content}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aucune réponse encore. Les autres hommes verront ce post — une réponse peut arriver à
            tout moment.
          </Text>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Écris ta réponse..."
          placeholderTextColor={Colors.text.muted}
          value={replyText}
          onChangeText={setReplyText}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendReply}
          disabled={sending || !replyText.trim()}
        >
          <Send size={18} color={Colors.text.inverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  flatList: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.primary },
  list: { padding: Spacing.base, paddingBottom: Spacing.xl },
  postCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  replyCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  pseudonym: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
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
  reportButton: { marginLeft: 'auto', padding: 4 },
  pillarTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginBottom: Spacing.sm,
  },
  pillarTagText: { ...Typography.caption, color: Colors.brand.gold, fontWeight: '600' },
  content: { ...Typography.body, color: Colors.text.secondary, lineHeight: 20 },
  emptyText: { ...Typography.bodySmall, color: Colors.text.muted, textAlign: 'center', marginTop: 20, paddingHorizontal: 20 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    color: Colors.text.primary,
    maxHeight: 100,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
