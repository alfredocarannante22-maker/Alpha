import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AppUser, Note } from '../types';
import {
  subscribeToNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../services/notesService';

const NOTE_COLORS = [
  '#FFFFFF', '#FFF9C4', '#F8BBD0', '#E1BEE7',
  '#C8E6C9', '#B3E5FC', '#FFE0B2', '#F0F4C3',
];

interface Props {
  user: AppUser;
}

export default function NotesScreen({ user }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = subscribeToNotes(user.uid, (data) => {
      setNotes(data);
      setLoading(false);
    });
    return unsub;
  }, [user.uid]);

  const filtered = search
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  function openCreate() {
    setEditing(null);
    setTitle('');
    setContent('');
    setNoteColor(NOTE_COLORS[0]);
    setModalVisible(true);
  }

  function openEdit(note: Note) {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setNoteColor(note.color);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Attenzione', 'Scrivi almeno un titolo o un contenuto.');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (editing) {
        await updateNote(user.uid, editing.id, {
          title: title.trim(),
          content: content.trim(),
          color: noteColor,
        });
      } else {
        await createNote({
          title: title.trim(),
          content: content.trim(),
          color: noteColor,
          createdBy: user.uid,
          coupleId: user.coupleId || user.uid,
          tags: [],
          isPinned: false,
          createdAt: now,
          updatedAt: now,
        });
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(note: Note) {
    await updateNote(user.uid, note.id, { isPinned: !note.isPinned });
  }

  async function handleDelete(note: Note) {
    Alert.alert('Elimina nota', `Eliminare "${note.title || 'questa nota'}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: () => deleteNote(user.uid, note.id),
      },
    ]);
  }

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.noteCard, { backgroundColor: item.color || colors.surface }]}
      onPress={() => openEdit(item)}
    >
      <View style={styles.noteTopRow}>
        {item.title ? (
          <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
        ) : null}
        <View style={styles.noteActions}>
          <TouchableOpacity onPress={() => togglePin(item)} style={styles.noteAction}>
            <Ionicons
              name={item.isPinned ? 'pin' : 'pin-outline'}
              size={16}
              color={item.isPinned ? colors.primary : colors.textLight}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.noteAction}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      {item.content ? (
        <Text style={styles.noteContent} numberOfLines={4}>{item.content}</Text>
      ) : null}
      <Text style={styles.noteDate}>
        {new Date(item.updatedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Note personali</Text>
        <Text style={styles.headerSub}>Solo tu puoi vederle 🔒</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca nelle note..."
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyTitle}>{search ? 'Nessun risultato' : 'Nessuna nota'}</Text>
          <Text style={styles.emptyDesc}>
            {search ? 'Prova con un altro termine.' : 'Tocca + per aggiungere la tua prima nota.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          numColumns={2}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Annulla</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editing ? 'Modifica nota' : 'Nuova nota'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.primary} /> : (
                <Text style={styles.modalSave}>Salva</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.modalBody, { backgroundColor: noteColor }]}>
            <TextInput
              style={styles.noteTitleInput}
              placeholder="Titolo"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textLight}
            />
            <TextInput
              style={styles.noteContentInput}
              placeholder="Scrivi qui..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.colorPicker}>
            <Text style={styles.colorLabel}>Colore</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {NOTE_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c, borderColor: colors.border },
                    noteColor === c && styles.colorDotSelected,
                  ]}
                  onPress={() => setNoteColor(c)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  grid: { padding: 8 },
  noteCard: {
    flex: 1,
    margin: 6,
    borderRadius: 14,
    padding: 14,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  noteTitle: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  noteActions: { flexDirection: 'row', gap: 6 },
  noteAction: { padding: 2 },
  noteContent: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, flex: 1 },
  noteDate: { fontSize: 11, color: colors.textLight, marginTop: 8 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: { fontSize: 16, color: colors.textSecondary },
  modalTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  modalSave: { fontSize: 16, fontWeight: '700', color: colors.primary },
  modalBody: { flex: 1, padding: 20 },
  noteTitleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  noteContentInput: { fontSize: 16, color: colors.text, flex: 1, lineHeight: 24 },
  colorPicker: {
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  colorLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 10, fontWeight: '600' },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1.5,
  },
  colorDotSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
});
