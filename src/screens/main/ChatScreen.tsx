import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ChatStackParamList, ChatMessage } from '../../types';
import { Colors, Typography, Spacing, Radii } from '../../theme';
import SafeScreen from '../../components/layout/SafeScreen';
import { useAppStore } from '../../store/useAppStore';

type Nav = StackNavigationProp<ChatStackParamList, 'ChatHome'>;

const SUGGESTIONS = [
  "Comment développer ma discipline ?",
  "Je manque de motivation",
  "Comment être plus présent ?",
  "Gérer la pression au travail",
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Bonjour. Je suis Prince Johann — ou plutôt, une version de lui entraînée sur l'ensemble du Code Masculin.\n\nDis-moi ce que tu traverses en ce moment. Sur quel pilier veux-tu travailler aujourd'hui ?",
  timestamp: new Date().toISOString(),
};

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleContainer, isUser && styles.bubbleContainerUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>PJ</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {message.isStreaming ? (
          <View style={styles.streamingContainer}>
            <Text style={styles.bubbleText}>{message.content}</Text>
            <View style={styles.streamingDots}>
              <ActivityIndicator size="small" color={Colors.gold.primary} />
            </View>
          </View>
        ) : (
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {message.content}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const { user, messages, addMessage, updateLastMessage, setChatLoading, isChatLoading, incrementAiMessages, openPaywall } = useAppStore();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const allMessages = messages.length === 0 ? [WELCOME_MESSAGE] : [WELCOME_MESSAGE, ...messages];
  const aiRemaining = user
    ? user.subscription.aiMessagesLimit - user.subscription.aiMessagesUsed
    : 0;
  const isPremium = user?.subscription.plan !== 'free';

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isChatLoading) return;

    // Vérifier le quota
    if (!isPremium && aiRemaining <= 0) {
      openPaywall('quota_exceeded');
      return;
    }

    setInput('');

    // Ajouter le message utilisateur
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setChatLoading(true);
    incrementAiMessages();

    // Ajouter un message vide de l'assistant (streaming)
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    addMessage(assistantMsg);

    // Scroll vers le bas
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      /**
       * INTÉGRATION CLAUDE API (Anthropic)
       *
       * TODO: Remplacer ce bloc par l'appel réel à ton backend
       * qui transmet la requête à l'API Claude.
       *
       * NE PAS appeler l'API Anthropic directement depuis le client mobile —
       * les clés API doivent rester côté serveur (Node.js + Supabase Edge Functions).
       *
       * Exemple d'appel backend:
       *
       * const response = await fetch('https://ton-backend.supabase.co/functions/v1/chat', {
       *   method: 'POST',
       *   headers: {
       *     'Content-Type': 'application/json',
       *     'Authorization': `Bearer ${supabaseSession.access_token}`,
       *   },
       *   body: JSON.stringify({
       *     messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
       *     userId: user.id,
       *   }),
       * });
       *
       * Pour le streaming:
       * const reader = response.body?.getReader();
       * while (true) {
       *   const { done, value } = await reader.read();
       *   if (done) break;
       *   const chunk = new TextDecoder().decode(value);
       *   updateLastMessage(accumulatedContent + chunk);
       * }
       */

      // SIMULATION — à remplacer par l'appel API réel
      await simulatePrinceJohannResponse(messageText, updateLastMessage, setChatLoading);

    } catch (error) {
      updateLastMessage("Une erreur est survenue. Réessaie dans un moment.");
      setChatLoading(false);
    }
  }, [input, isChatLoading, isPremium, aiRemaining]);

  return (
    <SafeScreen edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>PJ</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>Prince Johann</Text>
            <Text style={styles.headerSub}>Coach IA · Le Code Masculin</Text>
          </View>
        </View>

        {/* Quota banner */}
        {!isPremium && (
          <View style={styles.quotaBanner}>
            <View style={styles.quotaInfo}>
              <Text style={styles.quotaText}>
                {aiRemaining > 0 ? `${aiRemaining} message${aiRemaining > 1 ? 's' : ''} restant${aiRemaining > 1 ? 's' : ''}` : 'Quota atteint'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => openPaywall('quota_exceeded')}>
              <Text style={styles.quotaCta}>Passer Premium →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Suggestions (si pas de messages utilisateur) */}
        {messages.length === 0 && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => sendMessage(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Pose ta question à Prince Johann..."
            placeholderTextColor={Colors.text.tertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isChatLoading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isChatLoading}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

// ─────────────────────────────────────────
// SIMULATION (à remplacer par l'API Claude)
// ─────────────────────────────────────────
async function simulatePrinceJohannResponse(
  userMessage: string,
  updateLastMessage: (content: string) => void,
  setChatLoading: (value: boolean) => void,
) {
  const responses = [
    "La discipline n'est pas une question de motivation — c'est une question d'identité.\n\nQuand tu te définis comme un homme discipliné, tu n'as plus à décider si tu le fais ou non. La question ne se pose même plus.\n\nCommence par un seul engagement non négociable cette semaine. Qu'est-ce qui compte vraiment pour toi en ce moment ?",
    "C'est une question de gestion d'énergie, pas de volonté.\n\nLe soir, ton cortex préfrontal est épuisé après une journée de décisions. Voici ce que je recommande selon le Pilier 2 :\n\n▸ Identifie ton engagement le plus important de la journée\n▸ Exécute-le le matin, quand ton énergie est au maximum\n▸ Lie-le à une ancre existante (après le café, avant la douche)\n\nSur quel engagement spécifique tu veux travailler ?",
    "Avant de répondre directement à ta question, dis-moi : qu'est-ce que tu as essayé jusqu'ici ?\n\nOn ne construit pas une solution sur du vide. Je veux comprendre ton point de départ réel, pas une version idéalisée.",
  ];

  const response = responses[Math.floor(Math.random() * responses.length)];
  let accumulated = '';

  // Simuler le streaming token par token
  for (const char of response) {
    accumulated += char;
    updateLastMessage(accumulated);
    await new Promise((r) => setTimeout(r, 20));
  }

  setChatLoading(false);
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background.primary },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  headerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gold.subtle,
    borderWidth: 1.5, borderColor: Colors.gold.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: Colors.gold.primary, fontWeight: Typography.weight.bold, fontSize: Typography.size.sm },
  headerInfo: { flex: 1 },
  headerName: { ...Typography.styles.bodyBold },
  headerSub: { ...Typography.styles.caption, color: Colors.text.tertiary },
  quotaBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.screenPadding, marginTop: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.gold.border,
  },
  quotaInfo: { flex: 1 },
  quotaText: { ...Typography.styles.caption, color: Colors.text.secondary },
  quotaCta: { color: Colors.gold.primary, fontWeight: Typography.weight.semibold, fontSize: Typography.size.sm },
  messageList: { paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.base, gap: Spacing.lg },
  bubbleContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  bubbleContainerUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.gold.subtle,
    borderWidth: 1, borderColor: Colors.gold.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: Colors.gold.primary, fontSize: Typography.size.xs, fontWeight: Typography.weight.bold },
  bubble: {
    maxWidth: '80%', borderRadius: Radii.lg, padding: Spacing.base,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: Colors.gold.primary,
    borderColor: Colors.gold.primary,
    borderBottomRightRadius: Radii.xs,
  },
  bubbleAssistant: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.border.default,
    borderBottomLeftRadius: Radii.xs,
  },
  bubbleText: { ...Typography.styles.body, lineHeight: 22, color: Colors.text.secondary },
  bubbleTextUser: { color: Colors.text.onGold },
  streamingContainer: { gap: Spacing.sm },
  streamingDots: { flexDirection: 'row', alignItems: 'center' },
  suggestions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  suggestionText: { ...Typography.styles.caption, color: Colors.text.secondary },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border.default,
    backgroundColor: Colors.background.primary,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    color: Colors.text.primary, fontSize: Typography.size.base,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gold.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.background.tertiary },
  sendIcon: { color: Colors.text.onGold, fontSize: 18, fontWeight: Typography.weight.bold },
});
