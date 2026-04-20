import type { GuideStepBlock, HelpfulDetail } from "../data/helpfulInfo";
import { TIPS_TOPICS } from "../data/helpfulInfo";
import { MANNER_ITEMS, type MannerCategoryId, type MannerItem } from "../data/manners";
import type { Language, Translations } from "../i18n/translations";

type MannerItemCopy = { title: string; shortDescription: string; details: readonly string[] };
type MannerCategoryCopy = { label: string; description: string };
type TopicCopy = {
  title: string;
  subtitle: string;
  description: string;
  details: readonly string[];
  guideSteps?: readonly GuideStepBlock[];
};

function mannerItemsMap(t: Translations): Record<string, MannerItemCopy> {
  return t.helpfulLibrary.mannerItems as unknown as Record<string, MannerItemCopy>;
}

function topicsMap(t: Translations): Record<string, TopicCopy> {
  return t.helpfulLibrary.topics as unknown as Record<string, TopicCopy>;
}

function mannerCategoriesMap(t: Translations): Record<string, MannerCategoryCopy> {
  return t.helpfulLibrary.mannerCategories as unknown as Record<string, MannerCategoryCopy>;
}

export function getLocalizedMannerCategory(categoryId: MannerCategoryId, t: Translations): MannerCategoryCopy {
  return mannerCategoriesMap(t)[categoryId] ?? { label: categoryId, description: "" };
}

type MannerItemTextSource = Pick<MannerItem, "title" | "shortDescription" | "details">;

/**
 * マナー項目の表示文言。
 * 日本語 UI ではシート反映先の `MANNER_ITEMS`（`base`）を優先し、`helpfulLibrary` の日本語 duplicate とずれないようにする。
 * 英語等では `helpfulLibrary.mannerItems` を優先し、未訳時は `base` にフォールバックする。
 */
export function getLocalizedMannerItem(
  itemId: string,
  t: Translations,
  options?: { language: Language; base?: MannerItemTextSource }
): MannerItemCopy | undefined {
  const lib = mannerItemsMap(t)[itemId];
  const { language, base } = options ?? {};

  if (!lib && !base) return undefined;

  if (language === "ja" && base) {
    return {
      title: base.title,
      shortDescription: base.shortDescription,
      details: base.details,
    };
  }

  const title = lib?.title ?? base?.title ?? "";
  const shortDescription = lib?.shortDescription ?? base?.shortDescription ?? "";
  const details = lib?.details?.length ? lib.details : base?.details ?? [];

  if (!title && !shortDescription && details.length === 0) return undefined;

  return { title, shortDescription, details };
}

export function getLocalizedTopic(topicId: string, t: Translations): TopicCopy | undefined {
  return topicsMap(t)[topicId];
}

const TIPS_TOPIC_BY_ID = new Map(TIPS_TOPICS.map((topic) => [topic.id, topic]));

/** 豆知識/旅ガイドの帯表示。シートの subtitle 文言ではなく UI 言語のバッジに統一 */
export function helpfulTopicTabSubtitle(topicId: string, t: Translations): string {
  const meta = TIPS_TOPIC_BY_ID.get(topicId);
  if (meta?.tabId === "guide") return t.manner.badgeGuide;
  if (meta?.tabId === "trivia") return t.manner.badgeTrivia;
  return topicsMap(t)[topicId]?.subtitle ?? meta?.subtitle ?? "";
}

/**
 * 手順付きガイドのステップ。シート由来の `helpfulLibrary.topics[id].guideSteps` を優先し、なければ `TIPS_TOPICS` の本文にフォールバックする。
 */
export function getLocalizedGuideSteps(topicId: string, t: Translations): GuideStepBlock[] {
  const sheet = topicsMap(t)[topicId]?.guideSteps;
  if (sheet?.length) {
    return sheet.map((step) => ({
      heading: step.heading,
      body: step.body,
      bullets: [...step.bullets],
    }));
  }
  const base = TIPS_TOPIC_BY_ID.get(topicId)?.guideSteps;
  return base?.length ? base.map((s) => ({ ...s, bullets: [...s.bullets] })) : [];
}

export function localizeHelpfulCard(
  cardKey: string,
  t: Translations,
  language: Language = "ja"
): { title: string; subtitle: string; description: string } {
  const colonIdx = cardKey.indexOf(":");
  const kind = colonIdx >= 0 ? cardKey.slice(0, colonIdx) : cardKey;
  const id = colonIdx >= 0 ? cardKey.slice(colonIdx + 1) : "";
  if (kind === "manner") {
    const cat = mannerCategoriesMap(t)[id];
    return {
      title: cat?.label ?? id,
      subtitle: t.manner.badgeManner,
      description: cat?.description ?? "",
    };
  }
  if (kind === "mannerItem") {
    const base = MANNER_ITEMS.find((entry) => entry.id === id);
    if (!base) {
      return { title: id, subtitle: t.manner.badgeManner, description: "" };
    }
    const loc = getLocalizedMannerItem(id, t, { language, base });
    return {
      title: loc?.title ?? base.title,
      subtitle: t.manner.badgeManner,
      description: loc?.shortDescription ?? base.shortDescription,
    };
  }
  const topic = topicsMap(t)[id];
  if (!topic) {
    return { title: id, subtitle: "", description: "" };
  }
  return {
    title: topic.title,
    subtitle: helpfulTopicTabSubtitle(id, t) || topic.subtitle,
    description: topic.description,
  };
}

export function getLocalizedHelpfulDetailTitle(
  detail: HelpfulDetail,
  t: Translations,
  options?: { language?: Language }
): string {
  const language = options?.language ?? "ja";
  if (detail.kind === "manner") {
    return mannerCategoriesMap(t)[detail.categoryId]?.label ?? detail.title;
  }
  if (detail.kind === "mannerItem") {
    const base = MANNER_ITEMS.find((entry) => entry.id === detail.itemId);
    const loc = getLocalizedMannerItem(detail.itemId, t, { language, base });
    return loc?.title ?? detail.title;
  }
  return topicsMap(t)[detail.topic.id]?.title ?? detail.title;
}
