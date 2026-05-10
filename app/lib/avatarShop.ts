/** 着せ替えショップ：プロフィールアイコン・フレーム（コイン購入） */

import { readLocalItem, writeLocalItem } from "./localPersistence";

export const AVATAR_SHOP_PRICE = 250;

const PURCHASED_STORAGE_KEY = "trad-trav-avatar-shop-purchased-v1";
const PURCHASED_FRAME_STORAGE_KEY = "trad-trav-avatar-frame-shop-purchased-v1";

export type AvatarShopItem = {
  id: string;
  src: string;
};

export const AVATAR_SHOP_ITEMS: readonly AvatarShopItem[] = [
  { id: "shop-kappa", src: "/avatar-shop/kappa.png" },
  { id: "shop-kitsune", src: "/avatar-shop/kitsune.png" },
  { id: "shop-maneki", src: "/avatar-shop/maneki.png" },
  { id: "shop-tengu", src: "/avatar-shop/tengu.png" },
  { id: "shop-tanuki", src: "/avatar-shop/tanuki.png" },
] as const;

export const AVATAR_FRAME_SHOP_ITEMS: readonly AvatarShopItem[] = [
  { id: "frame-sweets", src: "/avatar-frames/sweets.png" },
  { id: "frame-sakura", src: "/avatar-frames/sakura.png" },
  { id: "frame-wagara", src: "/avatar-frames/wagara.png" },
  { id: "frame-koi", src: "/avatar-frames/koi.png" },
] as const;

function loadPurchasedIds(storageKey: string): string[] {
  try {
    const raw = readLocalItem(storageKey);
    if (raw == null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function savePurchasedIds(storageKey: string, ids: readonly string[]): void {
  writeLocalItem(storageKey, JSON.stringify([...ids]));
}

function addPurchasedId(storageKey: string, id: string): void {
  const cur = loadPurchasedIds(storageKey);
  if (cur.includes(id)) return;
  savePurchasedIds(storageKey, [...cur, id]);
}

export function loadPurchasedShopAvatarIds(): string[] {
  return loadPurchasedIds(PURCHASED_STORAGE_KEY);
}

export function savePurchasedShopAvatarIds(ids: readonly string[]): void {
  savePurchasedIds(PURCHASED_STORAGE_KEY, ids);
}

export function addPurchasedShopAvatarId(id: string): void {
  addPurchasedId(PURCHASED_STORAGE_KEY, id);
}

export function loadPurchasedAvatarFrameIds(): string[] {
  return loadPurchasedIds(PURCHASED_FRAME_STORAGE_KEY);
}

export function savePurchasedAvatarFrameIds(ids: readonly string[]): void {
  savePurchasedIds(PURCHASED_FRAME_STORAGE_KEY, ids);
}

export function addPurchasedAvatarFrameId(id: string): void {
  addPurchasedId(PURCHASED_FRAME_STORAGE_KEY, id);
}
