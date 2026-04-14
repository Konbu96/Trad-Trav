import { NextRequest, NextResponse } from "next/server";
import {
  CURATED_TRADITIONAL_PLACES,
  TRADITIONAL_GENRES,
  type TraditionalGenreId,
} from "../../../data/traditionalGenres";
import { placesPhotoProxyUrl } from "../_lib/photo";

/** experienceTitle が無い候補用。概要の一行目を短く一覧向けラベルにする */
function shortExperienceFromSummary(summary: string, genreFallback: string): string {
  const line = summary.split(/[。\n]/)[0]?.trim() || summary.trim();
  if (!line) return genreFallback;
  const compact = line.replace(/です$/, "").replace(/^[、。・\s]+/, "").trim();
  if (compact.length <= 22) return compact;
  return `${compact.slice(0, 20)}…`;
}

type GooglePlacePhoto = {
  name?: string;
};

type GoogleTextSearchPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  primaryType?: string;
  types?: string[];
  photos?: GooglePlacePhoto[];
};

type GoogleCuratedPlaceResponse = {
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  primaryType?: string;
  photos?: GooglePlacePhoto[];
  error?: {
    message?: string;
  };
};

type GoogleTextSearchResponse = {
  places?: GoogleTextSearchPlace[];
  error?: {
    message?: string;
  };
};

function normalizePlaceIdForV1(placeId: string) {
  return placeId.replace(/^places\//, "");
}

const PREVIEW_CURATED_MAX = 5;
const EXPANDED_TOTAL_MAX = 30;

const MIYAGI_BOUNDS = {
  minLat: 37.75,
  maxLat: 39.05,
  minLng: 140.45,
  maxLng: 141.95,
};

const EXPANSION_EXCLUDED_PRIMARY = new Set([
  "airport",
  "bus_stop",
  "train_station",
  "transit_station",
  "subway_station",
  "parking",
  "gas_station",
  "lodging",
]);

function isInMiyagiBounds(lat: number, lng: number) {
  return (
    lat >= MIYAGI_BOUNDS.minLat &&
    lat <= MIYAGI_BOUNDS.maxLat &&
    lng >= MIYAGI_BOUNDS.minLng &&
    lng <= MIYAGI_BOUNDS.maxLng
  );
}

const GENRE_EXPAND_QUERIES: Record<TraditionalGenreId, string[]> = {
  performing: [
    "宮城県 伝統芸能 神楽",
    "宮城県 能 狂言 体験",
    "宮城県 民俗芸能 踊り",
  ],
  festival: ["宮城県 祭り まつり", "宮城県 七夕 行事", "宮城県 地域祭り イベント"],
  craft: ["宮城県 伝統工芸 体験", "宮城県 こけし 工房", "宮城県 漆 箪笥 工芸"],
  history: ["宮城県 博物館", "宮城県 郷土資料館", "宮城県 歴史 文化財 見学"],
};

function isLikelyTraditionalExpansionPlace(place: GoogleTextSearchPlace): boolean {
  const pt = place.primaryType || "";
  if (EXPANSION_EXCLUDED_PRIMARY.has(pt)) return false;
  const text = `${place.displayName?.text || ""} ${place.formattedAddress || ""} ${pt} ${(place.types || []).join(" ")}`;
  if (
    /伝統|郷土|民俗|文化財|博物|資料館|工芸|神楽|能楽|祭|まつり|体験|こけし|寺|神社|城|演舞|芸能/.test(text)
  ) {
    return true;
  }
  return /museum|art_gallery|cultural_center|tourist_attraction|historical_landmark|performing_arts|church|hindu_temple|shrine/.test(
    pt
  );
}

type CuratedLocation = {
  lat: number;
  lng: number;
  name: string;
  placeId: string;
  formattedAddress?: string;
  category?: string;
  type?: string;
  genreLabel: string;
  experienceCategory?: string;
  photos: string[];
  summary: string;
  officialSourceUrl?: string;
  source: "google";
};

async function searchTextMiyagiExpansion(
  apiKey: string,
  textQuery: string
): Promise<GoogleTextSearchPlace[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.photos",
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "ja",
      regionCode: "JP",
      maxResultCount: 20,
      locationRestriction: {
        rectangle: {
          low: { latitude: MIYAGI_BOUNDS.minLat, longitude: MIYAGI_BOUNDS.minLng },
          high: { latitude: MIYAGI_BOUNDS.maxLat, longitude: MIYAGI_BOUNDS.maxLng },
        },
      },
    }),
    cache: "no-store",
  });
  const data: GoogleTextSearchResponse = await res.json();
  if (!res.ok || !data.places?.length) {
    return [];
  }
  return data.places;
}

async function mergeExpansionPlaces(
  apiKey: string,
  genre: TraditionalGenreId,
  genreConfig: (typeof TRADITIONAL_GENRES)[number],
  curatedLocations: CuratedLocation[]
): Promise<CuratedLocation[]> {
  const seen = new Set<string>();
  for (const loc of curatedLocations) {
    if (loc.placeId) seen.add(normalizePlaceIdForV1(loc.placeId));
  }

  const extra: CuratedLocation[] = [];
  const queries = GENRE_EXPAND_QUERIES[genre] || [];

  for (const q of queries) {
    if (curatedLocations.length + extra.length >= EXPANDED_TOTAL_MAX) break;
    let places: GoogleTextSearchPlace[] = [];
    try {
      places = await searchTextMiyagiExpansion(apiKey, q);
    } catch {
      continue;
    }
    for (const place of places) {
      if (curatedLocations.length + extra.length >= EXPANDED_TOTAL_MAX) break;
      if (!place.id || !place.displayName?.text) continue;
      const pid = normalizePlaceIdForV1(place.id);
      if (seen.has(pid)) continue;
      const lat = place.location?.latitude;
      const lng = place.location?.longitude;
      if (typeof lat !== "number" || typeof lng !== "number" || !isInMiyagiBounds(lat, lng)) continue;
      if (!isLikelyTraditionalExpansionPlace(place)) continue;

      seen.add(pid);
      const photoName = place.photos?.[0]?.name;
      const photos = photoName ? [placesPhotoProxyUrl(photoName)] : [];

      extra.push({
        lat,
        lng,
        name: place.displayName.text,
        placeId: pid,
        formattedAddress: place.formattedAddress,
        category: place.primaryType,
        type: place.types?.[0] || place.primaryType,
        genreLabel: genreConfig.label,
        experienceCategory: genreConfig.label,
        photos,
        summary: `${place.displayName.text}（${genreConfig.label}関連のスポット）`,
        source: "google",
      });
    }
  }

  return [...curatedLocations, ...extra].slice(0, EXPANDED_TOTAL_MAX);
}

/**
 * Place Details では photos が空のことがある。体験予約の棚だけ写真が欠けるため、
 * 施設名で Text Search し、写真がある候補から 1 件だけ photo リソース名を取る（座標・名前は既存 detail のまま）。
 */
async function fetchPhotoNameByTextSearch(
  apiKey: string,
  queryBase: string,
  locationBias?: { lat: number; lng: number }
): Promise<string | null> {
  const textQuery = queryBase.includes("宮城") ? queryBase : `${queryBase} 宮城県`;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.displayName,places.photos,places.googleMapsUri",
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "ja",
      regionCode: "JP",
      maxResultCount: 10,
      ...(locationBias
        ? {
            locationBias: {
              circle: {
                center: { latitude: locationBias.lat, longitude: locationBias.lng },
                radius: 500,
              },
            },
          }
        : {}),
    }),
    cache: "no-store",
  });

  const data: GoogleTextSearchResponse = await res.json();
  if (!res.ok || !data.places?.length) {
    return null;
  }

  const compact = (s: string) => s.replace(/\s+/g, "");
  const cq = compact(queryBase);
  const minOverlap = 4;

  if (cq.length >= minOverlap) {
    for (const p of data.places) {
      const title = p.displayName?.text || "";
      const ct = compact(title);
      const photoName = p.photos?.[0]?.name;
      if (photoName && (ct.includes(cq) || (ct.length >= minOverlap && cq.includes(ct)))) {
        return photoName;
      }
    }
  }

  for (const p of data.places) {
    const photoName = p.photos?.[0]?.name;
    if (photoName) {
      return photoName;
    }
  }

  return null;
}

async function ensureCuratedPhotos(
  apiKey: string,
  detail: {
    photos: string[];
    placeId?: string;
    name?: string;
    address?: string;
    lat?: number;
    lng?: number;
    category?: string;
  },
  fallbackLabel: string
) {
  if (detail.photos.length > 0) {
    return detail;
  }

  const bias =
    typeof detail.lat === "number" && typeof detail.lng === "number"
      ? { lat: detail.lat, lng: detail.lng }
      : undefined;

  const photoName = await fetchPhotoNameByTextSearch(apiKey, fallbackLabel, bias);
  if (!photoName) {
    return detail;
  }

  return {
    ...detail,
    photos: [placesPhotoProxyUrl(photoName)],
  };
}

async function getCuratedPlace(apiKey: string, placeId: string) {
  const id = normalizePlaceIdForV1(placeId);
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=ja&regionCode=JP`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "displayName",
          "formattedAddress",
          "location",
          "primaryType",
          "photos",
        ].join(","),
      },
      cache: "no-store",
    }
  );

  const data: GoogleCuratedPlaceResponse = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Google curated place fetch failed");
  }

  const photoName = data.photos?.[0]?.name;
  const photos = photoName ? [placesPhotoProxyUrl(photoName)] : [];

  return {
    placeId: id,
    name: data.displayName?.text,
    address: data.formattedAddress,
    lat: data.location?.latitude,
    lng: data.location?.longitude,
    category: data.primaryType,
    photos,
  };
}

async function searchCuratedPlaceByText(apiKey: string, fallbackName: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.photos,places.googleMapsUri",
    },
    body: JSON.stringify({
      textQuery: fallbackName.includes("宮城") ? fallbackName : `${fallbackName} 宮城県`,
      languageCode: "ja",
      regionCode: "JP",
      maxResultCount: 1,
    }),
    cache: "no-store",
  });

  const data: GoogleTextSearchResponse = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Google curated text search failed");
  }

  const place = data.places?.[0];
  if (!place) {
    throw new Error("Curated fallback place was not found");
  }

  const photoName = place.photos?.[0]?.name;
  let photos: string[] = photoName ? [placesPhotoProxyUrl(photoName)] : [];

  const resolvedId = place.id ? normalizePlaceIdForV1(place.id) : "";

  if (!photos.length && resolvedId) {
    try {
      const refreshed = await getCuratedPlace(apiKey, resolvedId);
      if (refreshed.photos.length > 0) {
        photos = refreshed.photos;
      }
    } catch {
      // keep empty photos
    }
  }

  return {
    placeId: resolvedId || undefined,
    name: place.displayName?.text,
    address: place.formattedAddress,
    lat: place.location?.latitude,
    lng: place.location?.longitude,
    category: place.primaryType,
    photos,
  };
}

export async function GET(req: NextRequest) {
  const genre = req.nextUrl.searchParams.get("genre") as TraditionalGenreId | null;
  if (!genre || !TRADITIONAL_GENRES.some(item => item.id === genre)) {
    return NextResponse.json({ error: "valid genre is required" }, { status: 400 });
  }
  const genreConfig = TRADITIONAL_GENRES.find(item => item.id === genre);
  if (!genreConfig) {
    return NextResponse.json({ error: "genre config not found" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const expanded = req.nextUrl.searchParams.get("expanded") === "1";
    const fullCuratedList = CURATED_TRADITIONAL_PLACES[genre] || [];
    const curatedPlaces = expanded
      ? fullCuratedList
      : fullCuratedList.slice(0, PREVIEW_CURATED_MAX);

    let failedCount = 0;
    const resolved = (await Promise.all(
      curatedPlaces.map(async (place) => {
        try {
          let detail;
          try {
            detail = await getCuratedPlace(apiKey, place.placeId);
          } catch (error) {
            console.warn("curated placeId lookup failed, trying text search:", place.fallbackName, error);
            detail = await searchCuratedPlaceByText(apiKey, place.fallbackName);
          }

          detail = await ensureCuratedPhotos(apiKey, detail, place.fallbackName);

          if (detail.photos.length === 0 && place.imageUrl) {
            detail = { ...detail, photos: [place.imageUrl] };
          }

          if (typeof detail.lat !== "number" || typeof detail.lng !== "number") {
            failedCount += 1;
            return null;
          }

          const experienceCategory =
            place.experienceTitle?.trim() ||
            shortExperienceFromSummary(place.summary, genreConfig.label);

          const loc: CuratedLocation = {
            lat: detail.lat,
            lng: detail.lng,
            name: detail.name || place.fallbackName,
            placeId: detail.placeId || normalizePlaceIdForV1(place.placeId),
            formattedAddress: detail.address,
            category: detail.category,
            type: detail.category,
            genreLabel: genreConfig.label,
            experienceCategory,
            photos: detail.photos,
            summary: place.experienceTitle
              ? `${place.experienceTitle}体験ができます。${place.summary}`
              : place.summary,
            officialSourceUrl: place.officialSourceUrl,
            source: "google",
          };
          return loc;
        } catch (error) {
          failedCount += 1;
          console.error("google-places curated mapping error:", error);
          return null;
        }
      })
    )) as (CuratedLocation | null)[];
    let locations: CuratedLocation[] = resolved.filter((x): x is CuratedLocation => x != null);

    if (expanded && locations.length < EXPANDED_TOTAL_MAX) {
      locations = await mergeExpansionPlaces(apiKey, genre, genreConfig, locations);
    }

    if (curatedPlaces.length > 0 && locations.length === 0 && failedCount > 0) {
      return NextResponse.json(
        { error: "curated places could not be loaded" },
        { status: 502 }
      );
    }

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("google-places curated error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
