import { ref, push, update, remove, onValue, off, Unsubscribe } from 'firebase/database';
import { db } from './firebase';
import { CalendarEvent } from '../types';

export function subscribeToEvents(
  coupleId: string,
  callback: (events: CalendarEvent[]) => void
): Unsubscribe {
  const eventsRef = ref(db, `events/${coupleId}`);

  const listener = onValue(eventsRef, (snap) => {
    const events: CalendarEvent[] = [];
    if (snap.exists()) {
      snap.forEach((child) => {
        events.push({ id: child.key!, ...(child.val() as Omit<CalendarEvent, 'id'>) });
      });
      events.sort((a, b) => a.startDate.localeCompare(b.startDate));
    }
    callback(events);
  });

  return () => off(eventsRef, 'value', listener);
}

export async function createEvent(event: Omit<CalendarEvent, 'id'>): Promise<string> {
  const newRef = await push(ref(db, `events/${event.coupleId}`), event);
  return newRef.key!;
}

export async function updateEvent(
  coupleId: string,
  id: string,
  data: Partial<CalendarEvent>
): Promise<void> {
  await update(ref(db, `events/${coupleId}/${id}`), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteEvent(coupleId: string, id: string): Promise<void> {
  await remove(ref(db, `events/${coupleId}/${id}`));
}
