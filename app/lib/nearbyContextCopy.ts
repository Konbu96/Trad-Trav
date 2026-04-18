import type { Translations } from "../i18n/translations";

export type NearbyContextKind = "no_place" | "transit" | "museum" | "workshop" | "festival" | "area";

/** `/api/google-places/nearby` の context ペイロード */
export type NearbyContextPayload = {
  kind: NearbyContextKind;
  scenes: string[];
  placeName?: string;
};

export function resolveNearbyMannerIntro(
  kind: NearbyContextKind,
  placeName: string | undefined,
  t: Translations
): { title: string; summary: string } {
  const place = placeName ?? "";
  switch (kind) {
    case "no_place":
      return {
        title: t.nowInfo.nearbyMannerCtxNoPlaceTitle,
        summary: t.nowInfo.nearbyMannerCtxNoPlaceSummary,
      };
    case "transit":
      return {
        title: t.nowInfo.nearbyMannerCtxTransitTitle,
        summary: t.nowInfo.nearbyMannerCtxTransitSummary.replace("{place}", place),
      };
    case "museum":
      return {
        title: t.nowInfo.nearbyMannerCtxMuseumTitle,
        summary: t.nowInfo.nearbyMannerCtxMuseumSummary.replace("{place}", place),
      };
    case "workshop":
      return {
        title: t.nowInfo.nearbyMannerCtxWorkshopTitle,
        summary: t.nowInfo.nearbyMannerCtxWorkshopSummary.replace("{place}", place),
      };
    case "festival":
      return {
        title: t.nowInfo.nearbyMannerCtxFestivalTitle,
        summary: t.nowInfo.nearbyMannerCtxFestivalSummary.replace("{place}", place),
      };
    case "area":
      return {
        title: t.nowInfo.nearbyMannerCtxAreaTitle,
        summary: t.nowInfo.nearbyMannerCtxAreaSummary.replace("{place}", place),
      };
  }
}
