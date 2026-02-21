import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import type { DiagnosisResult } from "../components/DiagnosisView";

export interface ViewHistoryItem {
  id: number;
  name: string;
  date: string;
  category: string;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export async function saveDiagnosisResult(userId: string, result: DiagnosisResult): Promise<void> {
  const docRef = doc(db, "users", userId);
  await setDoc(docRef, {
    diagnosisResult: result,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function getDiagnosisResult(userId: string): Promise<DiagnosisResult | null> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.diagnosisResult || null;
  }
  return null;
}

export async function addViewHistory(userId: string, item: ViewHistoryItem): Promise<void> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    const existingHistory: ViewHistoryItem[] = data.viewHistory || [];
    const filtered = existingHistory.filter(h => h.id !== item.id);
    const newHistory = [item, ...filtered].slice(0, 10);
    
    await updateDoc(docRef, { viewHistory: newHistory });
  } else {
    await setDoc(docRef, { viewHistory: [item] }, { merge: true });
  }
}

export async function getViewHistory(userId: string): Promise<ViewHistoryItem[]> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.viewHistory || [];
  }
  return [];
}

export async function getFavorites(userId: string): Promise<number[]> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().favorites || [];
  }
  return [];
}

export async function toggleFavorite(userId: string, spotId: number): Promise<number[]> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  const current: number[] = docSnap.exists() ? (docSnap.data().favorites || []) : [];
  const updated = current.includes(spotId)
    ? current.filter(id => id !== spotId)
    : [...current, spotId];
  await setDoc(docRef, { favorites: updated }, { merge: true });
  return updated;
}

export { app, auth, db };
