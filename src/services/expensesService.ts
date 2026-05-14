import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Expense } from '../types';

const COL = 'expenses';

export function subscribeToExpenses(
  coupleId: string,
  callback: (expenses: Expense[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COL),
    where('coupleId', '==', coupleId),
    orderBy('date', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const expenses: Expense[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Expense, 'id'>),
    }));
    callback(expenses);
  });
}

export async function createExpense(expense: Omit<Expense, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), expense);
  return ref.id;
}

export async function updateExpense(id: string, data: Partial<Expense>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
