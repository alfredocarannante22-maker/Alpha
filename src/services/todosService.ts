import { ref, push, update, remove, onValue, off, Unsubscribe } from 'firebase/database';
import { db } from './firebase';
import { TodoList, TodoItem } from '../types';

export function subscribeToLists(
  coupleId: string,
  callback: (lists: TodoList[]) => void
): Unsubscribe {
  const listsRef = ref(db, `todoLists/${coupleId}`);

  const listener = onValue(listsRef, (snap) => {
    const lists: TodoList[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        lists.push({ id: child.key!, ...(child.val() as Omit<TodoList, 'id'>) });
      });
      lists.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    callback(lists);
  });

  return () => off(listsRef, 'value', listener);
}

export function subscribeToItems(
  coupleId: string,
  listId: string,
  callback: (items: TodoItem[]) => void
): Unsubscribe {
  const itemsRef = ref(db, `todoItems/${coupleId}/${listId}`);

  const listener = onValue(itemsRef, (snap) => {
    const items: TodoItem[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        items.push({ id: child.key!, ...(child.val() as Omit<TodoItem, 'id'>) });
      });
      items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    callback(items);
  });

  return () => off(itemsRef, 'value', listener);
}

export async function createList(list: Omit<TodoList, 'id'>): Promise<string> {
  const newRef = await push(ref(db, `todoLists/${list.coupleId}`), list);
  return newRef.key!;
}

export async function deleteList(coupleId: string, listId: string): Promise<void> {
  await remove(ref(db, `todoLists/${coupleId}/${listId}`));
  await remove(ref(db, `todoItems/${coupleId}/${listId}`));
}

export async function createItem(item: Omit<TodoItem, 'id'>): Promise<string> {
  const newRef = await push(ref(db, `todoItems/${item.coupleId}/${item.listId}`), item);
  return newRef.key!;
}

export async function toggleItem(
  coupleId: string,
  listId: string,
  item: TodoItem,
  uid: string
): Promise<void> {
  await update(ref(db, `todoItems/${coupleId}/${listId}/${item.id}`), {
    isCompleted: !item.isCompleted,
    completedBy: !item.isCompleted ? uid : null,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteItem(
  coupleId: string,
  listId: string,
  itemId: string
): Promise<void> {
  await remove(ref(db, `todoItems/${coupleId}/${listId}/${itemId}`));
}
