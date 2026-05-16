import type { Spot } from "../data/spots";
import { TRADITIONAL_GENRES, type TraditionalGenreId } from "../data/traditionalGenres";
import type { Translations } from "../i18n/translations";
import type { LocalizedSearchLocationFields, SearchLocation } from "../components/SearchBar";
import { buildSpotIntroFromPlaces } from "./spotIntroFromPlaces";

const GENRES = TRADITIONAL_GENRES;
type GenreId = TraditionalGenreId;

const GENRE_HEADING: Record<GenreId, (t: Translations) => string> = {
  festival: (t) => t.mapTab.genreFestival,
  performing: (t) => t.mapTab.genrePerforming,
  history: (t) => t.mapTab.genreHistory,
  craft: (t) => t.mapTab.genreCraft,
};

export function genreHeading(id: GenreId, t: Translations): string {
  return (GENRE_HEADING[id] ?? (() => t.mapTab.genreDefault))(t);
}

/** Places の primaryType / types から体験発掘のジャンル ID を推定 */
export function inferTraditionalGenreFromGoogleTypes(category?: string, type?: string): GenreId {
  const source = `${category || ""} ${type || ""}`;
  if (/festival|event/.test(source)) return "festival";
  if (/performing_arts|dance|music/.test(source)) return "performing";
  if (/museum|art_gallery|historical|history_museum/.test(source)) return "history";
  if (/educational_institution|store|point_of_interest|tourist_attraction|manufacturer/.test(source)) return "craft";
  return "craft";
}

export function resolvePanelSpotCategoryLabel(
  t: Translations,
  traditionalGenre: TraditionalGenreId | undefined,
  googleCategory?: string,
  googleType?: string
): string {
  const id = traditionalGenre ?? inferTraditionalGenreFromGoogleTypes(googleCategory, googleType);
  return genreHeading(id, t);
}

export type PanelSpot = Spot & { placeId?: string; source?: "google" | "local" };

export function buildPanelSpotFromSearchLocation(
  location: SearchLocation,
  index: number,
  spotDescriptionFallback: string,
  addressLabel: string,
  t: Translations,
  language: "ja" | "en" | "zh" | "ko"
): PanelSpot {
  const localized = (language === "ja" ? undefined : location.localized?.[language]) as
    | LocalizedSearchLocationFields
    | undefined;
  const name = localized?.name?.trim() || location.name;
  const formattedAddress = localized?.formattedAddress?.trim() || location.formattedAddress;
  const summary = localized?.summary;
  const overview = localized?.overview ?? (language === "ja" ? location.overview : undefined);
  const generativeOverview =
    localized?.generativeOverview ?? (language === "ja" ? location.generativeOverview : undefined);
  const generativeOverviewDisclosure =
    localized?.generativeOverviewDisclosure ??
    (language === "ja" ? location.generativeOverviewDisclosure : undefined);
  const reviewSummary = localized?.reviewSummary ?? (language === "ja" ? location.reviewSummary : undefined);
  const reviewSummaryDisclosure =
    localized?.reviewSummaryDisclosure ?? (language === "ja" ? location.reviewSummaryDisclosure : undefined);
  const primaryTypeDisplayName =
    localized?.primaryTypeDisplayName ?? (language === "ja" ? location.primaryTypeDisplayName : undefined);
  const reviews = localized?.reviews ?? (language === "ja" ? location.reviews : undefined);
  const hours = localized?.hours ?? (language === "ja" ? location.hours : undefined);

  const genreId = location.traditionalGenre ?? inferTraditionalGenreFromGoogleTypes(location.category, location.type);
  const category = genreHeading(genreId, t);
  const address = formattedAddress || name;
  const curated = summary?.trim() || (language === "ja" ? location.summary?.trim() : undefined);
  const description = buildSpotIntroFromPlaces(
    {
      overview,
      generativeOverview,
      reviewSummary,
      curatedSummary: curated,
      generativeOverviewDisclosure,
      reviewSummaryDisclosure,
      rating: location.rating,
      userRatingCount: location.userRatingCount,
      primaryTypeDisplayName,
    },
    { t, categoryLabel: category, fallbackDescription: spotDescriptionFallback }
  );
  const infos: Spot["infos"] = [{ type: "address", label: addressLabel, value: address }];
  if (hours?.trim()) infos.push({ type: "hours", label: t.spot.hours, value: hours.trim() });
  if (location.phone?.trim()) infos.push({ type: "phone", label: t.spot.phone, value: location.phone.trim() });
  if (location.website?.trim()) infos.push({ type: "website", label: t.spot.website, value: location.website.trim() });
  if (location.mapsUrl?.trim()) infos.push({ type: "maps", label: t.map.googleMaps, value: location.mapsUrl.trim() });

  return {
    id: -5000 - index,
    name,
    lat: location.lat,
    lng: location.lng,
    description,
    category,
    traditionalGenre: genreId,
    reviews: reviews?.length ? [...reviews] : [],
    infos,
    photos: location.photos,
    placeId: location.placeId,
    source: location.source,
    curatedSummary: curated || undefined,
  };
}

export { GENRES as TRADITIONAL_GENRE_LIST };
