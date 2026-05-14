import { ref, push, update, remove, onValue, off, Unsubscribe } from 'firebase/database';
import { db } from './firebase';
import { Note } from '../types';

// Notes are private — stored under /notes/{uid}/
export function subscribeToNotes(uid: string, callback: (notes: Note[]) => void): Unsubscribe {
  const notesRef = ref(db, `notes/${uid}`);

  const listener = onValue(notesRef, (snap) => {
    const notes: Note[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        notes.push({ id: child.key!, ...(child.val() as Omit<Note, 'id'>) });
      });
      // Pinned first, then by updatedAt desc
      notes.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
    }
    callback(notes);
  });

  return () => off(notesRef, 'value', listener);
}

export async function createNote(note: Omit<Note, 'id'>): Promise<string> {
  const newRef = await push(ref(db, `notes/${note.createdBy}`), note);
  return newRef.key!;
}

export async function updateNote(uid: string, id: string, data: Partial<Note>): Promise<void> {
  await update(ref(db, `notes/${uid}/${id}`), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteNote(uid: string, id: string): Promise<void> {
  await remove(ref(db, `notes/${uid}/${id}`));
}
