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
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { TodoList, TodoItem } from '../types';

export function subscribeToLists(
  coupleId: string,
  callback: (lists: TodoList[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'todoLists'),
    where('coupleId', '==', coupleId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const lists: TodoList[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<TodoList, 'id'>),
    }));
    callback(lists);
  });
}

export function subscribeToItems(
  listId: string,
  callback: (items: TodoItem[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'todoItems'),
    where('listId', '==', listId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const items: TodoItem[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<TodoItem, 'id'>),
    }));
    callback(items);
  });
}

export async function createList(list: Omit<TodoList, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'todoLists'), list);
  return ref.id;
}

export async function deleteList(listId: string): Promise<void> {
  await deleteDoc(doc(db, 'todoLists', listId));
}

export async function createItem(item: Omit<TodoItem, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'todoItems'), item);
  return ref.id;
}

export async function toggleItem(item: TodoItem, uid: string): Promise<void> {
  await updateDoc(doc(db, 'todoItems', item.id), {
    isCompleted: !item.isCompleted,
    completedBy: !item.isCompleted ? uid : null,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'todoItems', itemId));
}

export async function updateListTimestamp(listId: string): Promise<void> {
  await updateDoc(doc(db, 'todoLists', listId), {
    updatedAt: new Date().toISOString(),
  });
}
