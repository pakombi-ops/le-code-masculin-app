import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { getJournalEntries, saveJournalEntry, updateJournalEntry, deleteJournalEntry } from '../../services/supabase';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  pillar_id: number | null;
  created_at: string;
}

export default function JournalScreen() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await getJournalEntries(user.id);
    setEntries(data ?? []);
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleSave = async () => {
    if (!user?.id || !title.trim() || !content.trim()) {
      Alert.alert('Champs requis', 'Ajoute un titre et un contenu à ton entrée.');
      return;
    }
    setSaving(true);

    const { error } = editingId
      ? await updateJournalEntry(editingId, { title: title.trim(), content: content.trim() })
      : await saveJournalEntry({ userId: user.id, title: title.trim(), content: content.trim() });

    setSaving(false);

    if (error) {
      Alert.alert('Erreur', "Impossible d'enregistrer ton entrée pour le moment.");
      return;
    }

    setTitle('');
    setContent('');
    setEditingId(null);
    setModalVisible(false);
    loadEntries();
  };

  const handleEdit = (entry: JournalEntry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setEditingId(entry.id);
    setSelectedEntry(null);
    setModalVisible(true);
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert(
      'Supprimer cette entrée',
      'Cette action est irréversible. Es-tu sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer', style: 'destructive',
          onPress: async () => {
            const { error } = await deleteJournalEntry(entry.id);
            if (error) {
              Alert.alert('Erreur', 'Impossible de supprimer cette entrée.');
              return;
            }
            setSelectedEntry(null);
            loadEntries();
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Journal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.newEntryBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.newEntryBtnTxt}>+ Nouvelle entrée</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator color={Colors.brand.gold} style={{ marginTop: Spacing.xl }} />
          ) : entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>Ton journal est vide</Text>
              <Text style={styles.emptyTxt}>
                Écris ta première entrée pour commencer à documenter ton parcours.
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => setSelectedEntry(entry)}
                activeOpacity={0.8}
              >
                <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Text style={styles.entryContent} numberOfLines={4}>{entry.content}</Text>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>

      {/* Modal — nouvelle entrée */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Modifier l\'entrée' : 'Nouvelle entrée'}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Titre"
              placeholderTextColor={Colors.text.muted}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Écris ce que tu as sur le cœur..."
              placeholderTextColor={Colors.text.muted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.modalButton} onPress={handleSave} disabled={saving}>
              <Text style={styles.modalButtonText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal — lecture d'une entrée */}
      <Modal visible={!!selectedEntry} transparent animationType="fade" onRequestClose={() => setSelectedEntry(null)}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {selectedEntry && (
        <>
          <Text style={styles.entryDate}>{formatDate(selectedEntry.created_at)}</Text>
          <Text style={styles.modalTitle}>{selectedEntry.title}</Text>
          <ScrollView style={{ maxHeight: 350, marginBottom: Spacing.lg }}>
            <Text style={styles.entryContent}>{selectedEntry.content}</Text>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
            <TouchableOpacity
              style={[styles.modalButton, { flex: 1, backgroundColor: Colors.background.tertiary }]}
              onPress={() => handleEdit(selectedEntry)}
            >
              <Text style={[styles.modalButtonText, { color: Colors.text.primary }]}>✏️ Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { flex: 1, backgroundColor: Colors.status.errorBg }]}
              onPress={() => handleDelete(selectedEntry)}
            >
              <Text style={[styles.modalButtonText, { color: Colors.status.error }]}>🗑 Supprimer</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <TouchableOpacity onPress={() => setSelectedEntry(null)}>
        <Text style={styles.modalCancel}>Fermer</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  backBtn: { width: 40, padding: Spacing.xs },
  backArrow: { fontSize: 22, color: Colors.brand.gold },
  headerTitle: { ...Typography.h4, color: Colors.text.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  newEntryBtn: {
    backgroundColor: Colors.brand.gold, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.xl,
  },
  newEntryBtnTxt: { ...Typography.button, color: Colors.text.inverse },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.sm },
  emptyTxt: { ...Typography.body, color: Colors.text.secondary, textAlign: 'center', lineHeight: 24 },
  entryCard: {
    backgroundColor: Colors.background.secondary, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border.default,
    padding: Spacing.base, marginBottom: Spacing.md,
  },
  entryDate: { ...Typography.caption, color: Colors.text.muted, marginBottom: Spacing.xs },
  entryTitle: { ...Typography.h4, color: Colors.text.primary, marginBottom: Spacing.xs },
  entryContent: { ...Typography.body, color: Colors.text.secondary, lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.xl, paddingBottom: Spacing['3xl'],
  },
  modalTitle: { ...Typography.h3, color: Colors.text.primary, marginBottom: Spacing.lg },
  modalInput: {
    backgroundColor: Colors.background.tertiary, borderRadius: Radius.md,
    padding: Spacing.md, color: Colors.text.primary, marginBottom: Spacing.md,
  },
  modalTextarea: { minHeight: 140 },
  modalButton: {
    backgroundColor: Colors.brand.gold, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.md,
  },
  modalButtonText: { ...Typography.button, color: Colors.text.inverse },
  modalCancel: { ...Typography.body, color: Colors.text.muted, textAlign: 'center' },
});
