import type { Spot } from "../data/spots";
import type { Translations } from "../i18n/translations";
import { buildSpotIntroFromPlaces } from "./spotIntroFromPlaces";
import { resolvePanelSpotCategoryLabel, type PanelSpot } from "./panelSpotFromSearchLocation";

export type GooglePlaceDetailResponse = {
  name?: string;
  address?: string;
  category?: string;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  hours?: string;
  reviews?: Spot["reviews"];
  photos?: string[];
  overview?: string;
  generativeOverview?: string;
  generativeOverviewDisclosure?: string;
  reviewSummary?: string;
  reviewSummaryDisclosure?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: string;
  error?: string;
};

export async function fetchGooglePlaceDetail(
  placeId: string,
  language: string
): Promise<GooglePlaceDetailResponse> {
  const res = await fetch(
    `/api/google-places/detail?placeId=${encodeURIComponent(placeId)}&lang=${encodeURIComponent(language)}`
  );
  const info: GooglePlaceDetailResponse = await res.json();
  if (!res.ok) {
    throw new Error(info.error || "detail fetch failed");
  }
  return info;
}

export function mergeGooglePlaceDetailIntoSpot(
  spot: PanelSpot,
  info: GooglePlaceDetailResponse,
  t: Translations,
  spotDescriptionFallback: string
): PanelSpot {
  const extraInfos: Spot["infos"] = [];
  if (info.hours) extraInfos.push({ type: "hours", label: t.spot.hours, value: info.hours });
  if (info.address) extraInfos.push({ type: "address", label: t.spot.address, value: info.address });
  if (info.phone) extraInfos.push({ type: "phone", label: t.spot.phone, value: info.phone });
  if (info.website) extraInfos.push({ type: "website", label: t.spot.website, value: info.website });
  if (info.mapsUrl) extraInfos.push({ type: "maps", label: t.map.googleMaps, value: info.mapsUrl });

  const categoryNext = info.category
    ? resolvePanelSpotCategoryLabel(t, spot.traditionalGenre, info.category, info.category)
    : spot.category;
  const descriptionNext = buildSpotIntroFromPlaces(
    {
      overview: info.overview,
      generativeOverview: info.generativeOverview,
      reviewSummary: info.reviewSummary,
      curatedSummary: spot.curatedSummary,
      generativeOverviewDisclosure: info.generativeOverviewDisclosure,
      reviewSummaryDisclosure: info.reviewSummaryDisclosure,
      rating: info.rating,
      userRatingCount: info.userRatingCount,
      primaryTypeDisplayName: info.primaryTypeDisplayName,
    },
    { t, categoryLabel: categoryNext, fallbackDescription: spotDescriptionFallback }
  );

  return {
    ...spot,
    name: info.name || spot.name,
    category: categoryNext,
    description: descriptionNext,
    reviews: info.reviews?.length ? info.reviews : spot.reviews,
    photos: info.photos?.length ? info.photos : spot.photos,
    infos: [
      ...spot.infos.filter(
        (prevInfo) =>
          !extraInfos.some((nextInfo) => nextInfo.type === prevInfo.type && nextInfo.label === prevInfo.label)
      ),
      ...extraInfos,
    ],
  };
}
