import { auth } from './firebase';

const BASE_URL = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;

async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

function url(path: string, token: string | null): string {
  const base = `${BASE_URL}/${path}.json`;
  return token ? `${base}?auth=${token}` : base;
}

export async function rtdbGet(path: string): Promise<any> {
  const token = await getToken();
  const res = await fetch(url(path, token));
  if (!res.ok) throw new Error(`RTDB GET error: ${res.status}`);
  return res.json();
}

export async function rtdbSet(path: string, data: any): Promise<void> {
  const token = await getToken();
  const res = await fetch(url(path, token), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`RTDB SET error: ${res.status}`);
}

export async function rtdbPush(path: string, data: any): Promise<string> {
  const token = await getToken();
  const res = await fetch(url(path, token), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`RTDB PUSH error: ${res.status}`);
  const json = await res.json();
  return json.name; // Firebase returns { name: "-auto-id" }
}

export async function rtdbUpdate(path: string, data: any): Promise<void> {
  const token = await getToken();
  const res = await fetch(url(path, token), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`RTDB UPDATE error: ${res.status}`);
}

export async function rtdbDelete(path: string): Promise<void> {
  const token = await getToken();
  const res = await fetch(url(path, token), { method: 'DELETE' });
  if (!res.ok) throw new Error(`RTDB DELETE error: ${res.status}`);
}
