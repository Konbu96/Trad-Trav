import {
  LOCAL_PERSISTENCE_ENABLED,
  readLocalItem,
  removeLocalItem,
  writeLocalItem,
} from "./localPersistence";

const STORAGE_KEY = "trad-trav-cosmetics-coins-v1";
const EARNED_TOTAL_STORAGE_KEY = "trad-trav-cosmetics-coins-earned-total-v1";

/** localStorage 無効時も同一セッション内でコイン実績が動くようメモリ保持 */
let sessionCoinsBalance = 0;
let sessionCoinsEarnedTotal = 0;

/** レベル11以降のレベルアップ時に付与するアプリ内コイン（着せ替えショップ用） */
export const COSMETICS_COINS_PER_LEVEL_UP = 50;

/** このレベル以下への到達時のレベルアップは初心者ボーナス（レベル10→11 で通常に戻る） */
export const COSMETICS_COINS_BEGINNER_LEVEL_MAX = 10;

export const COSMETICS_COINS_BEGINNER_PER_LEVEL_UP = 200;

/** 開発者ツール: 一括付与するコイン数 */
export const DEV_GRANT_COINS_AMOUNT = 149_999;

function normalizeCoins(amount: number): number {
  const n = Math.floor(amount);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** レベルアップ後の到達レベル `newLevel` に応じた付与コイン */
export function cosmeticsCoinsForLevelUp(newLevel: number): number {
  if (newLevel <= COSMETICS_COINS_BEGINNER_LEVEL_MAX) {
    return COSMETICS_COINS_BEGINNER_PER_LEVEL_UP;
  }
  return COSMETICS_COINS_PER_LEVEL_UP;
}

export function loadCosmeticsCoins(): number {
  if (!LOCAL_PERSISTENCE_ENABLED) return sessionCoinsBalance;
  try {
    const raw = readLocalItem(STORAGE_KEY);
    if (raw == null) return 0;
    return normalizeCoins(Number.parseInt(raw, 10));
  } catch {
    return 0;
  }
}

export function saveCosmeticsCoins(amount: number): void {
  const normalized = normalizeCoins(amount);
  if (!LOCAL_PERSISTENCE_ENABLED) {
    sessionCoinsBalance = normalized;
    return;
  }
  writeLocalItem(STORAGE_KEY, String(normalized));
}

/** 累計獲得コイン（実績判定用。ショップ購入では減らない） */
export function loadCosmeticsCoinsEarnedTotal(): number {
  if (!LOCAL_PERSISTENCE_ENABLED) return sessionCoinsEarnedTotal;
  try {
    const raw = readLocalItem(EARNED_TOTAL_STORAGE_KEY);
    if (raw != null) {
      return normalizeCoins(Number.parseInt(raw, 10));
    }
    const balance = loadCosmeticsCoins();
    if (balance > 0) {
      writeLocalItem(EARNED_TOTAL_STORAGE_KEY, String(balance));
      return balance;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function saveCosmeticsCoinsEarnedTotal(amount: number): void {
  const normalized = normalizeCoins(amount);
  if (!LOCAL_PERSISTENCE_ENABLED) {
    sessionCoinsEarnedTotal = normalized;
    return;
  }
  writeLocalItem(EARNED_TOTAL_STORAGE_KEY, String(normalized));
}

export function addCosmeticsCoinsEarned(amount: number): void {
  const delta = normalizeCoins(amount);
  if (delta <= 0) return;
  saveCosmeticsCoinsEarnedTotal(loadCosmeticsCoinsEarnedTotal() + delta);
}

/** 所持コインと累計獲得の両方に加算（開発用） */
export function grantCosmeticsCoins(amount: number): { balance: number; earnedTotal: number } {
  const delta = normalizeCoins(amount);
  const balance = loadCosmeticsCoins() + delta;
  saveCosmeticsCoins(balance);
  addCosmeticsCoinsEarned(delta);
  return { balance, earnedTotal: loadCosmeticsCoinsEarnedTotal() };
}

export function clearCosmeticsCoinsStorage(): void {
  sessionCoinsBalance = 0;
  sessionCoinsEarnedTotal = 0;
  removeLocalItem(STORAGE_KEY);
  removeLocalItem(EARNED_TOTAL_STORAGE_KEY);
}
