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
import { Note } from '../types';

const COL = 'notes';

// Notes are personal: filter by createdBy (uid)
export function subscribeToNotes(uid: string, callback: (notes: Note[]) => void): Unsubscribe {
  const q = query(
    collection(db, COL),
    where('createdBy', '==', uid),
    orderBy('isPinned', 'desc'),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const notes: Note[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Note, 'id'>),
    }));
    callback(notes);
  });
}

export async function createNote(note: Omit<Note, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), note);
  return ref.id;
}

export async function updateNote(id: string, data: Partial<Note>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteNote(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
