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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AppUser, Expense, ExpenseCategory, RecurringInterval } from '../types';
import {
  subscribeToExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../services/expensesService';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Cibo',
  housing: 'Casa',
  transport: 'Trasporti',
  health: 'Salute',
  entertainment: 'Svago',
  clothing: 'Abbigliamento',
  education: 'Istruzione',
  utilities: 'Bollette',
  subscriptions: 'Abbonamenti',
  other: 'Altro',
};

const CATEGORY_ICONS: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  food: 'fast-food-outline',
  housing: 'home-outline',
  transport: 'car-outline',
  health: 'medkit-outline',
  entertainment: 'game-controller-outline',
  clothing: 'shirt-outline',
  education: 'school-outline',
  utilities: 'flash-outline',
  subscriptions: 'repeat-outline',
  other: 'ellipsis-horizontal-outline',
};

const RECURRING_LABELS: Record<RecurringInterval, string> = {
  daily: 'Giornaliero',
  weekly: 'Settimanale',
  monthly: 'Mensile',
  yearly: 'Annuale',
};

interface Props {
  user: AppUser;
}

type FilterTab = 'all' | 'recurring' | 'mine';

export default function ExpensesScreen({ user }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'other' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringInterval: 'monthly' as RecurringInterval,
    recurringEndDate: '',
    splitBetween: true,
    notes: '',
  });

  const coupleId = user.coupleId || user.uid;

  useEffect(() => {
    const unsub = subscribeToExpenses(coupleId, (data) => {
      setExpenses(data);
      setLoading(false);
    });
    return unsub;
  }, [coupleId]);

  const filtered = expenses.filter((e) => {
    if (filter === 'recurring') return e.isRecurring;
    if (filter === 'mine') return e.paidBy === user.uid;
    return true;
  });

  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMine = expenses.filter((e) => e.paidBy === user.uid).reduce((s, e) => s + e.amount, 0);
  const totalRecurring = expenses
    .filter((e) => e.isRecurring && e.recurringInterval === 'monthly')
    .reduce((s, e) => s + e.amount, 0);

  function openCreate() {
    setEditing(null);
    setForm({
      title: '',
      amount: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringInterval: 'monthly',
      recurringEndDate: '',
      splitBetween: true,
      notes: '',
    });
    setModalVisible(true);
  }

  function openEdit(exp: Expense) {
    setEditing(exp);
    setForm({
      title: exp.title,
      amount: String(exp.amount),
      category: exp.category,
      date: exp.date.split('T')[0],
      isRecurring: exp.isRecurring,
      recurringInterval: exp.recurringInterval || 'monthly',
      recurringEndDate: exp.recurringEndDate || '',
      splitBetween: exp.splitBetween,
      notes: exp.notes || '',
    });
    setModalVisible(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { Alert.alert('Attenzione', 'Inserisci un titolo.'); return; }
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Attenzione', 'Inserisci un importo valido.'); return; }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data: Omit<Expense, 'id'> = {
        title: form.title.trim(),
        amount: amt,
        category: form.category,
        date: form.date,
        isRecurring: form.isRecurring,
        recurringInterval: form.isRecurring ? form.recurringInterval : undefined,
        recurringEndDate: form.isRecurring && form.recurringEndDate ? form.recurringEndDate : undefined,
        splitBetween: form.splitBetween,
        notes: form.notes.trim(),
        coupleId,
        paidBy: user.uid,
        paidByName: user.displayName,
        createdAt: now,
        updatedAt: now,
      };
      if (editing) {
        await updateExpense(coupleId, editing.id, data);
      } else {
        await createExpense(data);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exp: Expense) {
    Alert.alert('Elimina spesa', `Eliminare "${exp.title}"?`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => deleteExpense(coupleId, exp.id) },
    ]);
  }

  const renderExpense = ({ item }: { item: Expense }) => {
    const isMe = item.paidBy === user.uid;
    const dotColor = isMe ? colors.husband : colors.wife;
    return (
      <TouchableOpacity
        style={styles.expenseCard}
        onPress={() => openEdit(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={[styles.catIcon, { backgroundColor: dotColor + '20' }]}>
          <Ionicons name={CATEGORY_ICONS[item.category]} size={20} color={dotColor} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{item.title}</Text>
          <View style={styles.expenseMeta}>
            <Text style={styles.expenseCategory}>{CATEGORY_LABELS[item.category]}</Text>
            {item.isRecurring && (
              <View style={styles.recurringBadge}>
                <Ionicons name="repeat" size={11} color={colors.primary} />
                <Text style={styles.recurringText}>{RECURRING_LABELS[item.recurringInterval!]}</Text>
              </View>
            )}
            <Text style={styles.expenseDate}>
              {new Date(item.date + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
          <Text style={styles.expensePaidBy}>
            {isMe ? 'Pagato da te' : `Pagato da ${item.paidByName}`}
            {item.splitBetween ? ' · Diviso' : ''}
          </Text>
        </View>
        <Text style={[styles.expenseAmount, { color: dotColor }]}>€{item.amount.toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Spese</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>Totale</Text>
          <Text style={styles.summaryAmount}>€{totalAll.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.husband }]}>
          <Text style={styles.summaryLabel}>Le tue</Text>
          <Text style={styles.summaryAmount}>€{totalMine.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.accent }]}>
          <Text style={styles.summaryLabel}>Ricorrenti/mese</Text>
          <Text style={styles.summaryAmount}>€{totalRecurring.toFixed(2)}</Text>
        </View>
      </ScrollView>

      <View style={styles.filterRow}>
        {(['all', 'recurring', 'mine'] as FilterTab[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Tutte' : f === 'recurring' ? 'Ricorrenti' : 'Le mie'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💸</Text>
          <Text style={styles.emptyTitle}>Nessuna spesa</Text>
          <Text style={styles.emptyDesc}>Tocca + per aggiungere una spesa.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderExpense}
          contentContainerStyle={{ padding: 16 }}
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
            <Text style={styles.modalTitle}>{editing ? 'Modifica spesa' : 'Nuova spesa'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.primary} /> : (
                <Text style={styles.modalSave}>Salva</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.titleInput}
              placeholder="Descrizione spesa"
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
              autoFocus
            />
            <View style={styles.amountRow}>
              <Text style={styles.currency}>€</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={form.amount}
                onChangeText={(v) => setForm({ ...form, amount: v })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.field}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Data (AAAA-MM-GG)"
                value={form.date}
                onChangeText={(v) => setForm({ ...form, date: v })}
              />
            </View>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons name="repeat-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.switchText}>Spesa ricorrente</Text>
              </View>
              <Switch
                value={form.isRecurring}
                onValueChange={(v) => setForm({ ...form, isRecurring: v })}
                trackColor={{ true: colors.primary }}
              />
            </View>
            {form.isRecurring && (
              <>
                <Text style={styles.sectionLabel}>Frequenza</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {(Object.keys(RECURRING_LABELS) as RecurringInterval[]).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, form.recurringInterval === r && styles.chipActive]}
                      onPress={() => setForm({ ...form, recurringInterval: r })}
                    >
                      <Text style={[styles.chipText, form.recurringInterval === r && styles.chipTextActive]}>
                        {RECURRING_LABELS[r]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.field}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Data fine ricorrenza (opz.)"
                    value={form.recurringEndDate}
                    onChangeText={(v) => setForm({ ...form, recurringEndDate: v })}
                  />
                </View>
              </>
            )}
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.switchText}>Divisa tra voi due</Text>
              </View>
              <Switch
                value={form.splitBetween}
                onValueChange={(v) => setForm({ ...form, splitBetween: v })}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <Text style={styles.sectionLabel}>Categoria</Text>
            <View style={styles.categoryGrid}>
              {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, form.category === cat && styles.catBtnActive]}
                  onPress={() => setForm({ ...form, category: cat })}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[cat]}
                    size={18}
                    color={form.category === cat ? colors.white : colors.textSecondary}
                  />
                  <Text style={[styles.catBtnText, form.category === cat && styles.catBtnTextActive]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.field}>
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.fieldInput}
                placeholder="Note aggiuntive (opz.)"
                value={form.notes}
                onChangeText={(v) => setForm({ ...form, notes: v })}
                multiline
              />
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
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  summaryRow: { paddingHorizontal: 12, paddingVertical: 16 },
  summaryCard: { borderRadius: 16, padding: 16, marginHorizontal: 6, minWidth: 130 },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: colors.white, marginTop: 4 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: colors.surfaceAlt },
  filterTabActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: colors.white, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyDesc: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  expenseCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 14, padding: 14, marginBottom: 10,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  catIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  expenseMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  expenseCategory: { fontSize: 12, color: colors.textSecondary },
  recurringBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primary + '15', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  recurringText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  expenseDate: { fontSize: 12, color: colors.textLight },
  expensePaidBy: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  expenseAmount: { fontSize: 17, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10,
  },
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
  titleInput: {
    fontSize: 20, fontWeight: '600', color: colors.text,
    borderBottomWidth: 1.5, borderBottomColor: colors.border, paddingVertical: 12, marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    borderBottomWidth: 1.5, borderBottomColor: colors.border, paddingBottom: 12,
  },
  currency: { fontSize: 32, fontWeight: '700', color: colors.primary, marginRight: 8 },
  amountInput: { fontSize: 32, fontWeight: '700', color: colors.text, flex: 1 },
  field: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  fieldInput: { flex: 1, fontSize: 15, color: colors.text },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  switchLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchText: { fontSize: 15, color: colors.text },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textSecondary,
    marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  chipRow: { marginBottom: 8 },
  chip: { backgroundColor: colors.surfaceAlt, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontWeight: '600' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceAlt, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  catBtnActive: { backgroundColor: colors.primary },
  catBtnText: { fontSize: 13, color: colors.textSecondary },
  catBtnTextActive: { color: colors.white, fontWeight: '600' },
});
