import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CalendarView from '../components/calendar/CalendarView';
import { colors } from '../theme/colors';
import { AppUser, CalendarEvent, EventCategory } from '../types';
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../services/calendarService';

const CATEGORY_LABELS: Record<EventCategory, string> = {
  personal: 'Personale',
  work: 'Lavoro',
  family: 'Famiglia',
  health: 'Salute',
  travel: 'Viaggio',
  birthday: 'Compleanno',
  anniversary: 'Anniversario',
  other: 'Altro',
};

const CATEGORY_ICONS: Record<EventCategory, keyof typeof Ionicons.glyphMap> = {
  personal: 'person-outline',
  work: 'briefcase-outline',
  family: 'home-outline',
  health: 'heart-outline',
  travel: 'airplane-outline',
  birthday: 'gift-outline',
  anniversary: 'rose-outline',
  other: 'ellipsis-horizontal-outline',
};

interface Props {
  user: AppUser;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  allDay: true,
  color: colors.primary,
  category: 'personal' as EventCategory,
  location: '',
};

export default function CalendarScreen({ user }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const coupleId = user.coupleId || user.uid;

  const loadData = useCallback(async () => {
    try {
      const evts = await fetchEvents(coupleId);
      setEvents(evts);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coupleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const markedDates = useCallback(() => {
    const marks: Record<string, any> = {};
    events.forEach((ev) => {
      const date = ev.startDate.split('T')[0];
      if (!marks[date]) marks[date] = { dots: [] };
      marks[date].dots.push({
        color: ev.createdBy === user.uid ? colors.husband : colors.wife,
      });
    });
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = colors.primary;
    } else {
      marks[selectedDate] = { selected: true, selectedColor: colors.primary };
    }
    return marks;
  }, [events, selectedDate, user.uid]);

  const dayEvents = events.filter((ev) => ev.startDate.split('T')[0] === selectedDate);

  function openCreate() {
    setEditingEvent(null);
    setForm({ ...EMPTY_FORM, startDate: selectedDate });
    setModalVisible(true);
  }

  function openEdit(ev: CalendarEvent) {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description || '',
      startDate: ev.startDate.split('T')[0],
      endDate: ev.endDate ? ev.endDate.split('T')[0] : '',
      allDay: ev.allDay,
      color: ev.color,
      category: ev.category,
      location: ev.location || '',
    });
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      Alert.alert('Attenzione', 'Inserisci un titolo.');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        allDay: form.allDay,
        color: form.color,
        category: form.category,
        location: form.location.trim(),
        coupleId,
        createdBy: user.uid,
        createdByName: user.displayName,
        updatedAt: now,
      };
      if (editingEvent) {
        await updateEvent(coupleId, editingEvent.id, data);
      } else {
        await createEvent({ ...data, createdAt: now } as any);
      }
      setModalVisible(false);
      await loadData();
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ev: CalendarEvent) {
    Alert.alert('Elimina evento', `Eliminare "${ev.title}"?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          await deleteEvent(coupleId, ev.id);
          await loadData();
        },
      },
    ]);
  }

  const eventColor = (ev: CalendarEvent) =>
    ev.createdBy === user.uid ? colors.husband : colors.wife;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendario</Text>
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: colors.husband }]} />
          <Text style={styles.legendText}>Tu</Text>
          <View style={[styles.dot, { backgroundColor: colors.wife }]} />
          <Text style={styles.legendText}>Partner</Text>
        </View>
      </View>

      <CalendarView
        onDayPress={(dateStr) => setSelectedDate(dateStr)}
        markedDates={markedDates()}
        selectedDate={selectedDate}
      />

      <View style={styles.daySection}>
        <View style={styles.daySectionHeader}>
          <Text style={styles.dayTitle}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : dayEvents.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyText}>Nessun evento 🎉</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); loadData(); }}
              />
            }
          >
            {dayEvents.map((ev) => (
              <TouchableOpacity
                key={ev.id}
                style={[styles.eventCard, { borderLeftColor: eventColor(ev) }]}
                onPress={() => openEdit(ev)}
                onLongPress={() => handleDelete(ev)}
              >
                <View style={styles.eventRow}>
                  <Ionicons name={CATEGORY_ICONS[ev.category]} size={16} color={eventColor(ev)} />
                  <Text style={styles.eventTitle}>{ev.title}</Text>
                </View>
                {ev.description ? (
                  <Text style={styles.eventDesc} numberOfLines={1}>{ev.description}</Text>
                ) : null}
                {ev.location ? (
                  <View style={styles.eventMeta}>
                    <Ionicons name="location-outline" size={12} color={colors.textLight} />
                    <Text style={styles.eventMetaText}>{ev.location}</Text>
                  </View>
                ) : null}
                <Text style={styles.eventCreator}>
                  {ev.createdBy === user.uid ? 'Tu' : ev.createdByName}
                  {' · '}{CATEGORY_LABELS[ev.category]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Annulla</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingEvent ? 'Modifica evento' : 'Nuovo evento'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.primary} /> : (
                <Text style={styles.modalSave}>Salva</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.titleInput}
              placeholder="Titolo evento"
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
              autoFocus
            />
            <View style={styles.field}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Data inizio (AAAA-MM-GG)"
                value={form.startDate}
                onChangeText={(v) => setForm({ ...form, startDate: v })}
              />
            </View>
            <View style={styles.field}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Data fine (opzionale)"
                value={form.endDate}
                onChangeText={(v) => setForm({ ...form, endDate: v })}
              />
            </View>
            <View style={styles.field}>
              <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Luogo (opzionale)"
                value={form.location}
                onChangeText={(v) => setForm({ ...form, location: v })}
              />
            </View>
            <View style={styles.field}>
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.fieldInput, { height: 80 }]}
                placeholder="Note..."
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                multiline
              />
            </View>

            <Text style={styles.sectionLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, form.category === cat && styles.catChipActive]}
                  onPress={() => setForm({ ...form, category: cat })}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[cat]}
                    size={14}
                    color={form.category === cat ? colors.white : colors.textSecondary}
                  />
                  <Text style={[styles.catText, form.category === cat && styles.catTextActive]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textSecondary },
  calendar: { borderBottomWidth: 1, borderBottomColor: colors.border },
  daySection: { flex: 1, padding: 16 },
  daySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: { fontSize: 15, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  addBtn: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDay: { alignItems: 'center', paddingTop: 30 },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  eventDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  eventMetaText: { fontSize: 12, color: colors.textLight },
  eventCreator: { fontSize: 11, color: colors.textLight, marginTop: 6 },
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
  modalBody: { padding: 20 },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    marginBottom: 20,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  fieldInput: { flex: 1, fontSize: 15, color: colors.text },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  catRow: { marginBottom: 20 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  catChipActive: { backgroundColor: colors.primary },
  catText: { fontSize: 13, color: colors.textSecondary },
  catTextActive: { color: colors.white, fontWeight: '600' },
});
