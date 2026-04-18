import { NextRequest, NextResponse } from "next/server";
import { maybeTranslateJapanesePlaceName } from "../../../lib/mymemoryJaToEn";
import { googleReviewAuthorFallback, placesDetailLanguageCode } from "../../../lib/placesApiLanguage";
import { placesPhotoProxyUrl } from "../_lib/photo";

type GooglePlaceReview = {
  rating?: number;
  publishTime?: string;
  text?: {
    text?: string;
  };
  authorAttribution?: {
    displayName?: string;
  };
};

type GooglePlacePhoto = {
  name?: string;
};

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
  reviews?: GooglePlaceReview[];
  photos?: GooglePlacePhoto[];
  error?: {
    message?: string;
  };
};

const ALLOWED_LANG = new Set(["ja", "en", "zh", "ko"]);

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId")?.trim();
  if (!placeId) {
    return NextResponse.json({ error: "placeId is required" }, { status: 400 });
  }

  const rawLang = req.nextUrl.searchParams.get("lang")?.trim().toLowerCase() || "ja";
  const appLang = ALLOWED_LANG.has(rawLang) ? rawLang : "ja";
  const languageCode = placesDetailLanguageCode(appLang);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const id = placeId.replace(/^places\//, "");
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=${encodeURIComponent(languageCode)}&regionCode=JP`,
      {
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
            "reviews",
            "photos",
          ].join(","),
        },
        cache: "no-store",
      }
    );

    const data: GooglePlaceDetailResponse = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Google Place detail fetch failed" },
        { status: res.status }
      );
    }

    const authorFallback = googleReviewAuthorFallback(languageCode);

    const reviews = (data.reviews || [])
      .map(review => ({
        author: review.authorAttribution?.displayName || authorFallback,
        rating: Math.max(1, Math.min(5, Math.round(review.rating || 0))) || 0,
        comment: review.text?.text || "",
        date: (review.publishTime || "").split("T")[0] || "",
      }))
      .filter(review => review.rating > 0 && review.comment);

    const photoNames = (data.photos || [])
      .map(photo => photo.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 8);

    const photos = photoNames.map((photoName) => placesPhotoProxyUrl(photoName));

    const name = await maybeTranslateJapanesePlaceName(data.displayName?.text, appLang);

    return NextResponse.json({
      name,
      address: data.formattedAddress,
      category: data.primaryType,
      phone: data.nationalPhoneNumber,
      website: data.websiteUri,
      mapsUrl: data.googleMapsUri,
      hours: data.regularOpeningHours?.weekdayDescriptions?.join(" / "),
      reviews,
      photos,
    });
  } catch (error) {
    console.error("google-places detail error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
