/**
 * Toggle browser-local persistence for guest/session-like app data.
 *
 * Set this to true again when we want localStorage-backed remembering back.
 */
export const LOCAL_PERSISTENCE_ENABLED = false;

export function readLocalItem(key: string): string | null {
  if (!LOCAL_PERSISTENCE_ENABLED || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocalItem(key: string, value: string): void {
  if (!LOCAL_PERSISTENCE_ENABLED || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function removeLocalItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
