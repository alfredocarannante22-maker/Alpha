import { rtdbGet, rtdbPush, rtdbUpdate, rtdbDelete } from './rtdb';
import { Expense } from '../types';

export async function fetchExpenses(coupleId: string): Promise<Expense[]> {
  const data = await rtdbGet(`expenses/${coupleId}`);
  if (!data) return [];
  return Object.entries(data).map(([id, val]: any) => ({ id, ...val }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function createExpense(expense: Omit<Expense, 'id'>): Promise<string> {
  return rtdbPush(`expenses/${expense.coupleId}`, expense);
}

export async function updateExpense(coupleId: string, id: string, data: Partial<Expense>): Promise<void> {
  await rtdbUpdate(`expenses/${coupleId}/${id}`, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteExpense(coupleId: string, id: string): Promise<void> {
  await rtdbDelete(`expenses/${coupleId}/${id}`);
}
