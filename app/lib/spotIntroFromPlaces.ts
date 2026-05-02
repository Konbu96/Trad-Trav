import type { Translations } from "../i18n/translations";

/** Places 由来のテキストを結合してスポット紹介文にする */
export type SpotIntroPlacesFields = {
  overview?: string | null;
  generativeOverview?: string | null;
  reviewSummary?: string | null;
  /** キュレーション／スナップショットの summary（体験の一言など） */
  curatedSummary?: string | null;
  reviewSummaryDisclosure?: string | null;
  generativeOverviewDisclosure?: string | null;
  rating?: number | null;
  userRatingCount?: number | null;
  primaryTypeDisplayName?: string | null;
};

function pushUnique(blocks: string[], text: string | undefined | null) {
  const s = typeof text === "string" ? text.trim() : "";
  if (!s) return;
  if (blocks.some((b) => b === s)) return;
  blocks.push(s);
}

export function buildSpotIntroFromPlaces(
  fields: SpotIntroPlacesFields,
  options: {
    t: Translations;
    categoryLabel: string;
    /** `{category}` を含むフォールバック（例: mapTab.spotDescriptionFallback） */
    fallbackDescription: string;
  }
): string {
  const { t, categoryLabel, fallbackDescription } = options;
  const blocks: string[] = [];

  const typeLabel = fields.primaryTypeDisplayName?.trim();
  const rating = fields.rating;
  const count = fields.userRatingCount;

  if (rating != null && !Number.isNaN(rating)) {
    const ratingPart =
      count != null && count > 0
        ? t.mapTab.spotIntroGoogleRatingWithCount.replace("{rating}", rating.toFixed(1)).replace("{count}", String(count))
        : t.mapTab.spotIntroGoogleRatingOnly.replace("{rating}", rating.toFixed(1));
    blocks.push(typeLabel ? `${typeLabel} · ${ratingPart}` : ratingPart);
  } else if (typeLabel) {
    blocks.push(typeLabel);
  }

  pushUnique(blocks, fields.overview);
  pushUnique(blocks, fields.generativeOverview);
  pushUnique(blocks, fields.reviewSummary);
  pushUnique(blocks, fields.curatedSummary);

  const fallback = fallbackDescription.replace("{category}", categoryLabel);
  let body = blocks.length ? blocks.join("\n\n") : fallback;

  const disclosures = new Set<string>();
  const g = fields.generativeOverviewDisclosure?.trim();
  const r = fields.reviewSummaryDisclosure?.trim();
  if (g) disclosures.add(g);
  if (r) disclosures.add(r);

  if (disclosures.size) {
    body = `${body}\n\n${t.mapTab.spotIntroAiNote.replace("{text}", [...disclosures].join(" "))}`;
  }

  return body;
}
