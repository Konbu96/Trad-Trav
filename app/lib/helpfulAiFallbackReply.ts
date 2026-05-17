import { TIPS_TOPICS } from "../data/helpfulInfo";
import { MANNER_ITEMS } from "../data/manners";

type FallbackLang = "ja" | "en" | "zh" | "ko";

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s、。．，,?？!！・]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function scoreAgainstQuery(query: string, fields: string[]): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const tokens = tokenize(query);
  let score = 0;

  for (const field of fields) {
    const text = field.toLowerCase();
    if (!text) continue;
    if (text.includes(q) || q.includes(text)) score += 12;
    for (const token of tokens) {
      if (text.includes(token)) score += 6;
    }
  }
  return score;
}

function fallbackLabels(lang: FallbackLang) {
  if (lang === "en") {
    return {
      intro: "Here is related information from the in-app guides:",
      noMatch:
        "I could not find a close match in the guides. Try the quick questions below, or browse **Manners**, **Trivia**, and **Travel guides** in this tab.",
      footer: "This is reference material—always follow on-site rules and staff guidance.",
      spotNote: (name: string) => `Context: you are viewing **${name}**.`,
    };
  }
  if (lang === "zh") {
    return {
      intro: "根据应用内指南，找到以下相关内容：",
      noMatch: "未在指南中找到高度匹配的内容。请试试下方推荐问题，或在「礼仪」「冷知识」「旅行指南」中浏览。",
      footer: "仅供参考，请以现场说明与规则为准。",
      spotNote: (name: string) => `相关场所：**${name}**。`,
    };
  }
  if (lang === "ko") {
    return {
      intro: "앱 안내에서 관련 내용을 찾았습니다:",
      noMatch:
        "안내에서 정확히 맞는 내용을 찾지 못했습니다. 아래 추천 질문을 시도하거나 「매너」「잡학」「여행 가이드」 탭을 둘러보세요.",
      footer: "참고용입니다. 현장 안내와 규칙을 우선해 주세요.",
      spotNote: (name: string) => `관련 장소: **${name}**.`,
    };
  }
  return {
    intro: "アプリ内の掲載情報から、関連しそうな内容をお伝えします。",
    noMatch:
      "掲載情報の中に、質問にぴったり合う項目は見つかりませんでした。「おすすめの質問」を試すか、「マナー」「豆知識」「旅ガイド」タブもご覧ください。",
    footer: "※ 参考情報です。現地の案内やルールを優先してください。",
    spotNote: (name: string) => `関連スポット: **${name}** の場面も意識してください。`,
  };
}

/**
 * OpenAI が使えないときの簡易回答（マナー・豆知識・旅ガイドのキーワード照合）。
 */
export function buildHelpfulFallbackReply(
  userQuery: string,
  language: FallbackLang,
  spotName?: string | null
): string {
  const labels = fallbackLabels(language);
  const query = userQuery.trim();

  type Candidate = { score: number; title: string; body: string };
  const candidates: Candidate[] = [];

  for (const topic of TIPS_TOPICS) {
    const score = scoreAgainstQuery(query, [
      topic.title,
      topic.subtitle,
      topic.description,
      topic.aiPrompt,
      ...topic.keywords,
      ...topic.scenes,
      ...topic.details,
    ]);
    if (score > 0) {
      candidates.push({
        score,
        title: topic.title,
        body: [topic.description, ...topic.details.map((d) => `- ${d}`)].join("\n\n"),
      });
    }
  }

  for (const item of MANNER_ITEMS) {
    const score = scoreAgainstQuery(query, [
      item.title,
      item.shortDescription,
      ...item.keywords,
      ...item.scenes,
      ...item.details,
    ]);
    if (score > 0) {
      candidates.push({
        score,
        title: item.title,
        body: [item.shortDescription, ...item.details.map((d) => `- ${d}`)].join("\n\n"),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ja"));
  const best = candidates[0];

  const spotBlock =
    spotName?.trim() && best && best.score >= 5 ? `\n\n${labels.spotNote(spotName.trim())}` : "";

  if (!best || best.score < 5) {
    return `${labels.noMatch}${spotName?.trim() ? `\n\n${labels.spotNote(spotName.trim())}` : ""}\n\n---\n${labels.footer}`;
  }

  return `${labels.intro}\n\n**${best.title}**\n\n${best.body}${spotBlock}\n\n---\n${labels.footer}`;
}

export type OpenAiFailureCode =
  | "missing_key"
  | "insufficient_quota"
  | "rate_limit"
  | "invalid_api_key"
  | "upstream";

export function parseOpenAiFailure(status: number, body: string): OpenAiFailureCode {
  try {
    const parsed = JSON.parse(body) as { error?: { code?: string; type?: string } };
    const code = parsed.error?.code || parsed.error?.type;
    if (code === "insufficient_quota") return "insufficient_quota";
    if (code === "rate_limit_exceeded" || status === 429) return "rate_limit";
    if (code === "invalid_api_key" || status === 401) return "invalid_api_key";
  } catch {
    /* ignore */
  }
  if (status === 429) return "rate_limit";
  if (status === 401) return "invalid_api_key";
  return "upstream";
}
