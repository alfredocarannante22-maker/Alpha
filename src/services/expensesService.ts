import { ref, push, update, remove, onValue, off, Unsubscribe } from 'firebase/database';
import { db } from './firebase';
import { Expense } from '../types';

export function subscribeToExpenses(
  coupleId: string,
  callback: (expenses: Expense[]) => void
): Unsubscribe {
  const expRef = ref(db, `expenses/${coupleId}`);

  const listener = onValue(expRef, (snap) => {
    const expenses: Expense[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        expenses.push({ id: child.key!, ...(child.val() as Omit<Expense, 'id'>) });
      });
      expenses.sort((a, b) => b.date.localeCompare(a.date));
    }
    callback(expenses);
  });

  return () => off(expRef, 'value', listener);
}

export async function createExpense(expense: Omit<Expense, 'id'>): Promise<string> {
  const newRef = await push(ref(db, `expenses/${expense.coupleId}`), expense);
  return newRef.key!;
}

export async function updateExpense(
  coupleId: string,
  id: string,
  data: Partial<Expense>
): Promise<void> {
  await update(ref(db, `expenses/${coupleId}/${id}`), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteExpense(coupleId: string, id: string): Promise<void> {
  await remove(ref(db, `expenses/${coupleId}/${id}`));
}
