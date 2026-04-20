/** スプラッシュ直後の言語選択を「初回のみ」にする */
export const POST_SPLASH_LANGUAGE_SEEN_KEY = "trad-trav-post-splash-language-seen-v1";

/** 下部タブの初回ウォークスルー（1回のみ） */
export const FIRST_APP_WALKTHROUGH_DONE_KEY = "trad-trav-first-app-walkthrough-done-v1";

export function readPostSplashLanguageSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(POST_SPLASH_LANGUAGE_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePostSplashLanguageSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(POST_SPLASH_LANGUAGE_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** 次回起動でスプラッシュ直後に言語選択を再表示する（撮影・デモ用） */
export function clearPostSplashLanguageSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(POST_SPLASH_LANGUAGE_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

export function readFirstAppWalkthroughDone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FIRST_APP_WALKTHROUGH_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeFirstAppWalkthroughDone(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FIRST_APP_WALKTHROUGH_DONE_KEY, "1");
  } catch {
    /* ignore */
  }
}
