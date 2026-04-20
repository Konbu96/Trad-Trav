import { NextRequest, NextResponse } from "next/server";
import {
  decodePlacesPhotoNameFromProxyRequest,
  fetchPlacePhotoImage,
  getPhotoUri,
  isValidPlacesPhotoName,
} from "../_lib/photo";

export async function GET(req: NextRequest) {
  const name = decodePlacesPhotoNameFromProxyRequest(
    req.nextUrl.searchParams.get("n"),
    req.nextUrl.searchParams.get("name")
  );
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

  const upstream = await fetchPlacePhotoImage(apiKey, name);

  if (!upstream) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        {
          error: "photo not available",
          hint:
            "Google 側で画像を取得できませんでした。`npm run dev` のターミナルに `[google-places photo]` と HTTP ステータス・本文の抜粋が出ます。403 は API キー・課金・「Places API (New)」の有効化やキー制限（サーバーからの呼び出しではリファラー制限が効かない等）、400/404 は写真リソース名の失効や無効なリクエストが多いです。",
        },
        { status: 404 }
      );
    }
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
