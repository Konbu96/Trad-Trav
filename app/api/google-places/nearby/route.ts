import { NextRequest, NextResponse } from "next/server";
import type { TraditionalGenreId } from "../../../data/traditionalGenres";
import { maybeTranslateJapanesePlaceName } from "../../../lib/mymemoryJaToEn";
import { placesDetailLanguageCode } from "../../../lib/placesApiLanguage";
import { makeLocationKey } from "../../../lib/location";
import type { NearbyContextKind } from "../../../lib/nearbyContextCopy";
import { placesPhotoProxyUrl } from "../_lib/photo";
import { normalizePlacesText } from "../_lib/text";

type GooglePlacePhoto = {
  name?: string;
};

type GooglePlace = {
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

type GoogleNearbySearchResponse = {
  places?: GooglePlace[];
  error?: {
    message?: string;
  };
};

const EXPERIENCE_TEXT_QUERIES = [
  "伝統文化 体験",
  "工芸体験 ワークショップ",
  "資料館 博物館",
  "郷土文化 体験",
];

const EXCLUDED_PRIMARY_TYPES = new Set([
  "airport",
  "lodging",
  "hospital",
  "convenience_store",
  "gas_station",
  "parking",
]);

type NearbyContext = {
  kind: NearbyContextKind;
  scenes: string[];
  placeName?: string;
};

type NearbyRouteResponse = {
  locations: Array<{
    lat: number;
    lng: number;
    name: string;
    placeId: string;
    formattedAddress: string;
    photos: string[];
    summary: string;
    category: string;
    type: string;
    traditionalGenre: TraditionalGenreId;
    source: "google";
  }>;
  context: NearbyContext;
};

const NEARBY_CACHE_TTL_MS = 3 * 60 * 1000;
/** レスポンス形が変わったときに旧キャッシュを捨てる */
const NEARBY_CACHE_VERSION = "v4-nearby-lang";
const nearbyCache = new Map<string, { expiresAt: number; response: NearbyRouteResponse }>();

const ALLOWED_LANG = new Set(["ja", "en", "zh", "ko"]);

function buildSearchableText(place: GooglePlace) {
  return `${place.displayName?.text || ""} ${place.formattedAddress || ""} ${place.primaryType || ""} ${(place.types || []).join(" ")}`;
}

function getDistanceMeters(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(toLatitude - fromLatitude);
  const dLng = toRadians(toLongitude - fromLongitude);
  const startLat = toRadians(fromLatitude);
  const endLat = toRadians(toLatitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(startLat) * Math.cos(endLat);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function searchNearbyContext(
  apiKey: string,
  latitude: number,
  longitude: number,
  placesLanguageCode: string
) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types",
    },
    body: JSON.stringify({
      includedTypes: [
        "museum",
        "art_gallery",
        "tourist_attraction",
        "train_station",
        "transit_station",
        "bus_station",
        "library",
      ],
      maxResultCount: 5,
      rankPreference: "DISTANCE",
      languageCode: placesLanguageCode,
      regionCode: "JP",
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: 350,
        },
      },
    }),
    cache: "no-store",
  });

  const data: GoogleNearbySearchResponse = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Google nearby context search failed");
  }

  return data.places || [];
}

async function searchExperiencePlaces(
  apiKey: string,
  latitude: number,
  longitude: number,
  textQuery: string,
  placesLanguageCode: string
) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.photos",
    },
    body: JSON.stringify({
      textQuery: `${textQuery} 宮城`,
      languageCode: placesLanguageCode,
      regionCode: "JP",
      maxResultCount: 6,
      locationBias: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: 5000,
        },
      },
    }),
    cache: "no-store",
  });

  const data: GoogleNearbySearchResponse = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Google nearby experience search failed");
  }

  return data.places || [];
}

function getExperienceScore(place: GooglePlace, latitude: number, longitude: number) {
  if (
    typeof place.location?.latitude !== "number" ||
    typeof place.location?.longitude !== "number"
  ) {
    return -999;
  }

  const searchable = buildSearchableText(place);
  const normalized = normalizePlacesText(searchable);
  const distanceMeters = getDistanceMeters(
    latitude,
    longitude,
    place.location.latitude,
    place.location.longitude
  );
  const distanceKm = distanceMeters / 1000;
  let score = 0;

  // いちばん重視するのは現在地からの近さ
  score += Math.max(0, 220 - distanceKm * 55);
  if (distanceMeters <= 500) score += 60;
  else if (distanceMeters <= 1000) score += 40;
  else if (distanceMeters <= 2000) score += 24;
  else if (distanceMeters <= 3500) score += 10;

  // 立ち寄りやすい公共施設・観光施設は少し加点
  if (place.photos?.length) score += 6;
  if (/museum|art_gallery|tourist_attraction|cultural_center|library/.test(searchable)) score += 8;
  if (/資料館|博物館|美術館|伝承館|ミュージアム/.test(searchable)) score += 10;
  if (/体験|工房|制作|絵付け|ワークショップ|伝統|郷土|文化/.test(searchable)) score += 8;
  if (/祭り|行事|演舞|神楽/.test(searchable)) score += 4;
  if (/駅|バス停|ホテル|空港/.test(searchable)) score -= 24;
  if (EXCLUDED_PRIMARY_TYPES.has(place.primaryType || "")) score -= 50;
  if (/コンビニ|病院|駐車場|ガソリン/.test(normalized)) score -= 50;

  return score;
}

/** 体験予約タブと揃えた4分類（名称・型・住所テキストから推定） */
function classifyTraditionalGenre(place: GooglePlace): TraditionalGenreId {
  const searchable = buildSearchableText(place);
  const pt = place.primaryType || "";
  const types = (place.types || []).join(" ");

  if (
    /祭り|まつり|行事|七夕|フェス|祭礼|まつり協賛|まつり事務局|青葉まつり|よさこい|YOSAKOI/.test(searchable)
  ) {
    return "festival";
  }
  if (
    /神楽|能楽|狂言|民俗芸能|伝統芸能|演舞|すずめ踊り|舞臺|舞台|芸能/.test(searchable) ||
    /performing_arts/.test(`${pt} ${types}`)
  ) {
    return "performing";
  }
  if (
    /工芸|工房|こけし|箪笥|漆|陶芸|ワークショップ|体験|制作|絵付け|手しごと|手仕事|クラフト/.test(searchable) ||
    (pt === "store" && /体験|工房|制作/.test(searchable))
  ) {
    return "craft";
  }
  if (
    /博物館|資料館|美術館|郷土|歴史|ミュージアム|展示館|文化財/.test(searchable) ||
    /museum|art_gallery|historical_landmark|library|cultural_center/.test(`${pt} ${types}`)
  ) {
    return "history";
  }
  return "history";
}

function inferNearbyContext(place: GooglePlace | null): NearbyContext {
  if (!place) {
    return {
      kind: "no_place",
      scenes: ["facility", "walking"],
    };
  }

  const searchable = buildSearchableText(place);
  const placeName = place.displayName?.text || place.formattedAddress || "近くの施設";

  if (/train_station|transit_station|bus_station/.test(searchable) || /駅|バス/.test(searchable)) {
    return {
      kind: "transit",
      scenes: ["train", "bus", "walking"],
      placeName,
    };
  }

  if (/museum|art_gallery|library/.test(searchable) || /資料館|博物館|美術館|展示/.test(searchable)) {
    return {
      kind: "museum",
      scenes: ["museum", "facility"],
      placeName,
    };
  }

  if (/体験|工房|制作|ワークショップ|store/.test(searchable) || /工房|体験|クラフト/.test(searchable)) {
    return {
      kind: "workshop",
      scenes: ["workshop", "craft", "reservation"],
      placeName,
    };
  }

  if (/祭り|行事|event/.test(searchable)) {
    return {
      kind: "festival",
      scenes: ["festival", "community"],
      placeName,
    };
  }

  return {
    kind: "area",
    scenes: ["facility", "walking"],
    placeName,
  };
}

export async function GET(req: NextRequest) {
  const lat = Number.parseFloat(req.nextUrl.searchParams.get("lat") || "");
  const lng = Number.parseFloat(req.nextUrl.searchParams.get("lng") || "");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "valid lat and lng are required" }, { status: 400 });
  }

  const rawLang = req.nextUrl.searchParams.get("lang")?.trim().toLowerCase() || "ja";
  const appLang = ALLOWED_LANG.has(rawLang) ? rawLang : "ja";
  const placesLanguageCode = placesDetailLanguageCode(appLang);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 });
  }

  const cacheKey = `${makeLocationKey(lat, lng)}:${appLang}:${NEARBY_CACHE_VERSION}`;
  const cached = nearbyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.response);
  }

  try {
    const [contextPlaces, ...experienceResultSets] = await Promise.all([
      searchNearbyContext(apiKey, lat, lng, placesLanguageCode),
      ...EXPERIENCE_TEXT_QUERIES.map((textQuery) =>
        searchExperiencePlaces(apiKey, lat, lng, textQuery, placesLanguageCode)
      ),
    ]);

    const mergedPlaces = Array.from(
      new Map(
        experienceResultSets
          .flat()
          .filter((place) => place.id)
          .map((place) => [place.id as string, place])
      ).values()
    )
      .filter((place) => getExperienceScore(place, lat, lng) > 0)
      .sort((a, b) => getExperienceScore(b, lat, lng) - getExperienceScore(a, lat, lng))
      .slice(0, 5);

    const locations = (await Promise.all(mergedPlaces.map(async (place) => {
      if (
        typeof place.location?.latitude !== "number" ||
        typeof place.location?.longitude !== "number"
      ) {
        return null;
      }

      const photoName = place.photos?.[0]?.name;
      const photos = photoName ? [placesPhotoProxyUrl(photoName)] : [];
      const rawName = place.displayName?.text || "近くのスポット";
      const placeName = (await maybeTranslateJapanesePlaceName(rawName, appLang)) || rawName;
      const category = place.primaryType || place.types?.[0] || "tourist_attraction";
      const searchable = buildSearchableText(place);
      const traditionalGenre = classifyTraditionalGenre(place);

      let summary = "現在地から近く、立ち寄りやすいスポットです。";
      if (/資料館|博物館|museum|art_gallery/.test(searchable)) {
        summary = "現在地から近く、静かに見学しやすい施設です。";
      } else if (/体験|工房|ワークショップ|craft/.test(searchable)) {
        summary = "現在地から近く、立ち寄って体験しやすいスポットです。";
      } else if (/祭り|行事|event/.test(searchable)) {
        summary = "現在地から近く、地域の催しにふれやすいスポットです。";
      }

      return {
        lat: place.location.latitude,
        lng: place.location.longitude,
        name: placeName,
        placeId: place.id || "",
        formattedAddress: place.formattedAddress || "",
        photos,
        summary,
        category,
        type: category,
        traditionalGenre,
        source: "google" as const,
      };
    }))).filter((location): location is NearbyRouteResponse["locations"][number] => location !== null);

    const contextBasePlace = contextPlaces[0] || mergedPlaces[0] || null;
    const contextRaw = inferNearbyContext(contextBasePlace);
    const context =
      contextRaw.placeName != null && contextRaw.placeName !== ""
        ? {
            ...contextRaw,
            placeName:
              (await maybeTranslateJapanesePlaceName(contextRaw.placeName, appLang)) ?? contextRaw.placeName,
          }
        : contextRaw;

    const response: NearbyRouteResponse = { locations, context };
    nearbyCache.set(cacheKey, {
      expiresAt: Date.now() + NEARBY_CACHE_TTL_MS,
      response,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("google-places nearby error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
