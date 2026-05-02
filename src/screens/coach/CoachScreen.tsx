import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

// ── Config ────────────────────────────────────────────────────────────────────
// En développement : ton IP locale. En prod : URL du serveur déployé.
// Pour tester : remplace par l'IP de l'ordinateur dans le même réseau
// Ex: 'http://192.168.1.42:3001'
const BACKEND_URL = 'https://lcm-backend-production-efd1.up.railway.app';

const FREE_MESSAGE_LIMIT = 10;

const SUGGESTIONS = [
  "Comment améliorer ma discipline au quotidien ?",
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

// ── Composants ────────────────────────────────────────────────────────────────

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

function SuggestionChips({ onSelect }: { onSelect: (s: string) => void }) {
  return (
    <View style={styles.chips}>
      {SUGGESTIONS.map((s, i) => (
        <TouchableOpacity key={i} style={styles.chip} onPress={() => onSelect(s)}>
          <Text style={styles.chipTxt} numberOfLines={1}>{s}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const isFreePlan = true; // TODO: connecter au store d'abonnement
  const canSend = !isLoading && input.trim().length > 0;
  const hasReachedLimit = isFreePlan && messagesUsed >= FREE_MESSAGE_LIMIT;

  // Message de bienvenue
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Qu'est-ce qui t'amène aujourd'hui ?\n\nDis-moi où tu en es — dans ta vie, dans ton Code. Je t'écoute.",
    }]);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

const sendMessage = async (text: string = input) => {
  const trimmed = text.trim();
  if (!trimmed || isLoading) return;

  if (hasReachedLimit) {
    setShowPaywall(true);
    return;
  }

  const userMsg: Message = {
    id: Date.now().toString(),
    role: 'user',
    content: trimmed,
  };

  const loadingMsg: Message = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: '...',
    isStreaming: true,
  };

  setMessages(prev => [...prev, userMsg, loadingMsg]);
  setInput('');
  setIsLoading(true);
  setMessagesUsed(n => n + 1);
  scrollToBottom();

  const loadingId = loadingMsg.id;

  try {
    const conversationHistory = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    const res = await fetch(`${BACKEND_URL}/api/chat-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: trimmed, conversationHistory }),
    });

    const data = await res.json();

    setMessages(prev => prev.map(m =>
      m.id === loadingId
        ? { ...m, content: data.response || data.error || 'Erreur.', isStreaming: false }
        : m
    ));


    } catch (err: any) {
    setMessages(prev => prev.map(m =>
      m.id === loadingId
        ? { ...m, content: `Erreur: ${err.message} | URL: ${BACKEND_URL}`, isStreaming: false }
        : m
    ));

  /*} catch (err: any) {
    setMessages(prev => prev.map(m =>
      m.id === loadingId
        ? { ...m, content: "Serveur inaccessible. Vérifie que le backend tourne et que l'IP est correcte dans BACKEND_URL.", isStreaming: false }
        : m
    ));*/
  } finally {
    setIsLoading(false);
    scrollToBottom();
  }
};


  /*const sendMessage = async (text: string = input) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    if (hasReachedLimit) {
      setShowPaywall(true);
      return;
    }

    // Ajouter le message utilisateur
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
    };

    const streamingId = (Date.now() + 1).toString();
    const streamingMsg: Message = {
      id: streamingId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, streamingMsg]);
    setInput('');
    setIsLoading(true);
    setMessagesUsed(n => n + 1);
    scrollToBottom();

    try {
      // Appel au backend avec SSE streaming
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      // Lecture du stream SSE
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                accumulated += data.token;
                setMessages(prev => prev.map(m =>
                  m.id === streamingId
                    ? { ...m, content: accumulated }
                    : m
                ));
                scrollToBottom();
              }
              if (data.done) {
                setMessages(prev => prev.map(m =>
                  m.id === streamingId
                    ? { ...m, isStreaming: false }
                    : m
                ));
              }
            } catch {}
          }
        }
      }

    } catch (err: any) {
      // Message d'erreur si le backend n'est pas démarré
      setMessages(prev => prev.map(m =>
        m.id === streamingId
          ? {
              ...m,
              content: err.message?.includes('fetch')
                ? "Le serveur Prince Johann n'est pas démarré. Lance le backend avec `npm run dev` dans le dossier lcm-backend."
                : "Une erreur s'est produite. Réessaie dans quelques instants.",
              isStreaming: false,
            }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };*/

  if (showPaywall) {
    return <PaywallScreen onBack={() => setShowPaywall(false)} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarTxt}>PJ</Text>
        </View>
        <View>
          <Text style={styles.headerName}>Prince Johann</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineTxt}>Coach IA</Text>
          </View>
        </View>
      </View>

      {/* Quota */}
      {isFreePlan && (
        <QuotaBanner
          used={messagesUsed}
          limit={FREE_MESSAGE_LIMIT}
          onUpgrade={() => setShowPaywall(true)}
        />
      )}

      {/* Messages */}
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
            <SuggestionChips onSelect={sendMessage} />
          ) : null
        }
      />

      {/* Zone de saisie */}
      <View style={styles.inputArea}>
        <TextInput
          ref={inputRef}
          style={[styles.input, hasReachedLimit && styles.inputDisabled]}
          placeholder={
            hasReachedLimit
              ? "Passe à Premium pour continuer..."
              : "Réponds à Prince Johann..."
          }
          placeholderTextColor={Colors.text.muted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!hasReachedLimit && !isLoading}
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!canSend || hasReachedLimit) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!canSend || hasReachedLimit}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator size="small" color={Colors.text.inverse} />
            : <Text style={styles.sendIcon}>→</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Paywall ───────────────────────────────────────────────────────────────────

function PaywallScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.paywall}>
      <TouchableOpacity style={styles.paywallBack} onPress={onBack}>
        <Text style={styles.paywallBackTxt}>←</Text>
      </TouchableOpacity>

      <View style={styles.paywallContent}>
        <Text style={styles.paywallCrown}>👑</Text>
        <Text style={styles.paywallTitle}>Continue avec Prince Johann</Text>
        <Text style={styles.paywallSub}>Tu as utilisé tes 10 messages offerts.</Text>

        {['Coaching illimité avec Prince Johann IA',
          'Les 12 piliers et 52 semaines débloqués',
          'Téléchargements hors-ligne inclus'].map((b, i) => (
          <View key={i} style={styles.benefit}>
            <Text style={styles.benefitIcon}>▸</Text>
            <Text style={styles.benefitTxt}>{b}</Text>
          </View>
        ))}

        <View style={styles.planCard}>
          <Text style={styles.planLabel}>PLAN ANNUEL</Text>
          <Text style={styles.planPrice}>8,25 €<Text style={styles.planPer}> / mois</Text></Text>
          <Text style={styles.planBilled}>99 € facturés annuellement · Économise 79 €</Text>
        </View>

        <TouchableOpacity style={styles.paywallCta}>
          <Text style={styles.paywallCtaTxt}>Essayer 7 jours GRATUIT →</Text>
        </TouchableOpacity>
        <Text style={styles.paywallNote}>Puis 99 €/an · Annulable à tout moment</Text>

        <View style={styles.testimonial}>
          <Text style={styles.testimonialTxt}>
            "En 3 semaines avec Prince Johann IA, j'ai enfin tenu mes engagements."
          </Text>
          <Text style={styles.testimonialAuthor}>— Thomas, 32 ans, Lyon</Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingTop: 56, paddingBottom: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center' },
  headerAvatarTxt: { ...Typography.label, color: Colors.text.inverse, letterSpacing: 1 },
  headerName: { ...Typography.h4, color: Colors.text.primary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#4CAF50' },
  onlineTxt: { ...Typography.caption, color: Colors.text.secondary },

  // Quota
  quotaBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: Colors.background.secondary, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  quotaLeft: { flex: 1 },
  quotaText: { ...Typography.caption, color: Colors.text.secondary, marginBottom: 4 },
  quotaTrack: { height: 3, backgroundColor: Colors.border.default, borderRadius: 2, overflow: 'hidden' },
  quotaFill: { height: 3, backgroundColor: Colors.brand.gold, borderRadius: 2 },
  upgradeBtn: { marginLeft: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: 4, backgroundColor: Colors.brand.gold, borderRadius: Radius.full },
  upgradeTxt: { ...Typography.caption, color: Colors.text.inverse, fontWeight: '700' },

  // Messages
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

  // Suggestions
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingTop: Spacing.xl },
  chip: { backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.default, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, maxWidth: width - 80 },
  chipTxt: { ...Typography.bodySmall, color: Colors.text.secondary },

  // Input
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border.subtle, backgroundColor: Colors.background.secondary },
  input: { flex: 1, ...Typography.body, color: Colors.text.primary, backgroundColor: Colors.background.tertiary, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border.default, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, maxHeight: 120 },
  inputDisabled: { opacity: 0.5 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.gold, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 20, color: Colors.text.inverse, fontWeight: '700' },

  // Paywall
  paywall: { flex: 1, backgroundColor: Colors.background.primary },
  paywallBack: { position: 'absolute', top: 56, left: Spacing.xl, zIndex: 10, padding: Spacing.sm },
  paywallBackTxt: { fontSize: 24, color: Colors.brand.gold },
  paywallContent: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: 100, alignItems: 'center' },
  paywallCrown: { fontSize: 48, marginBottom: Spacing.xl },
  paywallTitle: { ...Typography.h2, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing.sm },
  paywallSub: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing['2xl'] },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'flex-start', marginBottom: Spacing.sm },
  benefitIcon: { color: Colors.brand.gold, fontSize: 14 },
  benefitTxt: { ...Typography.body, color: Colors.text.primary },
  planCard: { width: '100%', backgroundColor: Colors.background.secondary, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.brand.gold, padding: Spacing.xl, marginVertical: Spacing['2xl'], alignItems: 'center' },
  planLabel: { ...Typography.labelSmall, color: Colors.brand.gold, marginBottom: Spacing.sm },
  planPrice: { ...Typography.number, color: Colors.text.primary },
  planPer: { ...Typography.h3, color: Colors.text.secondary },
  planBilled: { ...Typography.caption, color: Colors.text.muted, marginTop: Spacing.xs },
  paywallCta: { width: '100%', backgroundColor: Colors.brand.gold, borderRadius: Radius.lg, paddingVertical: Spacing.base + 2, alignItems: 'center', marginBottom: Spacing.sm },
  paywallCtaTxt: { ...Typography.button, color: Colors.text.inverse },
  paywallNote: { ...Typography.caption, color: Colors.text.muted, marginBottom: Spacing['2xl'] },
  testimonial: { width: '100%', borderLeftWidth: 2, borderLeftColor: Colors.brand.gold, paddingLeft: Spacing.md },
  testimonialTxt: { ...Typography.body, color: Colors.text.secondary, fontStyle: 'italic' },
  testimonialAuthor: { ...Typography.caption, color: Colors.text.muted, marginTop: Spacing.xs },
});
