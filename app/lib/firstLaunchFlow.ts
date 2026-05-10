import { readLocalItem, removeLocalItem, writeLocalItem } from "./localPersistence";

/** スプラッシュ直後の言語選択を「初回のみ」にする */
export const POST_SPLASH_LANGUAGE_SEEN_KEY = "trad-trav-post-splash-language-seen-v1";

/** 下部タブの初回ウォークスルー（1回のみ） */
export const FIRST_APP_WALKTHROUGH_DONE_KEY = "trad-trav-first-app-walkthrough-done-v1";

export function readPostSplashLanguageSeen(): boolean {
  return readLocalItem(POST_SPLASH_LANGUAGE_SEEN_KEY) === "1";
}

export function writePostSplashLanguageSeen(): void {
  writeLocalItem(POST_SPLASH_LANGUAGE_SEEN_KEY, "1");
}

/** 次回起動でスプラッシュ直後に言語選択を再表示する（撮影・デモ用） */
export function clearPostSplashLanguageSeen(): void {
  removeLocalItem(POST_SPLASH_LANGUAGE_SEEN_KEY);
}

export function readFirstAppWalkthroughDone(): boolean {
  return readLocalItem(FIRST_APP_WALKTHROUGH_DONE_KEY) === "1";
}

export function writeFirstAppWalkthroughDone(): void {
  writeLocalItem(FIRST_APP_WALKTHROUGH_DONE_KEY, "1");
}

/** 開発用リセットなどで、初回タブガイドを再度表示できるようにする */
export function clearFirstAppWalkthroughDone(): void {
  removeLocalItem(FIRST_APP_WALKTHROUGH_DONE_KEY);
}
