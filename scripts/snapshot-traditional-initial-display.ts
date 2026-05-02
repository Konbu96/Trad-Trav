/**
 * Google Places API をこのスクリプト実行時のみ使用し、キュレーション施設の
 * 初期表示用データを `app/data/traditionalInitialSnapshot.json` に書き出します。
 * 併せて写真を `public/images/traditional/*.jpg` に保存します。
 *
 *   npm run snapshot-traditional-initial
 *
 * キー: 環境変数 `GOOGLE_MAPS_API_KEY` または `.env.local` / `.env` の同名列。
 * 表示言語:
 * - ベース本文は Places `ja`
 * - `localized.en / localized.zh / localized.ko` を同時に保存（実行時 API 呼び出し削減）
 *
 * 取得対象:
 * - photos（最大 8 枚）
 * - reviews
 * - overview（editorialSummary）
 * - generativeSummary / reviewSummary（AI 要約・口コミ要約。表示時はポリシーに従い注記を付与）
 * - rating / userRatingCount / primaryTypeDisplayName（概要の補助行）
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Review } from "../app/data/spots";
import {
  decodePlacesPhotoNameFromProxyRequest,
  fetchPlacePhotoImage,
  placesPhotoProxyUrl,
} from "../app/api/google-places/_lib/photo";
import { googleReviewAuthorFallback, placesDetailLanguageCode } from "../app/lib/placesApiLanguage";
import { maybeTranslateJapanesePlaceName } from "../app/lib/mymemoryJaToEn";
import {
  CURATED_TRADITIONAL_PLACES,
  TRADITIONAL_GENRES,
  type CuratedTraditionalPlace,
  type TraditionalGenreId,
} from "../app/data/traditionalGenres";

const ROOT = process.cwd();
const OUT_JSON = join(ROOT, "app", "data", "traditionalInitialSnapshot.json");
const OUT_IMG_DIR = join(ROOT, "public", "images", "traditional");
const MAX_PHOTOS = 8;
const SNAPSHOT_LANGS = ["en", "zh", "ko"] as const;
type SnapshotLang = (typeof SNAPSHOT_LANGS)[number];

function hasCjkOrHangul(text: string) {
  return /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text);
}

function hasLatin(text: string) {
  return /[A-Za-z]/.test(text);
}

const PRIMARY_FILE_NAMES: Record<TraditionalGenreId, string[]> = {
  performing: ["moributai-1.jpg", "ryokusaikan-1.jpg", "rokugo-shimin-center-1.jpg"],
  festival: ["aoba-matsuri-1.jpg", "sendai-tanabata-1.jpg", "michinoku-yosakoi-1.jpg", "tsutsujigaoka-park-1.jpg"],
  craft: ["nihon-kokeshi-1.jpg", "zao-kokeshi-1.jpg", "sendai-tansu-1.jpg", "ogatsu-suzuri-1.jpg", "tamamushi-nuri-1.jpg"],
  history: ["tohoku-history-museum-1.jpg", "watari-kyodo-1.jpg", "kakuda-kyodo-1.jpg", "misato-kyodo-1.jpg"],
};

function loadGoogleKeyFromEnv() {
  if (process.env.GOOGLE_MAPS_API_KEY?.trim()) return;
  for (const p of [join(ROOT, ".env.local"), join(ROOT, ".env")]) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = /^\s*GOOGLE_MAPS_API_KEY\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      let v = m[1].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (v) {
        process.env.GOOGLE_MAPS_API_KEY = v;
        return;
      }
    }
  }
}

function normalizePlaceIdForV1(placeId: string) {
  return placeId.replace(/^places\//, "");
}

function shortExperienceFromSummary(summary: string, genreFallback: string): string {
  const line = summary.split(/[。\n]/)[0]?.trim() || summary.trim();
  if (!line) return genreFallback;
  const compact = line.replace(/です$/, "").replace(/^[、。・\s]+/, "").trim();
  return compact.length <= 22 ? compact : `${compact.slice(0, 20)}…`;
}

type GooglePlaceReview = {
  rating?: number;
  publishTime?: string;
  text?: { text?: string };
  authorAttribution?: { displayName?: string };
};

type GooglePlaceDetailResponse = {
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  websiteUri?: string;
  nationalPhoneNumber?: string;
  googleMapsUri?: string;
  editorialSummary?: { text?: string };
  generativeSummary?: {
    overview?: { text?: string };
    disclaimerText?: { text?: string };
    disclosureText?: { text?: string };
  };
  reviewSummary?: {
    text?: { text?: string };
    disclosureText?: { text?: string };
  };
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  reviews?: GooglePlaceReview[];
  photos?: { name?: string }[];
  error?: { message?: string };
};

type GoogleTextSearchPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  primaryType?: string;
  photos?: { name?: string }[];
};

type GoogleTextSearchResponse = {
  places?: GoogleTextSearchPlace[];
  error?: { message?: string };
};

type ResolvedDetail = {
  placeId?: string;
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  category?: string;
  primaryTypeDisplayName?: string;
  overview?: string;
  generativeOverview?: string;
  generativeOverviewDisclosure?: string;
  reviewSummary?: string;
  reviewSummaryDisclosure?: string;
  rating?: number;
  userRatingCount?: number;
  hours?: string;
  website?: string;
  phone?: string;
  mapsUrl?: string;
  reviews: Review[];
  photoNames: string[];
  photos: string[];
  firstPhotoResourceName?: string;
};

async function fetchPlaceById(apiKey: string, placeId: string, lang: "ja" | SnapshotLang): Promise<ResolvedDetail> {
  const id = normalizePlaceIdForV1(placeId);
  const placesLang = placesDetailLanguageCode(lang);
  console.log("GoogleAPI called");
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=${encodeURIComponent(placesLang)}&regionCode=JP`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "displayName",
          "formattedAddress",
          "location",
          "primaryType",
          "primaryTypeDisplayName",
          "websiteUri",
          "nationalPhoneNumber",
          "googleMapsUri",
          "editorialSummary",
          "generativeSummary",
          "reviewSummary",
          "rating",
          "userRatingCount",
          "regularOpeningHours.weekdayDescriptions",
          "reviews",
          "photos",
        ].join(","),
      },
      cache: "no-store",
    }
  );
  const data = (await res.json()) as GooglePlaceDetailResponse;
  if (!res.ok) {
    throw new Error(data.error?.message || "Google detail failed");
  }

  const photoNames = (data.photos || [])
    .map((p) => p.name?.trim())
    .filter((n): n is string => Boolean(n))
    .slice(0, MAX_PHOTOS);
  const authorFallback = googleReviewAuthorFallback(placesLang);
  const reviews: Review[] = (data.reviews || [])
    .map((review) => ({
      author: review.authorAttribution?.displayName || authorFallback,
      rating: Math.max(1, Math.min(5, Math.round(review.rating || 0))) || 0,
      comment: review.text?.text || "",
      date: (review.publishTime || "").split("T")[0] || "",
    }))
    .filter((review) => review.rating > 0 && review.comment);

  const genOverview = data.generativeSummary?.overview?.text?.trim();
  const genDisc =
    data.generativeSummary?.disclosureText?.text?.trim() ||
    data.generativeSummary?.disclaimerText?.text?.trim();
  const revSummary = data.reviewSummary?.text?.text?.trim();
  const revDisc = data.reviewSummary?.disclosureText?.text?.trim();

  return {
    placeId: id,
    name: data.displayName?.text,
    address: data.formattedAddress,
    lat: data.location?.latitude,
    lng: data.location?.longitude,
    category: data.primaryType,
    primaryTypeDisplayName: data.primaryTypeDisplayName?.text?.trim(),
    overview: data.editorialSummary?.text,
    generativeOverview: genOverview || undefined,
    generativeOverviewDisclosure: genDisc || undefined,
    reviewSummary: revSummary || undefined,
    reviewSummaryDisclosure: revDisc || undefined,
    rating: typeof data.rating === "number" ? data.rating : undefined,
    userRatingCount: typeof data.userRatingCount === "number" ? data.userRatingCount : undefined,
    hours: data.regularOpeningHours?.weekdayDescriptions?.join("\n"),
    website: data.websiteUri,
    phone: data.nationalPhoneNumber,
    mapsUrl: data.googleMapsUri,
    reviews,
    photoNames,
    photos: photoNames.map((name) => placesPhotoProxyUrl(name)),
    firstPhotoResourceName: photoNames[0],
  };
}

async function searchPlaceByText(apiKey: string, fallbackName: string, lang: "ja" | SnapshotLang): Promise<ResolvedDetail> {
  const placesLang = placesDetailLanguageCode(lang);
  console.log("GoogleAPI called");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.photos",
    },
    body: JSON.stringify({
      textQuery: fallbackName.includes("宮城") ? fallbackName : `${fallbackName} 宮城県`,
      languageCode: placesLang,
      regionCode: "JP",
      maxResultCount: 1,
    }),
    cache: "no-store",
  });
  const data = (await res.json()) as GoogleTextSearchResponse;
  if (!res.ok) {
    throw new Error(data.error?.message || "Google text search failed");
  }
  const place = data.places?.[0];
  if (!place?.id) {
    throw new Error("Curated fallback place was not found");
  }
  const byId = await fetchPlaceById(apiKey, place.id, lang);
  return {
    ...byId,
    name: byId.name || place.displayName?.text,
    address: byId.address || place.formattedAddress,
    lat: byId.lat ?? place.location?.latitude,
    lng: byId.lng ?? place.location?.longitude,
    category: byId.category || place.primaryType,
  };
}

async function fetchPhotoNameByTextSearch(
  apiKey: string,
  queryBase: string,
  locationBias?: { lat: number; lng: number }
): Promise<string | null> {
  const textQuery = queryBase.includes("宮城") ? queryBase : `${queryBase} 宮城県`;
  console.log("GoogleAPI called");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.displayName,places.photos",
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "ja",
      regionCode: "JP",
      maxResultCount: 10,
      ...(locationBias
        ? { locationBias: { circle: { center: { latitude: locationBias.lat, longitude: locationBias.lng }, radius: 500 } } }
        : {}),
    }),
    cache: "no-store",
  });
  const data = (await res.json()) as GoogleTextSearchResponse;
  if (!res.ok || !data.places?.length) return null;
  return data.places.map((p) => p.photos?.[0]?.name).find((x): x is string => Boolean(x)) || null;
}

async function ensureAtLeastOnePhoto(apiKey: string, detail: ResolvedDetail, fallbackLabel: string): Promise<ResolvedDetail> {
  if (detail.photoNames.length > 0) return detail;
  const bias = typeof detail.lat === "number" && typeof detail.lng === "number" ? { lat: detail.lat, lng: detail.lng } : undefined;
  const photoName = await fetchPhotoNameByTextSearch(apiKey, fallbackLabel, bias);
  if (!photoName) return detail;
  return {
    ...detail,
    photoNames: [photoName],
    photos: [placesPhotoProxyUrl(photoName)],
    firstPhotoResourceName: photoName,
  };
}

function photoResourceNameFromDetail(detail: ResolvedDetail): string | null {
  if (detail.firstPhotoResourceName) return detail.firstPhotoResourceName;
  const u = detail.photos[0];
  if (!u || !u.includes("/api/google-places/photo-proxy")) return null;
  try {
    const url = new URL(u, "http://localhost");
    const decoded = decodePlacesPhotoNameFromProxyRequest(url.searchParams.get("n"), url.searchParams.get("name"));
    return decoded || null;
  } catch {
    return null;
  }
}

function stemFromPrimaryFileName(primaryFile: string): string {
  return primaryFile.replace(/-1\.jpe?g$/i, "");
}

async function savePhotoSeries(apiKey: string, detail: ResolvedDetail, primaryFileName: string): Promise<string[]> {
  const stem = stemFromPrimaryFileName(primaryFileName);
  const photoNames = detail.photoNames.length
    ? detail.photoNames
    : (photoResourceNameFromDetail(detail) ? [photoResourceNameFromDetail(detail)!] : []);
  const photoPaths: string[] = [];
  for (let i = 0; i < Math.min(photoNames.length, MAX_PHOTOS); i++) {
    const outName = `${stem}-${i + 1}.jpg`;
    const imgRes = await fetchPlacePhotoImage(apiKey, photoNames[i]);
    if (!imgRes) continue;
    const buf = Buffer.from(await imgRes.arrayBuffer());
    writeFileSync(join(OUT_IMG_DIR, outName), buf);
    photoPaths.push(`/images/traditional/${outName}`);
    console.log(`  画像保存: public/images/traditional/${outName} (${buf.length} bytes)`);
  }
  return photoPaths;
}

type SnapshotEntry = {
  lat: number;
  lng: number;
  name: string;
  placeId?: string;
  photos: string[];
  formattedAddress?: string;
  overview?: string;
  generativeOverview?: string;
  generativeOverviewDisclosure?: string;
  reviewSummary?: string;
  reviewSummaryDisclosure?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: string;
  localized?: Partial<Record<SnapshotLang, {
    name?: string;
    formattedAddress?: string;
    overview?: string;
    generativeOverview?: string;
    generativeOverviewDisclosure?: string;
    reviewSummary?: string;
    reviewSummaryDisclosure?: string;
    primaryTypeDisplayName?: string;
    reviews?: Review[];
    hours?: string;
  }>>;
  summary: string;
  reviews?: Review[];
  hours?: string;
  website?: string;
  phone?: string;
  mapsUrl?: string;
  officialSourceUrl?: string;
  genreLabel: string;
  traditionalGenre: TraditionalGenreId;
  experienceCategory: string;
  category?: string;
  type?: string;
  source: "local";
};

function loadBaselineSnapshot(): Partial<Record<TraditionalGenreId, SnapshotEntry[]>> {
  if (!existsSync(OUT_JSON)) return {};
  try {
    return JSON.parse(readFileSync(OUT_JSON, "utf8")) as Partial<Record<TraditionalGenreId, SnapshotEntry[]>>;
  } catch {
    return {};
  }
}

function isSnapshotEntry(x: unknown): x is SnapshotEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.lat === "number" && typeof o.lng === "number" && typeof o.name === "string" && o.source === "local";
}

async function resolvePlaceDetail(apiKey: string, place: CuratedTraditionalPlace, lang: "ja" | SnapshotLang): Promise<ResolvedDetail> {
  let detail: ResolvedDetail;
  try {
    detail = await fetchPlaceById(apiKey, place.placeId, lang);
  } catch (e) {
    console.warn("  placeId 解決失敗、テキスト検索にフォールバック:", e);
    detail = await searchPlaceByText(apiKey, place.fallbackName, lang);
  }
  if (lang === "ja") {
    detail = await ensureAtLeastOnePhoto(apiKey, detail, place.fallbackName);
  }
  if (typeof detail.lat !== "number" || typeof detail.lng !== "number") {
    throw new Error(`座標が取得できません: ${place.fallbackName}`);
  }
  return detail;
}

async function main() {
  loadGoogleKeyFromEnv();
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY が未設定です。");
    process.exit(1);
  }

  mkdirSync(OUT_IMG_DIR, { recursive: true });
  const baseline = loadBaselineSnapshot();
  const out: Record<TraditionalGenreId, SnapshotEntry[]> = { performing: [], festival: [], craft: [], history: [] };
  let keptFromBaseline = 0;

  for (const genre of TRADITIONAL_GENRES) {
    const curated = CURATED_TRADITIONAL_PLACES[genre.id];
    const primaryFiles = PRIMARY_FILE_NAMES[genre.id];
    const n = Math.min(curated.length, primaryFiles.length);
    for (let i = 0; i < n; i++) {
      const place = curated[i];
      const primaryFile = primaryFiles[i];
      const defaultPhotoPath = `/images/traditional/${primaryFile}`;
      const prevRow = baseline[genre.id]?.[i];
      console.log(`→ [${genre.id}] ${place.fallbackName}`);
      try {
        const detail = await resolvePlaceDetail(apiKey, place, "ja");
        const photoPaths = await savePhotoSeries(apiKey, detail, primaryFile);
        const baseJaName = (detail.name || place.fallbackName || "").trim();
        const localized: SnapshotEntry["localized"] = {};
        for (const lang of SNAPSHOT_LANGS) {
          try {
            const d = await resolvePlaceDetail(apiKey, place, lang);
            const rawName = (d.name || "").trim();
            const needsNameAssist =
              (lang === "zh" || lang === "ko") && rawName && hasLatin(rawName) && !hasCjkOrHangul(rawName);
            const assistedName = needsNameAssist
              ? ((await maybeTranslateJapanesePlaceName(baseJaName, lang)) ?? rawName)
              : rawName;
            localized[lang] = {
              name: assistedName || d.name,
              formattedAddress: d.address,
              overview: d.overview,
              generativeOverview: d.generativeOverview,
              generativeOverviewDisclosure: d.generativeOverviewDisclosure,
              reviewSummary: d.reviewSummary,
              reviewSummaryDisclosure: d.reviewSummaryDisclosure,
              primaryTypeDisplayName: d.primaryTypeDisplayName,
              reviews: d.reviews.length ? d.reviews : undefined,
              hours: d.hours,
            };
          } catch (e) {
            console.warn(`  localized(${lang}) 取得失敗。ベース言語を使用します:`, e);
          }
        }
        const summary = place.experienceTitle
          ? `${place.experienceTitle}体験ができます。${place.summary}`
          : place.summary;
        out[genre.id].push({
          lat: detail.lat!,
          lng: detail.lng!,
          name: detail.name || place.fallbackName,
          placeId: detail.placeId,
          photos: photoPaths.length ? photoPaths : [defaultPhotoPath],
          formattedAddress: detail.address,
          overview: detail.overview,
          generativeOverview: detail.generativeOverview,
          generativeOverviewDisclosure: detail.generativeOverviewDisclosure,
          reviewSummary: detail.reviewSummary,
          reviewSummaryDisclosure: detail.reviewSummaryDisclosure,
          rating: detail.rating,
          userRatingCount: detail.userRatingCount,
          primaryTypeDisplayName: detail.primaryTypeDisplayName,
          localized: Object.keys(localized).length ? localized : undefined,
          summary,
          reviews: detail.reviews.length ? detail.reviews : undefined,
          hours: detail.hours,
          website: detail.website,
          phone: detail.phone,
          mapsUrl: detail.mapsUrl,
          officialSourceUrl: place.officialSourceUrl,
          genreLabel: genre.label,
          traditionalGenre: genre.id,
          experienceCategory: place.experienceTitle?.trim() || shortExperienceFromSummary(place.summary, genre.label),
          category: detail.category,
          type: detail.category,
          source: "local",
        });
      } catch (err) {
        console.error("  取得失敗:", err);
        if (prevRow && isSnapshotEntry(prevRow)) {
          out[genre.id].push(prevRow);
          keptFromBaseline += 1;
        } else {
          throw err;
        }
      }
    }
  }

  writeFileSync(OUT_JSON, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`\n書き出し完了: ${OUT_JSON}`);
  if (keptFromBaseline > 0) {
    console.log(`（${keptFromBaseline} 件は前回スナップショットを維持）`);
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
