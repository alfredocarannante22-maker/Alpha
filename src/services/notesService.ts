import { rtdbGet, rtdbPush, rtdbUpdate, rtdbDelete } from './rtdb';
import { Note } from '../types';

export async function fetchNotes(uid: string): Promise<Note[]> {
  const data = await rtdbGet(`notes/${uid}`);
  if (!data) return [];
  return Object.entries(data).map(([id, val]: any) => ({ id, ...val }))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}

export async function createNote(note: Omit<Note, 'id'>): Promise<string> {
  return rtdbPush(`notes/${note.createdBy}`, note);
}

export async function updateNote(uid: string, id: string, data: Partial<Note>): Promise<void> {
  await rtdbUpdate(`notes/${uid}/${id}`, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteNote(uid: string, id: string): Promise<void> {
  await rtdbDelete(`notes/${uid}/${id}`);
}
