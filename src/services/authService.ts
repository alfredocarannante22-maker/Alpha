import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { AppUser, UserRole } from '../types';

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
    email,
    displayName,
    role,
    coupleId: cred.user.uid, // starts solo, linked when partner joins
  };

  await setDoc(doc(db, 'users', cred.user.uid), userData);
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
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as AppUser) : null;
}

export async function linkPartner(myUid: string, partnerEmail: string): Promise<string> {
  const q = query(collection(db, 'users'), where('email', '==', partnerEmail));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('Partner non trovato. Assicurati che si sia già registrato.');
  }

  const partnerDoc = snap.docs[0];
  const partnerId = partnerDoc.id;
  const partnerData = partnerDoc.data() as AppUser;

  // Use the smaller uid as the shared coupleId
  const coupleId = myUid < partnerId ? `${myUid}_${partnerId}` : `${partnerId}_${myUid}`;

  await updateDoc(doc(db, 'users', myUid), {
    partnerId,
    partnerEmail,
    coupleId,
  });

  await updateDoc(doc(db, 'users', partnerId), {
    partnerId: myUid,
    partnerEmail: (await getDoc(doc(db, 'users', myUid))).data()?.email,
    coupleId,
  });

  return coupleId;
}
