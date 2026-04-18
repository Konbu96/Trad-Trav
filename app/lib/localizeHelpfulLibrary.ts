import type { HelpfulDetail } from "../data/helpfulInfo";
import type { MannerCategoryId } from "../data/manners";
import type { Translations } from "../i18n/translations";

type MannerItemCopy = { title: string; shortDescription: string; details: readonly string[] };
type MannerCategoryCopy = { label: string; description: string };
type TopicCopy = { title: string; subtitle: string; description: string; details: readonly string[] };

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

export function getLocalizedMannerItem(itemId: string, t: Translations): MannerItemCopy | undefined {
  return mannerItemsMap(t)[itemId];
}

export function getLocalizedTopic(topicId: string, t: Translations): TopicCopy | undefined {
  return topicsMap(t)[topicId];
}

export function localizeHelpfulCard(
  cardKey: string,
  t: Translations
): { title: string; subtitle: string; description: string } {
  const [kind, id] = cardKey.split(":");
  if (kind === "manner") {
    const cat = mannerCategoriesMap(t)[id];
    return {
      title: cat?.label ?? id,
      subtitle: t.manner.badgeManner,
      description: cat?.description ?? "",
    };
  }
  const topic = topicsMap(t)[id];
  if (!topic) {
    return { title: id, subtitle: "", description: "" };
  }
  return {
    title: topic.title,
    subtitle: topic.subtitle,
    description: topic.description,
  };
}

export function getLocalizedHelpfulDetailTitle(detail: HelpfulDetail, t: Translations): string {
  if (detail.kind === "manner") {
    return mannerCategoriesMap(t)[detail.categoryId]?.label ?? detail.title;
  }
  return topicsMap(t)[detail.topic.id]?.title ?? detail.title;
}
