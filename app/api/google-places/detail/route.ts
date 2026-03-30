import { NextRequest, NextResponse } from "next/server";

type GooglePlaceDetailResponse = {
  displayName?: { text?: string };
  formattedAddress?: string;
  primaryType?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  googleMapsUri?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  error?: {
    message?: string;
  };
};

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId")?.trim();
  if (!placeId) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ja&regionCode=JP`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "displayName",
          "formattedAddress",
          "primaryType",
          "websiteUri",
          "nationalPhoneNumber",
          "googleMapsUri",
          "regularOpeningHours.weekdayDescriptions",
        ].join(","),
      },
      cache: "no-store",
    });

    const data: GooglePlaceDetailResponse = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Google Place detail fetch failed" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      name: data.displayName?.text,
      address: data.formattedAddress,
      category: data.primaryType,
      phone: data.nationalPhoneNumber,
      website: data.websiteUri,
      mapsUrl: data.googleMapsUri,
      hours: data.regularOpeningHours?.weekdayDescriptions?.join(" / "),
    });
  } catch (error) {
    console.error("google-places detail error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
