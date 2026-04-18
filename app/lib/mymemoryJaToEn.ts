/** アプリ UI 言語（日本語以外）で施設名を補完するときの対象 */
export type NonJaPlaceUiLang = "en" | "zh" | "ko";

/** 施設名などに日本語系文字が含まれるか（簡易判定） */
export function textLooksPrimarilyJapanese(text: string): boolean {
  if (!text.trim()) return false;
  return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u3400-\u9fff\uff01-\uff60]/.test(text);
}

/** MyMemory の `langpair`（ソース|ターゲット） */
const MYMEMORY_LANGPAIR: Record<NonJaPlaceUiLang, string> = {
  en: "ja|en",
  zh: "ja|zh-CN",
  ko: "ja|ko",
};

/** ja 明示が失敗したとき、中国語・韓国語 UI 向けにソース自動検出で再試行 */
const MYMEMORY_AUTO_FALLBACK: Partial<Record<NonJaPlaceUiLang, string>> = {
  zh: "auto|zh-CN",
  ko: "auto|ko",
};

/**
 * Places が英語名のまま返すケース向け（韓国語・中国語 UI）。
 * すでにハングル・漢字のみの名前は触らない。
 */
function textLooksPrimarilyEnglishOrLatin(text: string, appLang: "zh" | "ko"): boolean {
  const t = text.trim();
  if (t.length < 2) return false;
  if (appLang === "ko" && /[\uac00-\ud7af]/.test(t)) return false;
  if (appLang === "zh" && /[\u4e00-\u9fff]/.test(t)) return false;
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(t)) return false;
  const letters = t.match(/[A-Za-z]/g);
  if (!letters || letters.length < 2) return false;
  const nonSpace = t.replace(/\s/g, "");
  if (nonSpace.length === 0) return false;
  return letters.length / nonSpace.length >= 0.35;
}

async function translateLatinPlaceNameForZhKoUi(text: string, appLang: "zh" | "ko"): Promise<string | null> {
  const langpair = appLang === "zh" ? "en|zh-CN" : "en|ko";
  const primary = await fetchMyMemoryTranslatedText(text, langpair);
  if (primary) return primary;
  const auto = appLang === "zh" ? "auto|zh-CN" : "auto|ko";
  return fetchMyMemoryTranslatedText(text, auto);
}

async function fetchMyMemoryTranslatedText(text: string, langpair: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseStatus?: number;
      responseData?: { translatedText?: string };
    };
    if (data.responseStatus !== 200) return null;
    const out = String(data.responseData?.translatedText || "").trim();
    if (!out || out === text) return null;
    if (/MYMEMORY\s+WARNING/i.test(out)) return null;
    return out;
  } catch {
    return null;
  }
}

/**
 * Places の表示名を UI 言語に寄せる。
 * - 日本語っぽい → ja→en/zh/ko（+ auto フォールバック）
 * - 韓国語・中国語 UI で英語主体の名前 → en→ko / en→zh-CN（+ auto）
 */
export async function maybeTranslateJapanesePlaceName(
  text: string | undefined | null,
  appLang: string
): Promise<string | undefined> {
  if (!text?.trim()) return text ?? undefined;
  if (appLang !== "en" && appLang !== "zh" && appLang !== "ko") return text;

  if (textLooksPrimarilyJapanese(text)) {
    const translated = await translateJapanesePlaceNameWithMyMemory(text, appLang);
    return translated ?? text;
  }

  if ((appLang === "ko" || appLang === "zh") && textLooksPrimarilyEnglishOrLatin(text, appLang)) {
    const translated = await translateLatinPlaceNameForZhKoUi(text, appLang);
    return translated ?? text;
  }

  return text;
}

export async function translateJapanesePlaceNameWithMyMemory(
  text: string,
  targetAppLang: NonJaPlaceUiLang
): Promise<string | null> {
  if (!textLooksPrimarilyJapanese(text)) return null;
  const primary = await fetchMyMemoryTranslatedText(text, MYMEMORY_LANGPAIR[targetAppLang]);
  if (primary) return primary;
  const autoPair = MYMEMORY_AUTO_FALLBACK[targetAppLang];
  if (!autoPair) return null;
  return fetchMyMemoryTranslatedText(text, autoPair);
}
