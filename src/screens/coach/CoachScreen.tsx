import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useAuthStore, selectCanUseAI, selectRemainingMessages } from '../../store/authStore';
import { saveMessage, incrementAiMessages, getConversationHistory } from '../../services/supabase';

const { width } = Dimensions.get('window');
const BACKEND_URL = 'https://lcm-backend-production-efd1.up.railway.app';
const FREE_MESSAGE_LIMIT = 10;

const SUGGESTIONS = [
  "Comment améliorer ma discipline ?",
  "J'ai du mal à tenir mes engagements",
  "Comment être plus présent avec ma famille ?",
  "Je manque de courage dans ma vie pro",
  "Comment trouver mon but dans la vie ?",
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

function QuotaBanner({ used, limit, onUpgrade }: { used: number; limit: number; onUpgrade: () => void }) {
  if (used >= limit) return null;
  const remaining = limit - used;
  const progress = used / limit;
  return (
    <View style={styles.quotaBanner}>
      <View style={styles.quotaLeft}>
        <Text style={styles.quotaText}>💬 {used} / {limit} messages utilisés</Text>
        <View style={styles.quotaTrack}>
          <View style={[styles.quotaFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
      {remaining <= 3 && (
        <TouchableOpacity onPress={onUpgrade} style={styles.upgradeBtn}>
          <Text style={styles.upgradeTxt}>Premium →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleWrapper, isUser && styles.bubbleWrapperUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>PJ</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleTxt, isUser && styles.bubbleTxtUser]}>
          {message.content}
          {message.isStreaming && <Text style={styles.cursor}>▌</Text>}
        </Text>
      </View>
    </View>
  );
}

export default function CoachScreen() {
  const { user, aiQuota } = useAuthStore();
  const isPremium = aiQuota?.is_premium ?? false;

  // Compteur local — démarre depuis le quota Supabase ou 0
  const [localUsed, setLocalUsed] = useState(aiQuota?.messages_used ?? 0);

  const hasReachedLimit = !isPremium && localUsed >= FREE_MESSAGE_LIMIT;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) {
        setLoadingHistory(false);
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Qu'est-ce qui t'amène aujourd'hui ?\n\nDis-moi où tu en es — dans ta vie, dans ton Code. Je t'écoute.",
        }]);
        return;
      }
      const { data } = await getConversationHistory(user.id, 20);
      if (data && data.length > 0) {
        setMessages(data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })));
      } else {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Qu'est-ce qui t'amène aujourd'hui ?\n\nDis-moi où tu en es — dans ta vie, dans ton Code. Je t'écoute.",
        }]);
      }
      setLoadingHistory(false);
    };
    loadHistory();
  }, [user?.id]);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async (text: string = input) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    if (hasReachedLimit) {
      router.push('/paywall');
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
    const loadingId = (Date.now() + 1).toString();
    const loadingMsg: Message = { id: loadingId, role: 'assistant', content: '...', isStreaming: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    // Incrémenter le compteur local immédiatement
    setLocalUsed(prev => prev + 1);

// Synchroniser le store pour l'accueil et le profil
useAuthStore.setState(state => ({
  aiQuota: state.aiQuota
    ? { ...state.aiQuota, messages_used: (state.aiQuota.messages_used ?? 0) + 1 }
    : { messages_used: 1, is_premium: false },
}));

    // Sauvegarder dans Supabase en arrière-plan
    if (user?.id) {
      saveMessage(user.id, 'user', trimmed);
      incrementAiMessages(user.id);
    }

    try {
      const conversationHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${BACKEND_URL}/api/chat-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: conversationHistory,
        }),
      });

      if (!response.ok) throw new Error(`Erreur ${response.status}`);

      const data = await response.json();
      const replyText = data.response || "Je n'ai pas pu répondre.";

      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: replyText, isStreaming: false }
          : m
      ));

      // Sauvegarder la réponse dans Supabase
      if (user?.id) {
        saveMessage(user.id, 'assistant', replyText);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: 'Une erreur est survenue. Réessaie.', isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
      
  };

  if (loadingHistory) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.brand.gold} />
        <Text style={styles.loadingTxt}>Chargement de la conversation...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarTxt}>PJ</Text>
        </View>
        <View>
          <Text style={styles.headerName}>Prince Johann</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineTxt}>Coach IA · Basé sur Le Code Masculin</Text>
          </View>
        </View>
      </View>

      {!isPremium && (
        <QuotaBanner
          used={localUsed}
          limit={FREE_MESSAGE_LIMIT}
          onUpgrade={() => router.push('/paywall')}
        />
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          messages.length <= 1 ? (
            <View style={styles.chips}>
              {SUGGESTIONS.map((s, i) => (
                <TouchableOpacity key={i} style={styles.chip} onPress={() => sendMessage(s)}>
                  <Text style={styles.chipTxt} numberOfLines={1}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
      />

      <View style={styles.inputArea}>
        <TextInput
          style={[styles.input, (hasReachedLimit || isLoading) && styles.inputDisabled]}
          placeholder={hasReachedLimit ? "10 messages utilisés — Passe à Premium" : "Réponds à Prince Johann..."}
          placeholderTextColor={Colors.text.muted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!hasReachedLimit && !isLoading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || hasReachedLimit || isLoading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || hasReachedLimit || isLoading}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator size="small" color={Colors.text.inverse} />
            : <Text style={styles.sendIcon}>→</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  loadingContainer: { flex: 1, backgroundColor: Colors.background.primary, alignItems: 'center', justifyContent: 'center', gap: Spacing.base },
  loadingTxt: { ...Typography.body, color: Colors.text.muted },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingTop: 56, paddingBottom: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center' },
  headerAvatarTxt: { ...Typography.label, color: Colors.text.inverse, letterSpacing: 1 },
  headerName: { ...Typography.h4, color: Colors.text.primary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' },
  onlineTxt: { ...Typography.caption, color: Colors.text.secondary },
  quotaBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: Colors.background.secondary, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  quotaLeft: { flex: 1 },
  quotaText: { ...Typography.caption, color: Colors.text.secondary, marginBottom: 4 },
  quotaTrack: { height: 3, backgroundColor: Colors.border.default, borderRadius: 2, overflow: 'hidden' },
  quotaFill: { height: 3, backgroundColor: Colors.brand.gold, borderRadius: 2 },
  upgradeBtn: { marginLeft: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: 4, backgroundColor: Colors.brand.gold, borderRadius: Radius.full },
  upgradeTxt: { ...Typography.caption, color: Colors.text.inverse, fontWeight: '700' },
  messageList: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.xl, gap: Spacing.base },
  bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, maxWidth: '90%' },
  bubbleWrapperUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  avatarTxt: { fontSize: 10, fontWeight: '700', color: Colors.brand.gold },
  bubble: { borderRadius: Radius.lg, padding: Spacing.base, maxWidth: width * 0.72 },
  bubbleUser: { backgroundColor: Colors.brand.gold },
  bubbleAssistant: { backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default },
  bubbleTxt: { ...Typography.body, color: Colors.text.primary, lineHeight: 24 },
  bubbleTxtUser: { color: Colors.text.inverse },
  cursor: { color: Colors.brand.gold, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingTop: Spacing.xl },
  chip: { backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, maxWidth: width - 80 },
  chipTxt: { ...Typography.bodySmall, color: Colors.text.secondary },
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border.subtle, backgroundColor: Colors.background.secondary },
  input: { flex: 1, ...Typography.body, color: Colors.text.primary, backgroundColor: Colors.background.tertiary, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border.default, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, maxHeight: 120 },
  inputDisabled: { opacity: 0.5 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 20, color: Colors.text.inverse, fontWeight: '700' },
});
