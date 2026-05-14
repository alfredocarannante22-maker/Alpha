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
import { CalendarEvent } from '../types';

const COL = 'events';

export function subscribeToEvents(
  coupleId: string,
  callback: (events: CalendarEvent[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COL),
    where('coupleId', '==', coupleId),
    orderBy('startDate', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const events: CalendarEvent[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CalendarEvent, 'id'>),
    }));
    callback(events);
  });
}

export async function createEvent(event: Omit<CalendarEvent, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), event);
  return ref.id;
}

export async function updateEvent(id: string, data: Partial<CalendarEvent>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
