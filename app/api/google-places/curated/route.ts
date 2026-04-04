import { NextRequest, NextResponse } from "next/server";
import {
  CURATED_TRADITIONAL_PLACES,
  TRADITIONAL_GENRES,
  type TraditionalGenreId,
} from "../../../data/traditionalGenres";
import { getPhotoUri } from "../_lib/photo";

type GooglePlacePhoto = {
  name?: string;
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

async function getCuratedPlace(apiKey: string, placeId: string) {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ja&regionCode=JP`,
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
  const photoUri = photoName ? await getPhotoUri(apiKey, photoName) : null;

  return {
    name: data.displayName?.text,
    address: data.formattedAddress,
    lat: data.location?.latitude,
    lng: data.location?.longitude,
    category: data.primaryType,
    photos: photoUri ? [photoUri] : [],
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
    const curatedPlaces = CURATED_TRADITIONAL_PLACES[genre] || [];
    const locations = (await Promise.all(curatedPlaces.map(async (place) => {
      try {
        const detail = await getCuratedPlace(apiKey, place.placeId);
        if (
          typeof detail.lat !== "number" ||
          typeof detail.lng !== "number"
        ) {
          return null;
        }

        return {
          lat: detail.lat,
          lng: detail.lng,
          name: detail.name || place.fallbackName,
          placeId: place.placeId,
          formattedAddress: detail.address,
          category: detail.category,
          type: detail.category,
          genreLabel: genreConfig.label,
          photos: detail.photos,
          summary: place.experienceTitle
            ? `${place.experienceTitle}体験ができます。${place.summary}`
            : place.summary,
          officialSourceUrl: place.officialSourceUrl,
          source: "google" as const,
        };
      } catch (error) {
        console.error("google-places curated mapping error:", error);
        return null;
      }
    }))).filter(Boolean);

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("google-places curated error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
