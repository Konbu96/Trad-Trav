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

/** Same-origin URL so <img> always hits our server (avoids hotlink / client issues with photoUri). */
export function placesPhotoProxyUrl(photoName: string) {
  const normalized = normalizePlacesPhotoName(photoName);
  return `/api/google-places/photo-proxy?name=${encodeURIComponent(normalized)}`;
}

export function isValidPlacesPhotoName(name: string) {
  const n = normalizePlacesPhotoName(name);
  return /^places\/.+\/photos\/.+/.test(n);
}

/**
 * Place Photos (New): follow redirect to image. Official samples pass `key` in the query string.
 * Some responses return JSON with `photoUri` instead of a raw image — handle both.
 */
export async function fetchPlacePhotoImage(apiKey: string, photoName: string): Promise<Response | null> {
  const normalizedName = normalizePlacesPhotoName(photoName);
  const params = new URLSearchParams({
    maxWidthPx: "1200",
    key: apiKey,
  });
  const requestUrl = `https://places.googleapis.com/v1/${normalizedName}/media?${params.toString()}`;

  try {
    const res = await fetch(requestUrl, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    });

    if (!res.ok) {
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
  const params = new URLSearchParams({
    maxWidthPx: "1200",
    skipHttpRedirect: "true",
    key: apiKey,
  });
  const requestUrl = `https://places.googleapis.com/v1/${normalizedName}/media?${params.toString()}`;

  try {
    const res = await fetch(requestUrl, {
      cache: "no-store",
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    });

    if (!res.ok) {
      return null;
    }

    const bodyText = await res.text();

    try {
      const data = JSON.parse(bodyText) as GooglePhotoMediaResponse;
      const raw = data.photoUri;
      return raw ? normalizePhotoUri(raw) : null;
    } catch {
      return null;
    }
  } catch (error) {
    console.error("google-places photo uri fetch error:", error);
    return null;
  }
}
