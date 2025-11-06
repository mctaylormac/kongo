import { db } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
  serverTimestamp,
  type DocumentData
} from "firebase/firestore";

export async function upsertById(collectionName: string, id: string, data: DocumentData): Promise<void> {
  const ref = doc(db, collectionName, id);
  await setDoc(ref, { ...data, id }, { merge: true });
}

export async function batchUpsert(collectionName: string, items: Array<{ id: string; data: DocumentData }>): Promise<void> {
  if (items.length === 0) return;
  const batch = writeBatch(db);
  for (const item of items) {
    const ref = doc(db, collectionName, item.id);
    batch.set(ref, { ...item.data, id: item.id }, { merge: true });
  }
  await batch.commit();
}

export async function existsWhere(collectionName: string, field: string, value: unknown): Promise<boolean> {
  const q = query(collection(db, collectionName), where(field, "==", value as any));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function setUserProfile(uid: string, profile: DocumentData): Promise<void> {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { ...profile, uid }, { merge: true });
}

export async function createBooking(userId: string, booking: DocumentData): Promise<string> {
  console.log('[FIREBASE] createBooking called:', { userId, booking });
  const ref = await addDoc(collection(db, "bookings"), {
    ...booking,
    userId,
    createdAt: serverTimestamp()
  });
  // Also mirror under user subcollection for easy user-centric queries
  await setDoc(doc(db, "users", userId, "bookings", ref.id), {
    ...booking,
    userId,
    createdAt: serverTimestamp(),
    id: ref.id
  });
  console.log('[FIREBASE] Booking saved with id:', ref.id);
  return ref.id;
}


