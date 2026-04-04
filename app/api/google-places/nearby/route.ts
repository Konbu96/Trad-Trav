import { NextRequest, NextResponse } from "next/server";
import { getPhotoUri } from "../_lib/photo";
import { normalizePlacesText } from "../_lib/text";
import { makeLocationKey } from "../../../lib/location";

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
  title: string;
  summary: string;
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
    source: "google";
  }>;
  context: NearbyContext;
};

const NEARBY_CACHE_TTL_MS = 3 * 60 * 1000;
const nearbyCache = new Map<string, { expiresAt: number; response: NearbyRouteResponse }>();

function buildSearchableText(place: GooglePlace) {
  return `${place.displayName?.text || ""} ${place.formattedAddress || ""} ${place.primaryType || ""} ${(place.types || []).join(" ")}`;
}

async function searchNearbyContext(apiKey: string, latitude: number, longitude: number) {
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
      languageCode: "ja",
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

async function searchExperiencePlaces(apiKey: string, latitude: number, longitude: number, textQuery: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,places.photos",
    },
    body: JSON.stringify({
      textQuery: `${textQuery} 宮城`,
      languageCode: "ja",
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

function getExperienceScore(place: GooglePlace) {
  const searchable = buildSearchableText(place);
  const normalized = normalizePlacesText(searchable);
  let score = 0;

  if (place.photos?.length) score += 10;
  if (/museum|art_gallery|tourist_attraction|cultural_center|library/.test(searchable)) score += 12;
  if (/資料館|博物館|美術館|伝承館|ミュージアム/.test(searchable)) score += 18;
  if (/体験|工房|制作|絵付け|ワークショップ|伝統|郷土|文化/.test(searchable)) score += 16;
  if (/祭り|行事|演舞|神楽/.test(searchable)) score += 10;
  if (/駅|バス停|ホテル|空港/.test(searchable)) score -= 30;
  if (EXCLUDED_PRIMARY_TYPES.has(place.primaryType || "")) score -= 50;
  if (/コンビニ|病院|駐車場|ガソリン/.test(normalized)) score -= 50;

  return score;
}

function inferNearbyContext(place: GooglePlace | null): NearbyContext {
  if (!place) {
    return {
      title: "近くの施設に合わせて気を付けたいこと",
      summary: "いまいる場所に合わせて、基本のマナーと近くの体験施設をまとめています。",
      scenes: ["facility", "walking"],
    };
  }

  const searchable = buildSearchableText(place);
  const placeName = place.displayName?.text || place.formattedAddress || "近くの施設";

  if (/train_station|transit_station|bus_station/.test(searchable) || /駅|バス/.test(searchable)) {
    return {
      title: "移動中に気を付けたいこと",
      summary: `${placeName}の近くでは、通話や荷物の持ち方に気を配ると安心です。`,
      scenes: ["train", "bus", "walking"],
      placeName,
    };
  }

  if (/museum|art_gallery|library/.test(searchable) || /資料館|博物館|美術館|展示/.test(searchable)) {
    return {
      title: "施設内で気を付けたいこと",
      summary: `${placeName}のような展示施設では、静かに見学し、迷ったらスタッフに確認すると安心です。`,
      scenes: ["museum", "facility"],
      placeName,
    };
  }

  if (/体験|工房|制作|ワークショップ|store/.test(searchable) || /工房|体験|クラフト/.test(searchable)) {
    return {
      title: "体験前に気を付けたいこと",
      summary: `${placeName}の近くでは、最初の説明をよく聞き、遅れそうなときは早めに連絡すると安心です。`,
      scenes: ["workshop", "craft", "reservation"],
      placeName,
    };
  }

  if (/祭り|行事|event/.test(searchable)) {
    return {
      title: "地域イベントで気を付けたいこと",
      summary: `${placeName}の近くでは、地域の流れを優先し、ゴミの扱いにも気を配ると安心です。`,
      scenes: ["festival", "community"],
      placeName,
    };
  }

  return {
    title: "近くの施設に合わせて気を付けたいこと",
    summary: `${placeName}の近くでは、周囲への配慮を意識しながら落ち着いて行動すると安心です。`,
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

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 });
  }

  const cacheKey = makeLocationKey(lat, lng);
  const cached = nearbyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.response);
  }

  try {
    const [contextPlaces, ...experienceResultSets] = await Promise.all([
      searchNearbyContext(apiKey, lat, lng),
      ...EXPERIENCE_TEXT_QUERIES.map((textQuery) => searchExperiencePlaces(apiKey, lat, lng, textQuery)),
    ]);

    const mergedPlaces = Array.from(
      new Map(
        experienceResultSets
          .flat()
          .filter((place) => place.id)
          .map((place) => [place.id as string, place])
      ).values()
    )
      .filter((place) => getExperienceScore(place) > 0)
      .sort((a, b) => getExperienceScore(b) - getExperienceScore(a))
      .slice(0, 5);

    const locations = (await Promise.all(mergedPlaces.map(async (place) => {
      if (
        typeof place.location?.latitude !== "number" ||
        typeof place.location?.longitude !== "number"
      ) {
        return null;
      }

      const photoName = place.photos?.[0]?.name;
      const photoUri = photoName ? await getPhotoUri(apiKey, photoName) : null;
      const placeName = place.displayName?.text || "近くのスポット";
      const category = place.primaryType || place.types?.[0] || "tourist_attraction";
      const searchable = buildSearchableText(place);

      let summary = "現在地から立ち寄りやすい文化体験スポットです。";
      if (/資料館|博物館|museum|art_gallery/.test(searchable)) {
        summary = "静かに見学しながら地域文化にふれられる近くの施設です。";
      } else if (/体験|工房|ワークショップ|craft/.test(searchable)) {
        summary = "手を動かしながら文化体験を楽しめる近くのスポットです。";
      } else if (/祭り|行事|event/.test(searchable)) {
        summary = "地域の行事や催しにふれられる近くのスポットです。";
      }

      return {
        lat: place.location.latitude,
        lng: place.location.longitude,
        name: placeName,
        placeId: place.id || "",
        formattedAddress: place.formattedAddress || "",
        photos: photoUri ? [photoUri] : [],
        summary,
        category,
        type: category,
        source: "google" as const,
      };
    }))).filter((location): location is NearbyRouteResponse["locations"][number] => location !== null);

    const contextBasePlace = contextPlaces[0] || mergedPlaces[0] || null;
    const context = inferNearbyContext(contextBasePlace);

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
