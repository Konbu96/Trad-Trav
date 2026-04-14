import { NextRequest, NextResponse } from "next/server";
import {
  fetchPlacePhotoImage,
  getPhotoUri,
  isValidPlacesPhotoName,
  normalizePlacesPhotoName,
} from "../_lib/photo";

export async function GET(req: NextRequest) {
  const name = normalizePlacesPhotoName(req.nextUrl.searchParams.get("name") || "");
  if (!name || !isValidPlacesPhotoName(name)) {
    return NextResponse.json({ error: "valid photo name is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 });
  }

  const photoUri = await getPhotoUri(apiKey, name);
  if (photoUri) {
    try {
      const u = new URL(photoUri);
      if (u.protocol === "https:") {
        return NextResponse.redirect(photoUri, 302);
      }
    } catch {
      // fall through to byte proxy
    }
  }

  let upstream = await fetchPlacePhotoImage(apiKey, name);

  if (!upstream) {
    return NextResponse.json({ error: "photo not available" }, { status: 404 });
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "unexpected response" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
