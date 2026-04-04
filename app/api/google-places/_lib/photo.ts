type GooglePhotoMediaResponse = {
  photoUri?: string;
};

export async function getPhotoUri(apiKey: string, photoName: string) {
  const requestUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&skipHttpRedirect=true`;

  try {
    const res = await fetch(requestUrl, {
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data: GooglePhotoMediaResponse = await res.json();
      return data.photoUri || null;
    }

    return res.url && res.url !== requestUrl ? res.url : null;
  } catch (error) {
    console.error("google-places photo fetch error:", error);
    return null;
  }
}
