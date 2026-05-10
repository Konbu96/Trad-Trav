import { readLocalItem, writeLocalItem } from "./localPersistence";

const STORAGE_KEY = "trad-trav-helpful-favorites";

export function loadGuestHelpfulFavorites(): string[] {
  try {
    const raw = readLocalItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function saveGuestHelpfulFavorites(keys: string[]): void {
  writeLocalItem(STORAGE_KEY, JSON.stringify(keys));
}
