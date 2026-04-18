const STORAGE_KEY = "trad-trav-cosmetics-coins-v1";

/** レベル11以降のレベルアップ時に付与するアプリ内コイン（着せ替えショップ用） */
export const COSMETICS_COINS_PER_LEVEL_UP = 50;

/** このレベル以下への到達時のレベルアップは初心者ボーナス（レベル10→11 で通常に戻る） */
export const COSMETICS_COINS_BEGINNER_LEVEL_MAX = 10;

export const COSMETICS_COINS_BEGINNER_PER_LEVEL_UP = 200;

/** レベルアップ後の到達レベル `newLevel` に応じた付与コイン */
export function cosmeticsCoinsForLevelUp(newLevel: number): number {
  if (newLevel <= COSMETICS_COINS_BEGINNER_LEVEL_MAX) {
    return COSMETICS_COINS_BEGINNER_PER_LEVEL_UP;
  }
  return COSMETICS_COINS_PER_LEVEL_UP;
}

export function loadCosmeticsCoins(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveCosmeticsCoins(amount: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(amount))));
  } catch {
    /* ignore */
  }
}
