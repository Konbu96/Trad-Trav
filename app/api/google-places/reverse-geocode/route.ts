import { NextRequest, NextResponse } from "next/server";

type GoogleGeocodeAddressComponent = {
  long_name?: string;
  types?: string[];
};

type GoogleGeocodeResult = {
  formatted_address?: string;
  address_components?: GoogleGeocodeAddressComponent[];
};

type GoogleGeocodeResponse = {
  results?: GoogleGeocodeResult[];
  status?: string;
  error_message?: string;
};

function pickAddressComponent(
  components: GoogleGeocodeAddressComponent[] | undefined,
  candidateTypes: string[]
) {
  return components?.find((component) =>
    candidateTypes.some((candidateType) => component.types?.includes(candidateType))
  )?.long_name || "";
}

export async function GET(req: NextRequest) {
  const lat = Number.parseFloat(req.nextUrl.searchParams.get("lat") || "");
  const lng = Number.parseFloat(req.nextUrl.searchParams.get("lng") || "");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "valid lat and lng are required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&language=ja&region=jp&key=${encodeURIComponent(apiKey)}`,
      {
        cache: "no-store",
      }
    );

    const data: GoogleGeocodeResponse = await res.json();

    if (!res.ok || data.status !== "OK") {
      return NextResponse.json(
        { error: data.error_message || "Google reverse geocode fetch failed" },
        { status: res.ok ? 500 : res.status }
      );
    }

    const primaryResult = data.results?.[0];
    const components = primaryResult?.address_components || [];
    const prefecture = pickAddressComponent(components, ["administrative_area_level_1"]);
    const city = pickAddressComponent(components, ["locality", "administrative_area_level_2"]);
    const town = pickAddressComponent(components, [
      "sublocality_level_1",
      "sublocality",
      "neighborhood",
      "route",
    ]);

    return NextResponse.json({
      prefecture,
      city,
      town,
      formattedAddress: primaryResult?.formatted_address || "",
    });
  } catch (error) {
    console.error("google reverse geocode error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
