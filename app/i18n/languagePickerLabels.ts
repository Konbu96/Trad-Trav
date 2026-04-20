import type { Language } from "./translations";

/** アプリ UI 言語に依らず、言語名は各言語の自己表記（エンドニム）で固定 */
export const LANGUAGE_PICKER_ROW_LABEL: Record<Language, string> = {
  ja: "🇯🇵 日本語",
  en: "🇺🇸 English",
  zh: "🇨🇳 中文（简体）",
  ko: "🇰🇷 한국어",
};
