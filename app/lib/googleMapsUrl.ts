/**
 * Build a Google Maps (web) URL. Prefer place_id when available for accuracy.
 * @see https://developers.google.com/maps/documentation/urls/get-started
 */
export function buildGoogleMapsUrl(opts: {
  lat?: number;
  lng?: number;
  placeId?: string;
  /** Free-text search when coordinates are unknown */
  query?: string;
  /** Optional label shown in some clients when using coordinates */
  label?: string;
}): string {
  if (opts.placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`place_id:${opts.placeId}`)}`;
  }
  const { lat, lng } = opts;
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    const coord = `${lat},${lng}`;
    const q = opts.label ? `${coord} (${opts.label})` : coord;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }
  if (opts.query?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(opts.query.trim())}`;
  }
  return "https://www.google.com/maps/search/?api=1&query=%E5%AE%AE%E5%9F%8E%E7%9C%8C";
}

export function openGoogleMapsUrl(url: string) {
  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}
