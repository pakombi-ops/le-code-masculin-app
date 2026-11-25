import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { createPost } from '../../services/communityService';

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

export default function NewPostScreen() {
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await createPost(content.trim(), selectedTag);
      router.back();
    } catch {
      Alert.alert('Erreur', "Le post n'a pas pu être publié.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeScreen>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Pilier (optionnel)</Text>
      <View style={styles.tagRow}>
        {PILLAR_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
            onPress={() => setSelectedTag(selectedTag === tag ? undefined : tag)}
          >
            <Text style={[styles.tagText, selectedTag === tag && styles.tagTextActive]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Ton message</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Partage ton vécu, ta question, ce qui te pèse ou ce que tu as appris..."
        placeholderTextColor={Colors.text.muted}
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={2000}
      />
      <Text style={styles.counter}>{content.length}/2000</Text>

      <TouchableOpacity
        style={[styles.submitButton, (!content.trim() || sending) && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!content.trim() || sending}
      >
        {sending ? (
          <ActivityIndicator color={Colors.text.inverse} />
        ) : (
          <Text style={styles.submitText}>Publier</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  content: { padding: Spacing.xl },
  label: { ...Typography.label, color: Colors.text.primary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  tagChipActive: { backgroundColor: Colors.brand.gold, borderColor: Colors.brand.gold },
  tagText: { ...Typography.caption, color: Colors.text.muted },
  tagTextActive: { color: Colors.text.inverse, fontWeight: '600' },
  textArea: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    color: Colors.text.primary,
    ...Typography.body,
    minHeight: 160,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  counter: { ...Typography.caption, color: Colors.text.muted, textAlign: 'right', marginTop: 4 },
  submitButton: {
    backgroundColor: Colors.brand.gold,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { ...Typography.button, color: Colors.text.inverse },
});
