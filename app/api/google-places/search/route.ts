import { NextRequest, NextResponse } from "next/server";
import { maybeTranslateJapanesePlaceName } from "../../../lib/mymemoryJaToEn";
import { placesDetailLanguageCode } from "../../../lib/placesApiLanguage";
import { placesPhotoProxyUrl } from "../_lib/photo";
import { normalizePlacesText } from "../_lib/text";

const ALLOWED_LANG = new Set(["ja", "en", "zh", "ko"]);

const MIYAGI_BOUNDS = {
  minLat: 37.75,
  maxLat: 39.05,
  minLng: 140.45,
  maxLng: 141.95,
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
  photos?: Array<{
    name?: string;
  }>;
};

type GoogleTextSearchResponse = {
  places?: GoogleTextSearchPlace[];
  error?: {
    message?: string;
  };
};

const EXCLUDED_PRIMARY_TYPES = new Set([
  "airport",
  "bus_stop",
  "train_station",
  "transit_station",
  "subway_station",
  "taxi_stand",
  "route",
  "intersection",
  "parking",
  "gas_station",
  "lodging",
]);

const TRADITIONAL_KEYWORDS = [
  "伝統",
  "郷土",
  "民俗",
  "文化財",
  "無形",
  "歴史",
  "由来",
  "江戸",
  "工芸",
  "伝統芸能",
  "郷土芸能",
  "神楽",
  "舞踊",
  "演舞",
  "祭り",
  "行事",
  "資料館",
  "博物館",
  "民俗資料館",
  "歴史博物館",
  "こけし",
  "鳴子",
  "箪笥",
  "仙台箪笥",
  "漆",
  "染",
  "織",
  "手仕事",
  "手しごと",
];

const TRADITIONAL_EXPERIENCE_KEYWORDS = [
  "体験",
  "見学",
  "絵付け",
  "工房",
  "制作",
  "実演",
  "参加",
];

const NON_TRADITIONAL_EXCLUDE_KEYWORDS = [
  "ステンドグラス",
  "ガラス工房",
  "ガラス体験",
  "ハーバリウム",
  "レジン",
  "キャンドル",
  "アクセサリー作り",
];

function isInMiyagi(lat: number, lng: number) {
  return (
    lat >= MIYAGI_BOUNDS.minLat &&
    lat <= MIYAGI_BOUNDS.maxLat &&
    lng >= MIYAGI_BOUNDS.minLng &&
    lng <= MIYAGI_BOUNDS.maxLng
  );
}

function buildSearchQueries(query: string) {
  const base = query.includes("宮城") ? query : `${query} 宮城県`;
  return Array.from(new Set([
    `${base} 伝統文化`,
    `${base} 郷土芸能 神楽 演舞`,
    `${base} 伝統工芸 こけし 仙台箪笥`,
    `${base} 郷土資料館 博物館`,
    `${base} 民俗 歴史 文化財`,
    base,
  ]));
}

function hasTraditionalSignals(searchable: string) {
  return TRADITIONAL_KEYWORDS.some(keyword => searchable.includes(keyword));
}

function isGenericCraftButNotTraditional(searchable: string) {
  if (NON_TRADITIONAL_EXCLUDE_KEYWORDS.some(keyword => searchable.includes(keyword))) {
    return true;
  }

  const mentionsGenericPottery = /陶芸|陶芸体験|焼き物/.test(searchable);
  const mentionsTraditionalPottery = /会津本郷焼|こけし|鳴子|仙台箪笥|伝統工芸|郷土/.test(searchable);
  return mentionsGenericPottery && !mentionsTraditionalPottery;
}

function isTraditionalCulturePlace(place: GoogleTextSearchPlace) {
  const displayName = place.displayName?.text || "";
  const primaryType = place.primaryType || "";
  const types = place.types || [];
  const searchable = `${displayName} ${place.formattedAddress || ""} ${primaryType} ${types.join(" ")}`;

  if (EXCLUDED_PRIMARY_TYPES.has(primaryType)) return false;
  if (/駅前|仙台駅|空港|バス停/.test(displayName)) return false;
  if (isGenericCraftButNotTraditional(searchable)) return false;

  const hasTraditional = hasTraditionalSignals(searchable);
  const hasTraditionalExperience = TRADITIONAL_EXPERIENCE_KEYWORDS.some(keyword => searchable.includes(keyword));
  const isHistoryFacility = /資料館|博物館|民俗資料館|歴史博物館/.test(searchable);

  return hasTraditional || (hasTraditional && hasTraditionalExperience) || isHistoryFacility;
}

function matchesQueryName(place: GoogleTextSearchPlace, query: string) {
  const normalizedName = normalizePlacesText(place.displayName?.text || "");
  const normalizedQuery = normalizePlacesText(query);
  return normalizedQuery.length > 0 && normalizedName.includes(normalizedQuery);
}

function getExperienceScore(place: GoogleTextSearchPlace, query: string) {
  const displayName = place.displayName?.text || "";
  const primaryType = place.primaryType || "";
  const types = place.types || [];
  const searchable = `${displayName} ${place.formattedAddress || ""} ${primaryType} ${types.join(" ")}`;

  let score = 0;

  if (matchesQueryName(place, query)) score += 100;
  if (place.photos?.length) score += 12;
  if (hasTraditionalSignals(searchable)) score += 24;
  if (/郷土芸能|神楽|舞踊|演舞|祭り|行事/.test(searchable)) score += 16;
  if (/資料館|博物館|民俗|歴史|文化財/.test(searchable)) score += 12;
  if (/体験|見学|絵付け|制作|実演|参加/.test(searchable)) score += 8;
  if (/educational_institution|museum|history_museum|tourist_attraction/.test(primaryType)) score += 6;
  if (/駅前|駅|空港|バス停/.test(displayName)) score -= 30;
  if (isGenericCraftButNotTraditional(searchable)) score -= 40;

  return score;
}

async function searchPlaces(apiKey: string, textQuery: string, placesLanguageCode: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.photos",
    },
    body: JSON.stringify({
      textQuery,
      languageCode: placesLanguageCode,
      regionCode: "JP",
      maxResultCount: 8,
      locationRestriction: {
        rectangle: {
          low: {
            latitude: MIYAGI_BOUNDS.minLat,
            longitude: MIYAGI_BOUNDS.minLng,
          },
          high: {
            latitude: MIYAGI_BOUNDS.maxLat,
            longitude: MIYAGI_BOUNDS.maxLng,
          },
        },
      },
    }),
    cache: "no-store",
  });

  const data: GoogleTextSearchResponse = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Google Places search failed");
  }
  return data.places || [];
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 });
  }

  const rawLang = req.nextUrl.searchParams.get("lang")?.trim().toLowerCase() || "ja";
  const appLang = ALLOWED_LANG.has(rawLang) ? rawLang : "ja";
  const placesLanguageCode = placesDetailLanguageCode(appLang);

  try {
    const searchQueries = buildSearchQueries(query);
    const resultSets = await Promise.all(
      searchQueries.map((textQuery) => searchPlaces(apiKey, textQuery, placesLanguageCode))
    );

    const uniquePlaces = new Map<string, GoogleTextSearchPlace>();
    for (const places of resultSets) {
      for (const place of places) {
        if (place.id && !uniquePlaces.has(place.id)) {
          uniquePlaces.set(place.id, place);
        }
      }
    }

    const filteredPlaces = Array.from(uniquePlaces.values())
      .filter(place => matchesQueryName(place, query) || isTraditionalCulturePlace(place))
      .sort((a, b) => {
        return getExperienceScore(b, query) - getExperienceScore(a, query);
      })
      .slice(0, 20);

    const locations = (await Promise.all(filteredPlaces.map(async place => {
      try {
        const lat = place.location?.latitude;
        const lng = place.location?.longitude;
        if (
          typeof lat !== "number" ||
          typeof lng !== "number" ||
          !place.displayName?.text ||
          !isInMiyagi(lat, lng)
        ) {
          return null;
        }

        const photoName = place.photos?.[0]?.name;
        const photos = photoName ? [placesPhotoProxyUrl(photoName)] : [];
        const displayName = place.displayName.text;
        const name = (await maybeTranslateJapanesePlaceName(displayName, appLang)) || displayName;

        return {
          lat,
          lng,
          name,
          placeId: place.id,
          formattedAddress: place.formattedAddress,
          category: place.primaryType,
          type: place.types?.[0] || place.primaryType,
          photos,
          source: "google" as const,
        };
      } catch (error) {
        console.error("google-places search mapping error:", error);
        return null;
      }
    })))
      .filter(Boolean);

    return NextResponse.json({ locations });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("google-places search error:", error);
    return NextResponse.json(
      {
        error: "internal error",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
