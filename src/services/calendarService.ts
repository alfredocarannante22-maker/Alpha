import { rtdbGet, rtdbPush, rtdbUpdate, rtdbDelete } from './rtdb';
import { CalendarEvent } from '../types';

export async function fetchEvents(coupleId: string): Promise<CalendarEvent[]> {
  const data = await rtdbGet(`events/${coupleId}`);
  if (!data) return [];
  return Object.entries(data).map(([id, val]: any) => ({ id, ...val }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function createEvent(event: Omit<CalendarEvent, 'id'>): Promise<string> {
  return rtdbPush(`events/${event.coupleId}`, event);
}

export async function updateEvent(coupleId: string, id: string, data: Partial<CalendarEvent>): Promise<void> {
  await rtdbUpdate(`events/${coupleId}/${id}`, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteEvent(coupleId: string, id: string): Promise<void> {
  await rtdbDelete(`events/${coupleId}/${id}`);
}
