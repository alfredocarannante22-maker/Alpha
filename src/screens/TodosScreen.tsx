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
import { AppUser, TodoList, TodoItem } from '../types';
import {
  subscribeToLists,
  subscribeToItems,
  createList,
  deleteList,
  createItem,
  toggleItem,
  deleteItem,
} from '../services/todosService';

const LIST_EMOJIS = ['🛒', '🏠', '💊', '📚', '🎮', '✈️', '🎁', '🐶', '🌿', '⚡'];
const LIST_COLORS = [
  colors.primary, colors.secondary, colors.accent, colors.warning,
  colors.info, '#A29BFE', '#FD79A8', '#00CEC9',
];

interface Props {
  user: AppUser;
}

export default function TodosScreen({ user }: Props) {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<TodoList | null>(null);
  const [items, setItems] = useState<TodoItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [newListModal, setNewListModal] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [listEmoji, setListEmoji] = useState(LIST_EMOJIS[0]);
  const [listColor, setListColor] = useState(LIST_COLORS[0]);
  const [savingList, setSavingList] = useState(false);

  const [newItemText, setNewItemText] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  const coupleId = user.coupleId || user.uid;

  useEffect(() => {
    const unsub = subscribeToLists(coupleId, (data) => {
      setLists(data);
      setLoading(false);
    });
    return unsub;
  }, [coupleId]);

  useEffect(() => {
    if (!selectedList) return;
    setItemsLoading(true);
    const unsub = subscribeToItems(coupleId, selectedList.id, (data) => {
      setItems(data);
      setItemsLoading(false);
    });
    return unsub;
  }, [selectedList, coupleId]);

  async function handleCreateList() {
    if (!listTitle.trim()) { Alert.alert('Attenzione', 'Dai un nome alla lista.'); return; }
    setSavingList(true);
    try {
      const now = new Date().toISOString();
      await createList({
        title: listTitle.trim(),
        emoji: listEmoji,
        color: listColor,
        coupleId,
        createdBy: user.uid,
        isShared: true,
        createdAt: now,
        updatedAt: now,
      });
      setNewListModal(false);
      setListTitle('');
      setListEmoji(LIST_EMOJIS[0]);
      setListColor(LIST_COLORS[0]);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setSavingList(false);
    }
  }

  async function handleAddItem() {
    if (!newItemText.trim() || !selectedList) return;
    setAddingItem(true);
    try {
      const now = new Date().toISOString();
      await createItem({
        listId: selectedList.id,
        text: newItemText.trim(),
        isCompleted: false,
        coupleId,
        createdBy: user.uid,
        createdAt: now,
        updatedAt: now,
      });
      setNewItemText('');
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setAddingItem(false);
    }
  }

  async function handleDeleteList(list: TodoList) {
    Alert.alert('Elimina lista', `Eliminare "${list.title}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive',
        onPress: async () => {
          if (selectedList?.id === list.id) setSelectedList(null);
          await deleteList(coupleId, list.id);
        },
      },
    ]);
  }

  const pending = items.filter((i) => !i.isCompleted);
  const done = items.filter((i) => i.isCompleted);

  const renderItem = (item: TodoItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.todoItem, item.isCompleted && styles.todoItemDone]}
      onPress={() => toggleItem(coupleId, selectedList!.id, item, user.uid)}
      onLongPress={() => {
        Alert.alert('Elimina', `Eliminare "${item.text}"?`, [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Elimina', style: 'destructive', onPress: () => deleteItem(coupleId, selectedList!.id, item.id) },
        ]);
      }}
    >
      <View style={[
        styles.checkbox,
        item.isCompleted && {
          backgroundColor: selectedList?.color || colors.primary,
          borderColor: selectedList?.color || colors.primary,
        },
      ]}>
        {item.isCompleted && <Ionicons name="checkmark" size={14} color={colors.white} />}
      </View>
      <Text style={[styles.todoText, item.isCompleted && styles.todoTextDone]}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {selectedList ? (
          <TouchableOpacity onPress={() => setSelectedList(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {selectedList ? `${selectedList.emoji} ${selectedList.title}` : 'Liste'}
          </Text>
          {!selectedList && (
            <Text style={styles.headerSub}>{lists.length} liste condivise</Text>
          )}
        </View>
        {!selectedList && (
          <TouchableOpacity
            style={[styles.addListBtn, { backgroundColor: colors.primary }]}
            onPress={() => setNewListModal(true)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.addListBtnText}>Lista</Text>
          </TouchableOpacity>
        )}
      </View>

      {!selectedList ? (
        loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : lists.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Nessuna lista</Text>
            <Text style={styles.emptyDesc}>Crea la tua prima lista condivisa.</Text>
          </View>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.listCard, { borderTopColor: item.color }]}
                onPress={() => setSelectedList(item)}
                onLongPress={() => handleDeleteList(item)}
              >
                <Text style={styles.listEmoji}>{item.emoji}</Text>
                <Text style={styles.listTitle}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        )
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.addItemBar}>
            <TextInput
              style={styles.addItemInput}
              placeholder="Aggiungi elemento..."
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addItemBtn, { backgroundColor: selectedList.color }]}
              onPress={handleAddItem}
              disabled={addingItem || !newItemText.trim()}
            >
              {addingItem ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Ionicons name="add" size={22} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>

          {itemsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {pending.length === 0 && done.length === 0 ? (
                <View style={styles.emptyItems}>
                  <Text style={styles.emptyItemsText}>Lista vuota. Aggiungi qualcosa! 👆</Text>
                </View>
              ) : null}
              {pending.map(renderItem)}
              {done.length > 0 && (
                <>
                  <Text style={styles.doneLabel}>Completati ({done.length})</Text>
                  {done.map(renderItem)}
                </>
              )}
            </ScrollView>
          )}
        </View>
      )}

      <Modal visible={newListModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setNewListModal(false)}>
              <Text style={styles.modalCancel}>Annulla</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nuova lista</Text>
            <TouchableOpacity onPress={handleCreateList} disabled={savingList}>
              {savingList ? <ActivityIndicator color={colors.primary} /> : (
                <Text style={styles.modalSave}>Crea</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={[styles.listPreview, { borderTopColor: listColor }]}>
              <Text style={styles.previewEmoji}>{listEmoji}</Text>
              <Text style={styles.previewTitle}>{listTitle || 'Nome lista'}</Text>
            </View>
            <TextInput
              style={styles.listNameInput}
              placeholder="Nome della lista"
              value={listTitle}
              onChangeText={setListTitle}
              autoFocus
            />
            <Text style={styles.sectionLabel}>Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
              {LIST_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, listEmoji === e && styles.emojiBtnActive]}
                  onPress={() => setListEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.sectionLabel}>Colore</Text>
            <View style={styles.colorRow}>
              {LIST_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, listColor === c && styles.colorDotActive]}
                  onPress={() => setListColor(c)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 56, paddingBottom: 16, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  addListBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  addListBtnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  grid: { padding: 10 },
  listCard: {
    flex: 1, margin: 6, backgroundColor: colors.surface, borderRadius: 14,
    padding: 16, borderTopWidth: 4, elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, minHeight: 100,
  },
  listEmoji: { fontSize: 30, marginBottom: 8 },
  listTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  addItemBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  addItemInput: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text,
  },
  addItemBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  todoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface,
    borderRadius: 12, padding: 14, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3,
  },
  todoItemDone: { opacity: 0.6 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  todoText: { fontSize: 15, color: colors.text, flex: 1 },
  todoTextDone: { textDecorationLine: 'line-through', color: colors.textLight },
  doneLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textSecondary,
    marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  emptyItems: { alignItems: 'center', paddingTop: 40 },
  emptyItemsText: { color: colors.textSecondary, fontSize: 15 },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 56, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalCancel: { fontSize: 16, color: colors.textSecondary },
  modalTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  modalSave: { fontSize: 16, fontWeight: '700', color: colors.primary },
  modalBody: { padding: 20 },
  listPreview: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 20,
    borderTopWidth: 4, alignItems: 'center', marginBottom: 24,
  },
  previewEmoji: { fontSize: 40, marginBottom: 8 },
  previewTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  listNameInput: {
    fontSize: 18, fontWeight: '600', color: colors.text,
    borderBottomWidth: 1.5, borderBottomColor: colors.border, paddingVertical: 12, marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textSecondary,
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  emojiRow: { marginBottom: 20 },
  emojiBtn: { padding: 10, borderRadius: 12, marginRight: 8, backgroundColor: colors.surfaceAlt },
  emojiBtnActive: { backgroundColor: colors.primary + '20', borderWidth: 2, borderColor: colors.primary },
  emojiText: { fontSize: 26 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  colorDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: colors.text, transform: [{ scale: 1.15 }] },
});
