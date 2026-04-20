import { Buffer } from "node:buffer";

type GooglePhotoMediaResponse = {
  photoUri?: string;
};

function normalizePhotoUri(uri: string) {
  const trimmed = uri.trim();
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return trimmed;
}

/** Places API returns names like `places/.../photos/...` (no `/media` suffix). */
export function normalizePlacesPhotoName(name: string) {
  return name.trim().replace(/\/media\/?$/i, "");
}

/** `places/{placeId}/photos/{ref}` を placeId / ref に分ける（先頭の1つ目の `/photos/` で分割） */
export function splitPlacesPhotoResourceName(name: string): { placeId: string; photoRef: string } | null {
  const n = normalizePlacesPhotoName(name);
  if (!n.startsWith("places/")) return null;
  const rest = n.slice("places/".length);
  const sep = "/photos/";
  const i = rest.indexOf(sep);
  if (i < 0) return null;
  const placeId = rest.slice(0, i);
  const photoRef = rest.slice(i + sep.length);
  if (!placeId || !photoRef) return null;
  return { placeId, photoRef };
}

/**
 * Google getMedia 用のパス本体（`places/{id}/photos/{ref}`、末尾に `/media` は付けない）。
 * 公式サンプルはスラッシュをエンコードせずそのまま渡す。セグメントを encode すると 404 になる報告があるため生パスを使う。
 */
function googlePlacesPhotoMediaPath(photoName: string): string | null {
  const n = normalizePlacesPhotoName(photoName);
  return splitPlacesPhotoResourceName(n) ? n : null;
}

/**
 * プロキシ URL。クエリの `name=` は `+` がスペース化されうるため、base64url の `n` のみ使う。
 * 旧 `name=` は photo-proxy で後方互換のため解釈する。
 */
export function placesPhotoProxyUrl(photoName: string) {
  const normalized = normalizePlacesPhotoName(photoName);
  const n = Buffer.from(normalized, "utf8").toString("base64url");
  return `/api/google-places/photo-proxy?n=${encodeURIComponent(n)}`;
}

/** photo-proxy GET: `n`（推奨）または `name`（非推奨）から復元 */
export function decodePlacesPhotoNameFromProxyRequest(nParam: string | null, nameParam: string | null): string {
  const rawN = nParam?.trim();
  if (rawN) {
    try {
      return Buffer.from(rawN, "base64url").toString("utf8");
    } catch {
      return "";
    }
  }
  return normalizePlacesPhotoName(nameParam || "");
}

export function isValidPlacesPhotoName(name: string) {
  return splitPlacesPhotoResourceName(name) !== null;
}

/**
 * Place Photos (New): follow redirect to image. Official samples pass `key` in the query string.
 * Some responses return JSON with `photoUri` instead of a raw image — handle both.
 */
function logPhotoUpstreamFailure(label: string, res: Response, bodySnippet: string) {
  if (process.env.NODE_ENV !== "development") return;
  console.warn(`[google-places photo] ${label} upstream ${res.status}`, bodySnippet.slice(0, 400));
}

export async function fetchPlacePhotoImage(apiKey: string, photoName: string): Promise<Response | null> {
  const normalizedName = normalizePlacesPhotoName(photoName);
  const pathCore = googlePlacesPhotoMediaPath(normalizedName);
  if (!pathCore) return null;
  const params = new URLSearchParams({
    maxWidthPx: "1200",
    maxHeightPx: "1200",
    key: apiKey,
  });
  const requestUrl = `https://places.googleapis.com/v1/${pathCore}/media?${params.toString()}`;

  try {
    const res = await fetch(requestUrl, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    });

    if (!res.ok) {
      void res
        .clone()
        .text()
        .then((t) => logPhotoUpstreamFailure("fetchPlacePhotoImage", res, t))
        .catch(() => logPhotoUpstreamFailure("fetchPlacePhotoImage", res, ""));
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.startsWith("image/")) {
      return res;
    }

    const bodyText = await res.text();
    if (bodyText.trimStart().startsWith("{")) {
      try {
        const data = JSON.parse(bodyText) as GooglePhotoMediaResponse;
        const raw = data.photoUri;
        if (!raw) {
          return null;
        }
        const photoUri = normalizePhotoUri(raw);
        const imgRes = await fetch(photoUri, { redirect: "follow", cache: "no-store" });
        if (!imgRes.ok) {
          return null;
        }
        const imgCt = imgRes.headers.get("content-type") || "";
        if (!imgCt.startsWith("image/")) {
          return null;
        }
        return imgRes;
      } catch {
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("google-places photo image fetch error:", error);
    return null;
  }
}

export async function getPhotoUri(apiKey: string, photoName: string) {
  const normalizedName = normalizePlacesPhotoName(photoName);
  const pathCore = googlePlacesPhotoMediaPath(normalizedName);
  if (!pathCore) return null;
  const params = new URLSearchParams({
    maxWidthPx: "1200",
    maxHeightPx: "1200",
    skipHttpRedirect: "true",
    key: apiKey,
  });
  const requestUrl = `https://places.googleapis.com/v1/${pathCore}/media?${params.toString()}`;

  try {
    const res = await fetch(requestUrl, {
      cache: "no-store",
      redirect: "manual",
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("Location");
      if (!loc) return null;
      try {
        const absolute = new URL(loc, "https://places.googleapis.com").toString();
        return normalizePhotoUri(absolute);
      } catch {
        return null;
      }
    }

    if (!res.ok) {
      void res
        .clone()
        .text()
        .then((t) => logPhotoUpstreamFailure("getPhotoUri", res, t))
        .catch(() => logPhotoUpstreamFailure("getPhotoUri", res, ""));
      return null;
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.startsWith("image/")) {
      await res.body?.cancel().catch(() => {});
      return null;
    }

    const bodyText = await res.text();

    try {
      const data = JSON.parse(bodyText) as GooglePhotoMediaResponse;
      const raw = data.photoUri;
      return raw ? normalizePhotoUri(raw) : null;
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.warn("[google-places photo] getPhotoUri could not parse JSON body", bodyText.slice(0, 200));
      }
      return null;
    }
  } catch (error) {
    console.error("google-places photo uri fetch error:", error);
    return null;
  }
}
