import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { rtdbGet, rtdbSet, rtdbUpdate } from './rtdb';
import { AppUser, UserRole } from '../types';

function emailToKey(email: string): string {
  return email.toLowerCase().replace(/\./g, ',');
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<AppUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  const userData: AppUser = {
    uid: cred.user.uid,
    email: email.toLowerCase(),
    displayName,
    role,
    coupleId: cred.user.uid,
  };

  await rtdbSet(`users/${cred.user.uid}`, userData);
  await rtdbSet(`emailIndex/${emailToKey(email)}`, cred.user.uid);

  return userData;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const data = await rtdbGet(`users/${uid}`);
  return data ? (data as AppUser) : null;
}

export async function linkPartner(myUid: string, partnerEmail: string): Promise<string> {
  const partnerId = await rtdbGet(`emailIndex/${emailToKey(partnerEmail)}`);
  if (!partnerId) throw new Error('Partner non trovato. Assicurati che si sia già registrato.');

  const myData = await rtdbGet(`users/${myUid}`) as AppUser;
  if (!myData) throw new Error('Profilo non trovato.');

  const coupleId = myUid < partnerId
    ? `${myUid}_${partnerId}`
    : `${partnerId}_${myUid}`;

  await rtdbUpdate(`users/${myUid}`, {
    partnerId,
    partnerEmail: partnerEmail.toLowerCase(),
    coupleId,
  });

  await rtdbUpdate(`users/${partnerId}`, {
    partnerId: myUid,
    partnerEmail: myData.email,
    coupleId,
  });

  return coupleId;
}
