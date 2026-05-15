import { rtdbGet, rtdbPush, rtdbUpdate, rtdbDelete } from './rtdb';
import { TodoList, TodoItem } from '../types';

export async function fetchLists(coupleId: string): Promise<TodoList[]> {
  const data = await rtdbGet(`todoLists/${coupleId}`);
  if (!data) return [];
  return Object.entries(data).map(([id, val]: any) => ({ id, ...val }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function fetchItems(coupleId: string, listId: string): Promise<TodoItem[]> {
  const data = await rtdbGet(`todoItems/${coupleId}/${listId}`);
  if (!data) return [];
  return Object.entries(data).map(([id, val]: any) => ({ id, ...val }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function createList(list: Omit<TodoList, 'id'>): Promise<string> {
  return rtdbPush(`todoLists/${list.coupleId}`, list);
}

export async function deleteList(coupleId: string, listId: string): Promise<void> {
  await rtdbDelete(`todoLists/${coupleId}/${listId}`);
  await rtdbDelete(`todoItems/${coupleId}/${listId}`);
}

export async function createItem(item: Omit<TodoItem, 'id'>): Promise<string> {
  return rtdbPush(`todoItems/${item.coupleId}/${item.listId}`, item);
}

export async function toggleItem(coupleId: string, listId: string, item: TodoItem, uid: string): Promise<void> {
  await rtdbUpdate(`todoItems/${coupleId}/${listId}/${item.id}`, {
    isCompleted: !item.isCompleted,
    completedBy: !item.isCompleted ? uid : null,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteItem(coupleId: string, listId: string, itemId: string): Promise<void> {
  await rtdbDelete(`todoItems/${coupleId}/${listId}/${itemId}`);
}
