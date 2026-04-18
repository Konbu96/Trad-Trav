import { initializeApp, getApps } from "firebase/app";
import { getAuth, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, runTransaction } from "firebase/firestore";
import type { DiagnosisResult } from "../components/DiagnosisView";
import {
  applyPlayerEvent,
  defaultPlayerProgress,
  mergePlayerProgress,
  normalizePlayerProgress,
  recomputePlayerXp,
  type PlayerEvent,
  type PlayerProgress,
} from "./playerProgress";

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

/** Firestore に保存した旅行表示名。未設定のときは null（呼び出し側で Auth の名前を使う） */
export async function getTravelerDisplayName(userId: string): Promise<string | null> {
  const docSnap = await getDoc(doc(db, "users", userId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  if (!Object.prototype.hasOwnProperty.call(data, "travelerName")) return null;
  const n = data.travelerName;
  return typeof n === "string" ? n : null;
}

function readPlayerProgressFromUserData(data: Record<string, unknown> | undefined): PlayerProgress {
  if (!data) return defaultPlayerProgress();
  const raw = data.playerProgress;
  if (!raw || typeof raw !== "object") return defaultPlayerProgress();
  return normalizePlayerProgress(raw);
}

export async function getPlayerProgress(userId: string): Promise<PlayerProgress> {
  const docSnap = await getDoc(doc(db, "users", userId));
  if (!docSnap.exists()) return defaultPlayerProgress();
  return readPlayerProgressFromUserData(docSnap.data() as Record<string, unknown>);
}

export async function savePlayerProgress(userId: string, progress: PlayerProgress): Promise<void> {
  const docRef = doc(db, "users", userId);
  await setDoc(
    docRef,
    {
      playerProgress: recomputePlayerXp(progress),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function recordPlayerEvent(userId: string, event: PlayerEvent): Promise<PlayerProgress> {
  const docRef = doc(db, "users", userId);
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(docRef);
    const prev = snap.exists()
      ? readPlayerProgressFromUserData(snap.data() as Record<string, unknown>)
      : defaultPlayerProgress();
    const next = applyPlayerEvent(prev, event);
    transaction.set(
      docRef,
      {
        playerProgress: next,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return next;
  });
}

export async function mergeAndSavePlayerProgress(
  userId: string,
  remote: PlayerProgress,
  local: PlayerProgress
): Promise<PlayerProgress> {
  const merged = mergePlayerProgress(remote, local);
  await savePlayerProgress(userId, merged);
  return merged;
}

export async function saveTravelerDisplayName(userId: string, name: string): Promise<void> {
  const docRef = doc(db, "users", userId);
  await setDoc(
    docRef,
    { travelerName: name, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  if (auth.currentUser?.uid === userId) {
    await updateProfile(auth.currentUser, { displayName: name });
  }
}

export { app, auth, db };
