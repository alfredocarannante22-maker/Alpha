import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, db } from './firebase';
import { AppUser, UserRole } from '../types';

// Sanitize email for use as RTDB key (replace . with ,)
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

  // Save user profile
  await set(ref(db, `users/${cred.user.uid}`), userData);
  // Save email → uid index for partner linking
  await set(ref(db, `emailIndex/${emailToKey(email)}`), cred.user.uid);

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
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? (snap.val() as AppUser) : null;
}

export async function linkPartner(myUid: string, partnerEmail: string): Promise<string> {
  // Look up partner uid via email index
  const indexSnap = await get(ref(db, `emailIndex/${emailToKey(partnerEmail)}`));
  if (!indexSnap.exists()) {
    throw new Error('Partner non trovato. Assicurati che si sia già registrato.');
  }

  const partnerId: string = indexSnap.val();

  const mySnap = await get(ref(db, `users/${myUid}`));
  if (!mySnap.exists()) throw new Error('Profilo non trovato.');
  const myData = mySnap.val() as AppUser;

  const coupleId = myUid < partnerId
    ? `${myUid}_${partnerId}`
    : `${partnerId}_${myUid}`;

  await update(ref(db, `users/${myUid}`), {
    partnerId,
    partnerEmail: partnerEmail.toLowerCase(),
    coupleId,
  });

  await update(ref(db, `users/${partnerId}`), {
    partnerId: myUid,
    partnerEmail: myData.email,
    coupleId,
  });

  return coupleId;
}
