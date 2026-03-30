import { NextRequest, NextResponse } from "next/server";

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
};

type GoogleTextSearchResponse = {
  places?: GoogleTextSearchPlace[];
  error?: {
    message?: string;
  };
};

function isInMiyagi(lat: number, lng: number) {
  return (
    lat >= MIYAGI_BOUNDS.minLat &&
    lat <= MIYAGI_BOUNDS.maxLat &&
    lng >= MIYAGI_BOUNDS.minLng &&
    lng <= MIYAGI_BOUNDS.maxLng
  );
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

  const textQuery = query.includes("宮城") ? query : `${query} 宮城県`;

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types",
      },
      body: JSON.stringify({
        textQuery,
        languageCode: "ja",
        regionCode: "JP",
        maxResultCount: 10,
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
      return NextResponse.json(
        { error: data.error?.message || "Google Places search failed" },
        { status: res.status }
      );
    }

    const locations = (data.places || [])
      .map(place => {
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

        return {
          lat,
          lng,
          name: place.displayName.text,
          placeId: place.id,
          formattedAddress: place.formattedAddress,
          category: place.primaryType,
          type: place.types?.[0] || place.primaryType,
          source: "google" as const,
        };
      })
      .filter(Boolean)
      .slice(0, 10);

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("google-places search error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
