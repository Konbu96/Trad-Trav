/** Google Places API (New) の `languageCode` 用。アプリの Language と対応。 */
export function placesDetailLanguageCode(lang: string | null | undefined): string {
  const normalized = (lang || "ja").trim().toLowerCase();
  if (normalized === "en") return "en";
  if (normalized === "zh" || normalized === "zh-cn") return "zh-CN";
  if (normalized === "ko") return "ko";
  return "ja";
}

/** 口コミ投稿者名が無いときのフォールバック（Places の表示言語に合わせる） */
export function googleReviewAuthorFallback(languageCode: string): string {
  if (languageCode === "ja") return "Google ユーザー";
  if (languageCode === "ko") return "Google 사용자";
  if (languageCode.startsWith("zh")) return "Google 用户";
  return "Google user";
}
