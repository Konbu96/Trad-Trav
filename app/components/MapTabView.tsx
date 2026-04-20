"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type Spot } from "../data/spots";
import { TRADITIONAL_GENRES, type TraditionalGenreId } from "../data/traditionalGenres";
import { useLanguage } from "../i18n/LanguageContext";
import type { Translations } from "../i18n/translations";
import SpotDetailSheet from "./SpotDetailSheet";
import type { SearchLocation } from "./SearchBar";
import { buildGoogleMapsUrl, openGoogleMapsUrl } from "../lib/googleMapsUrl";
import { isPlacePhotoKnownFailed, markPlacePhotoFailed } from "../lib/placePhotoLoadCache";

const GENRES = TRADITIONAL_GENRES;
type GenreId = TraditionalGenreId;

const GENRE_HEADING: Record<GenreId, (t: Translations) => string> = {
  festival: (t) => t.mapTab.genreFestival,
  performing: (t) => t.mapTab.genrePerforming,
  history: (t) => t.mapTab.genreHistory,
  craft: (t) => t.mapTab.genreCraft,
};

function genreHeading(id: GenreId, t: Translations): string {
  return (GENRE_HEADING[id] ?? (() => t.mapTab.genreDefault))(t);
}

/** トップ一覧のジャンル棚に並べる最大件数 */
const GENRE_SHELF_PREVIEW_MAX = 5;

export type MapTabTutorialHandle = {
  /** 「次へ」で現在ステップ相当の画面状態にそろえる */
  applyTutorialAutomation: (targetId: string) => void;
};

interface MapTabViewProps {
  onSpotView: (spot: { id: number; name: string; category: string }) => void;
  favoriteSpotIds: number[];
  onToggleFavorite: (spotId: number) => void;
  onOpenLanguageHelper?: (spotName: string) => void;
  /** 旅ガイド「体験前の流れ」など（予約のヒント）へ */
  onOpenReservationGuide?: () => void;
  resetToSearchKey?: number;
  onTutorialAction?: (actionId: string) => void;
}

type SearchPanelSpot = Spot & { placeId?: string; source?: "google" };

type GoogleSearchResponse = {
  locations?: SearchLocation[];
  error?: string;
};

type GooglePlaceDetailResponse = {
  name?: string;
  address?: string;
  category?: string;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  hours?: string;
  reviews?: Spot["reviews"];
  photos?: string[];
  error?: string;
};

interface SpotShelfCardProps {
  spot: SearchPanelSpot | Spot;
  fallbackEmoji: string;
  onOpen: () => void;
  tutorialDataId?: string;
}

interface SpotGridCardProps {
  spot: SearchPanelSpot | Spot;
  fallbackEmoji: string;
  onOpen: () => void;
  tutorialDataId?: string;
}

/** Places の primaryType / types から体験発掘のジャンル ID を推定（表示ラベルは `genreHeading`） */
function inferTraditionalGenreFromGoogleTypes(category?: string, type?: string): GenreId {
  const source = `${category || ""} ${type || ""}`;
  if (/festival|event/.test(source)) return "festival";
  if (/performing_arts|dance|music/.test(source)) return "performing";
  if (/museum|art_gallery|historical|history_museum/.test(source)) return "history";
  if (/educational_institution|store|point_of_interest|tourist_attraction|manufacturer/.test(source)) return "craft";
  return "craft";
}

function resolveMapSpotCategoryLabel(
  t: Translations,
  traditionalGenre: TraditionalGenreId | undefined,
  googleCategory?: string,
  googleType?: string
): string {
  const id = traditionalGenre ?? inferTraditionalGenreFromGoogleTypes(googleCategory, googleType);
  return genreHeading(id, t);
}

function searchLocationToPanelSpot(
  location: SearchLocation,
  index: number,
  spotDescriptionFallback: string,
  addressLabel: string,
  t: Translations
): SearchPanelSpot {
  const genreId = location.traditionalGenre ?? inferTraditionalGenreFromGoogleTypes(location.category, location.type);
  const category = genreHeading(genreId, t);
  const address = location.formattedAddress || location.name;

  return {
    id: -5000 - index,
    name: location.name,
    lat: location.lat,
    lng: location.lng,
    description: location.summary || spotDescriptionFallback.replace("{category}", category),
    category,
    traditionalGenre: genreId,
    reviews: [],
    infos: [{ type: "address", label: addressLabel, value: address }],
    photos: location.photos,
    placeId: location.placeId,
  };
}

function getPrimaryPhoto(spot: SearchPanelSpot | Spot) {
  return spot.photos?.[0] || null;
}

/** ジャンル棚・グリッド共通の 1:1 サムネ（Google 写真 or 絵文字） */
function GenreSpotSquarePhoto({
  spotName,
  primaryPhoto,
  fallbackEmoji,
  emojiFontPx,
}: {
  spotName: string;
  primaryPhoto: string | null;
  fallbackEmoji: string;
  emojiFontPx: number;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    setPhotoFailed(false);
  }, [primaryPhoto]);
  const knownBad = Boolean(primaryPhoto && isPlacePhotoKnownFailed(primaryPhoto));
  const showImage = Boolean(primaryPhoto) && !photoFailed && !knownBad;

  return (
    <div style={{ position: "relative", aspectRatio: "1 / 1", background: "linear-gradient(135deg, #f6d7b8, #f3b6c3)" }}>
      {showImage ? (
        // Google Places photo URLs are resolved at runtime and are not preconfigured for next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={primaryPhoto!}
          alt={spotName}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
          onError={() => {
            markPlacePhotoFailed(primaryPhoto!);
            setPhotoFailed(true);
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white" style={{ fontSize: `${emojiFontPx}px` }}>
          {fallbackEmoji}
        </div>
      )}
    </div>
  );
}

function SpotShelfCard({ spot, fallbackEmoji, onOpen, tutorialDataId }: SpotShelfCardProps) {
  const primaryPhoto = getPrimaryPhoto(spot);

  return (
    <div
      className="shrink-0 overflow-hidden bg-white"
      style={{
        width: "126px",
        borderRadius: "24px",
        border: "1px solid #ececec",
        boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
      }}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left" data-tutorial-id={tutorialDataId}>
        <GenreSpotSquarePhoto spotName={spot.name} primaryPhoto={primaryPhoto} fallbackEmoji={fallbackEmoji} emojiFontPx={36} />
      </button>
    </div>
  );
}

function SpotGridCard({ spot, fallbackEmoji, onOpen, tutorialDataId }: SpotGridCardProps) {
  const { t } = useLanguage();
  const primaryPhoto = getPrimaryPhoto(spot);

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm" style={{ border: "1px solid #f3f4f6" }}>
      <button type="button" onClick={onOpen} className="block w-full text-left" data-tutorial-id={tutorialDataId}>
        <GenreSpotSquarePhoto spotName={spot.name} primaryPhoto={primaryPhoto} fallbackEmoji={fallbackEmoji} emojiFontPx={40} />
      </button>

      <div className="p-3 pt-2">
        <button type="button" onClick={onOpen} className="w-full rounded-xl px-3 py-2 text-xs font-semibold" style={{ color: "#e88fa3", border: "1px solid #f3b6c3" }}>
          {t.mapTab.seeDetail}
        </button>
      </div>
    </div>
  );
}

const MapTabView = forwardRef<MapTabTutorialHandle, MapTabViewProps>(function MapTabView(
  {
    onSpotView,
    favoriteSpotIds,
    onToggleFavorite,
    onOpenLanguageHelper,
    onOpenReservationGuide,
    resetToSearchKey = 0,
    onTutorialAction,
  },
  ref
) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedSpot, setSelectedSpot] = useState<SearchPanelSpot | Spot | null>(null);
  const [isFetchingSpotInfo, setIsFetchingSpotInfo] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchPanelSpot[]>([]);
  const [searchResultLocations, setSearchResultLocations] = useState<SearchLocation[] | null>(null);
  const [genreResults, setGenreResults] = useState<Partial<Record<GenreId, SearchPanelSpot[]>>>({});
  const [genreLocations, setGenreLocations] = useState<Partial<Record<GenreId, SearchLocation[]>>>({});
  const [genreLoading, setGenreLoading] = useState<Partial<Record<GenreId, boolean>>>({});
  /** キュレーション取得失敗（文言は表示時に t.mapTab.fetchFailed で出す＝言語切替に追随） */
  const [genreErrors, setGenreErrors] = useState<Partial<Record<GenreId, true>>>({});
  /** 名前検索の API 失敗（再試行でクリア） */
  const [searchFetchFailed, setSearchFetchFailed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const genreResultsRef = useRef(genreResults);
  genreResultsRef.current = genreResults;

  const selectedGenreParam = searchParams.get("genre");
  const selectedGenre = GENRES.some(genre => genre.id === selectedGenreParam)
    ? (selectedGenreParam as GenreId)
    : null;

  const navigateWithoutGenre = useCallback(
    (method: "push" | "replace") => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("genre");
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router[method](nextUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const markGenreCuratedFailed = useCallback((genreId: GenreId) => {
    setGenreLocations(prev => ({ ...prev, [genreId]: [] }));
    setGenreResults(prev => ({ ...prev, [genreId]: [] }));
    setGenreErrors(prev => ({ ...prev, [genreId]: true }));
  }, []);

  const applyGenreCuratedSuccess = useCallback((genreId: GenreId, locations: SearchLocation[]) => {
    setGenreLocations(prev => ({ ...prev, [genreId]: locations }));
    setGenreResults(prev => ({
      ...prev,
      [genreId]: locations.map((loc, i) =>
        searchLocationToPanelSpot(loc, i, t.mapTab.spotDescriptionFallback, t.spot.address, t)
      ),
    }));
  }, [t]);

  const fetchGoogleLocations = useCallback(async (query: string) => {
    const res = await fetch(
      `/api/google-places/search?query=${encodeURIComponent(query)}&lang=${encodeURIComponent(language)}`
    );
    const data: GoogleSearchResponse = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "search failed");
    }
    return data.locations || [];
  }, [language]);

  const fetchCuratedGenreLocations = useCallback(async (genreId: GenreId, options?: { expanded?: boolean }) => {
    const expandedQS = options?.expanded ? "&expanded=1" : "";
    const res = await fetch(
      `/api/google-places/curated?genre=${encodeURIComponent(genreId)}${expandedQS}&lang=${encodeURIComponent(language)}`
    );
    const data: GoogleSearchResponse = await res.json();
    if (!res.ok) {
      return {
        ok: false as const,
        error: data.error || "curated search failed",
      };
    }

    return {
      ok: true as const,
      locations: data.locations || [],
    };
  }, [language]);

  const enrichSpotDetail = useCallback(async (spot: SearchPanelSpot | Spot) => {
    if (!("placeId" in spot) || !spot.placeId) return;

    setIsFetchingSpotInfo(true);
    try {
      const res = await fetch(
        `/api/google-places/detail?placeId=${encodeURIComponent(spot.placeId)}&lang=${encodeURIComponent(language)}`
      );
      const info: GooglePlaceDetailResponse = await res.json();

      if (!res.ok) {
        throw new Error(info.error || "detail fetch failed");
      }

      const extraInfos: Spot["infos"] = [];
      if (info.hours)   extraInfos.push({ type: "hours", label: t.spot.hours, value: info.hours });
      if (info.address) extraInfos.push({ type: "address", label: t.spot.address, value: info.address });
      if (info.phone)   extraInfos.push({ type: "phone", label: t.spot.phone, value: info.phone });
      if (info.website) extraInfos.push({ type: "website", label: t.spot.website, value: info.website });
      if (info.mapsUrl) extraInfos.push({ type: "website", label: t.map.googleMaps, value: info.mapsUrl });

      setSelectedSpot(prev => {
        if (!prev) return prev;
        if (!("placeId" in prev) || prev.placeId !== spot.placeId) return prev;

        return {
          ...prev,
          name: info.name || prev.name,
          category: info.category
            ? resolveMapSpotCategoryLabel(t, prev.traditionalGenre, info.category, info.category)
            : prev.category,
          reviews: info.reviews?.length ? info.reviews : prev.reviews,
          photos: info.photos?.length ? info.photos : prev.photos,
          infos: [
            ...prev.infos.filter(prevInfo =>
              !extraInfos.some(nextInfo => nextInfo.type === prevInfo.type && nextInfo.label === prevInfo.label)
            ),
            ...extraInfos,
          ],
        };
      });
    } catch (error) {
      console.warn("Google Places 詳細取得に失敗:", error);
    } finally {
      setIsFetchingSpotInfo(false);
    }
  }, [language, t]);

  useEffect(() => {
    if (!selectedSpot || !("placeId" in selectedSpot) || !selectedSpot.placeId) return;
    void enrichSpotDetail(selectedSpot);
    // 表示言語が変わったときだけ再取得（開いた直後は openSpotDetail 側で取得済み）
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedSpot は言語変更時の再取得対象に含めない（二重取得防止）
  }, [language]);

  const openSpotDetail = useCallback((spot: SearchPanelSpot | Spot) => {
    setSelectedSpot(spot);
    onSpotView({ id: spot.id, name: spot.name, category: spot.category });
    void enrichSpotDetail(spot);
  }, [enrichSpotDetail, onSpotView]);

  const loadGenre = useCallback(async (genreId: GenreId, opts?: { retry?: boolean }) => {
    const genre = GENRES.find(item => item.id === genreId);
    if (!genre) return;
    if (genreLoading[genreId]) return;
    /** 失敗直後は useEffect の再実行で無限フェッチしない（「もう一度」のみ retry） */
    if (genreErrors[genreId] && !opts?.retry) return;

    const hasLoadedGenre = Object.prototype.hasOwnProperty.call(genreResults, genreId);
    if (hasLoadedGenre && !genreErrors[genreId] && !opts?.retry) return;

    setGenreLoading(prev => ({ ...prev, [genreId]: true }));
    setGenreErrors(prev => {
      const next = { ...prev };
      delete next[genreId];
      return next;
    });
    try {
      const result = await fetchCuratedGenreLocations(genreId);
      if (!result.ok) {
        markGenreCuratedFailed(genreId);
        return;
      }
      applyGenreCuratedSuccess(genreId, result.locations);
    } catch (error) {
      console.warn("genre google search error:", error);
      markGenreCuratedFailed(genreId);
    } finally {
      setGenreLoading(prev => ({ ...prev, [genreId]: false }));
    }
  }, [
    applyGenreCuratedSuccess,
    fetchCuratedGenreLocations,
    genreErrors,
    genreLoading,
    genreResults,
    markGenreCuratedFailed,
  ]);

  /** 「もっと見る」・URL直叩き用。キュレーション全件＋検索で最大30件 */
  const loadGenreExpanded = useCallback(async (genreId: GenreId, opts?: { retry?: boolean }) => {
    const genre = GENRES.find(item => item.id === genreId);
    if (!genre) return;
    if (genreLoading[genreId]) return;
    if (genreErrors[genreId] && !opts?.retry) return;

    setGenreLoading(prev => ({ ...prev, [genreId]: true }));
    setGenreErrors(prev => {
      const next = { ...prev };
      delete next[genreId];
      return next;
    });
    try {
      const result = await fetchCuratedGenreLocations(genreId, { expanded: true });
      if (!result.ok) {
        markGenreCuratedFailed(genreId);
        return;
      }
      applyGenreCuratedSuccess(genreId, result.locations);
    } catch (error) {
      console.warn("genre expanded load error:", error);
      markGenreCuratedFailed(genreId);
    } finally {
      setGenreLoading(prev => ({ ...prev, [genreId]: false }));
    }
  }, [
    applyGenreCuratedSuccess,
    fetchCuratedGenreLocations,
    genreErrors,
    genreLoading,
    markGenreCuratedFailed,
  ]);

  const handleSearch = async () => {
    setHasSearched(true);
    setSearchFetchFailed(false);

    if (!keyword.trim()) {
      setSearchResults([]);
      setSearchResultLocations(null);
      return;
    }

    setIsSearching(true);
    try {
      const locations = await fetchGoogleLocations(keyword.trim());
      setSearchResultLocations(locations);
      setSearchResults(
        locations.map((loc, i) =>
          searchLocationToPanelSpot(loc, i, t.mapTab.spotDescriptionFallback, t.spot.address, t)
        )
      );
    } catch (error) {
      console.error("search panel google search error:", error);
      setSearchResultLocations([]);
      setSearchResults([]);
      setSearchFetchFailed(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearAll = () => {
    setKeyword("");
    setHasSearched(false);
    setSearchFetchFailed(false);
    setSearchResults([]);
    setSearchResultLocations(null);
    navigateWithoutGenre("replace");
  };

  useEffect(() => {
    if (!hasSearched) {
      const urlGenre = searchParams.get("genre");
      const skipPreview =
        urlGenre && GENRES.some((g) => g.id === urlGenre) ? (urlGenre as GenreId) : null;
      GENRES.forEach((genre) => {
        if (skipPreview && genre.id === skipPreview) return;
        void loadGenre(genre.id);
      });
    }
  }, [hasSearched, loadGenre, searchParams]);

  useEffect(() => {
    if (hasSearched || !selectedGenre) return;
    void loadGenreExpanded(selectedGenre);
  }, [hasSearched, selectedGenre, loadGenreExpanded]);

  useEffect(() => {
    if (!resetToSearchKey) return;

    setSelectedSpot(null);
    setKeyword("");
    setHasSearched(false);
    setSearchResults([]);
    setSearchResultLocations(null);
    setSearchFetchFailed(false);
    setGenreErrors({});

    navigateWithoutGenre("replace");
  }, [navigateWithoutGenre, resetToSearchKey]);

  const displayedSpots = useMemo(() => (hasSearched ? searchResults : []), [hasSearched, searchResults]);
  const displayedLocations = useMemo(
    () => (hasSearched ? searchResultLocations : null),
    [hasSearched, searchResultLocations]
  );
  const selectedGenreConfig = selectedGenre
    ? GENRES.find(genre => genre.id === selectedGenre) || null
    : null;
  const groupedSearchSections = useMemo(() => {
    const grouped = new Map<string, SearchPanelSpot[]>();

    displayedSpots.forEach((spot) => {
      const key = spot.category || "その他";
      const current = grouped.get(key) || [];
      current.push(spot);
      grouped.set(key, current);
    });

    const orderedSections = GENRES
      .map((genre) => ({
        genreId: genre.id,
        label: genreHeading(genre.id, t),
        emoji: genre.emoji,
        spots: grouped.get(genre.label) || [],
      }))
      .filter((section) => section.spots.length > 0);

    const otherSections = Array.from(grouped.entries())
      .filter(([label]) => !GENRES.some((genre) => genre.label === label))
      .map(([label, spots]) => ({
        genreId: undefined as GenreId | undefined,
        label: label === "その他" ? t.mapTab.categoryOther : label,
        emoji: "📍",
        spots,
      }));

    return [...orderedSections, ...otherSections];
  }, [displayedSpots, t]);

  const openGoogleMapsForSpot = useCallback(
    (spot: SearchPanelSpot | Spot, sourceLocations: SearchLocation[] | null = displayedLocations) => {
      onSpotView({ id: spot.id, name: spot.name, category: spot.category });

      let url: string | null = null;
      if (sourceLocations && "placeId" in spot && spot.placeId) {
        const matched = sourceLocations.find((location) => location.placeId === spot.placeId);
        if (matched?.placeId) {
          url = buildGoogleMapsUrl({
            placeId: matched.placeId,
            lat: matched.lat,
            lng: matched.lng,
            label: matched.name,
          });
        }
      }
      if (!url && typeof spot.lat === "number" && typeof spot.lng === "number") {
        url = buildGoogleMapsUrl({ lat: spot.lat, lng: spot.lng, label: spot.name });
      }
      if (!url) {
        url = buildGoogleMapsUrl({ query: `${spot.name} 宮城県` });
      }
      openGoogleMapsUrl(url);
    },
    [displayedLocations, onSpotView]
  );

  const renderGenreState = (
    genreId: GenreId,
    spots: SearchPanelSpot[],
    isGenreLoading?: boolean,
    expandedRetry?: boolean
  ) => {
    const genreError = genreErrors[genreId];

    if (isGenreLoading) {
      return (
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="shrink-0 overflow-hidden bg-white shadow-sm animate-pulse"
              style={{ width: "126px", borderRadius: "24px", border: "1px solid #ececec" }}
            >
              <div style={{ aspectRatio: "1 / 1", backgroundColor: "#f3f4f6" }} />
              <div style={{ padding: "4px 4px 6px" }}>
                <div className="mx-auto h-2 w-16 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (genreError) {
      return (
        <div
          className="rounded-3xl bg-white px-4 py-5 shadow-sm"
          style={{ border: "1px solid #fecdd3" }}
        >
          <p style={{ fontSize: "13px", color: "#991b1b", lineHeight: "1.8" }}>{t.mapTab.fetchFailed}</p>
          <button
            onClick={() =>
              void (expandedRetry ? loadGenreExpanded(genreId, { retry: true }) : loadGenre(genreId, { retry: true }))
            }
            className="mt-3 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ border: "1px solid #f3d1da", color: "#e88fa3", backgroundColor: "#fff" }}
          >
            {t.mapTab.reload}
          </button>
        </div>
      );
    }

    if (spots.length === 0) {
      return (
        <div className="rounded-3xl bg-white px-4 py-6 text-sm text-gray-500 shadow-sm" style={{ border: "1px solid #f3f4f6" }}>
          {t.mapTab.shelfEmpty}
        </div>
      );
    }

    return null;
  };

  const openGenrePage = (genreId: GenreId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("genre", genreId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const closeGenrePage = () => {
    navigateWithoutGenre("push");
  };

  useImperativeHandle(
    ref,
    () => ({
      applyTutorialAutomation(targetId: string) {
        switch (targetId) {
          case "nav.map":
            return;
          case "map.genre.performing-load-more": {
            const params = new URLSearchParams(searchParams.toString());
            params.set("genre", "performing");
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
            return;
          }
          case "map.genre.pick-spot": {
            const tryOpen = () => {
              const spots = genreResultsRef.current["performing"] ?? [];
              const first = spots[0];
              if (first) {
                openSpotDetail(first);
                return true;
              }
              return false;
            };
            if (!tryOpen()) {
              window.setTimeout(() => {
                void tryOpen();
              }, 500);
            }
            return;
          }
          case "map.spot-detail.close":
            setSelectedSpot(null);
            return;
          case "map.genre.back-to-list": {
            navigateWithoutGenre("push");
            return;
          }
          case "map.search-input":
            requestAnimationFrame(() => {
              document.querySelector<HTMLInputElement>(`[data-tutorial-id="map.search-input"]`)?.focus();
            });
            return;
          default:
            return;
        }
      },
    }),
    [navigateWithoutGenre, openSpotDetail, pathname, router, searchParams]
  );

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* ヘッダー */}
      <div
        className="flex-shrink-0 z-10"
        style={{
          background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
          boxShadow: "0 2px 10px rgba(232,143,163,0.2)",
        }}
      >
        <div
          style={{
            minHeight: "72px",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 20px 12px",
          }}
        >
          <h1 style={{ fontSize: "18px", fontWeight: 800, textAlign: "center", letterSpacing: "0.01em" }}>
            {t.mapTab.headerTitle}
          </h1>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-y-auto bg-gray-50" style={{ paddingBottom: "80px" }}>
            <div
              className="px-2 pt-4 pb-4"
              style={{
                backgroundColor: "white",
                borderBottom: "1px solid #f7dfe5",
              }}
            >
              <div>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ backgroundColor: "white", border: "1px solid #cfd4dc", boxShadow: "inset 0 1px 2px rgba(15,23,42,0.03)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 flex-shrink-0">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onFocus={() => onTutorialAction?.("map.search-input")}
                    onKeyDown={e => { if (e.key === "Enter") void handleSearch(); }}
                    placeholder={t.mapTab.searchPlaceholder}
                    data-tutorial-id="map.search-input"
                    className="flex-1 bg-transparent text-sm outline-none text-gray-800"
                  />
                  {keyword && (
                    <button
                      onClick={() => setKeyword("")}
                      className="text-gray-400 w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="px-1 pt-4">
              {hasSearched && (
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#e88fa3" }}>
                      {t.mapTab.nameSearchTitle}
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                      {t.mapTab.nameSearchResults.replace("{keyword}", keyword)}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{t.mapTab.nameSearchLead}</p>
                  </div>
                  <button
                    onClick={handleClearAll}
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ border: "1px solid #f3d1da", color: "#e88fa3", backgroundColor: "#fff" }}
                  >
                    {t.mapTab.resetKeyword}
                  </button>
                </div>
              )}

              {!hasSearched && selectedGenreConfig && (
                <div className="mb-5">
                  <button
                    type="button"
                    data-tutorial-id="map.genre.back-to-list"
                    onClick={() => {
                      onTutorialAction?.("map.genre.back-to-list");
                      closeGenrePage();
                    }}
                    className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500"
                  >
                    <span style={{ fontSize: "18px", lineHeight: 1 }}>←</span>
                    {t.mapTab.backToList}
                  </button>
                  <h2 className="pl-3" style={{ fontSize: "18px", fontWeight: 800, color: "#ef7e8d" }}>
                    {genreHeading(selectedGenreConfig.id, t)}
                  </h2>
                </div>
              )}

              {hasSearched && !isSearching && displayedSpots.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-sm">{t.mapTab.searchNoResultsTitle}</p>
                  <p className="text-xs mt-1">{t.mapTab.searchNoResultsHint}</p>
                </div>
              )}

              {isSearching && (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-4xl mb-3">⏳</p>
                  <p className="text-sm">{t.mapTab.searchLoading}</p>
                </div>
              )}

              {hasSearched && !isSearching && searchFetchFailed && (
                <div
                  className="mb-4 rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                  style={{ border: "1px solid #fecdd3", backgroundColor: "#fff1f2", color: "#991b1b" }}
                >
                  {t.mapTab.fetchFailed}
                </div>
              )}

              {hasSearched ? (
                <div className="space-y-8">
                  {groupedSearchSections.map((section) => (
                    <section key={section.genreId ?? section.label}>
                      <div className="mb-3 pl-3">
                        <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#ef7e8d", lineHeight: 1.2 }}>
                          {section.label}
                        </h2>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                        {section.spots.map((spot) => (
                          <SpotShelfCard
                            key={spot.id}
                            spot={spot}
                            fallbackEmoji={section.emoji}
                            onOpen={() => openSpotDetail(spot)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : selectedGenreConfig ? (
                <>
                  {renderGenreState(
                    selectedGenreConfig.id,
                    genreResults[selectedGenreConfig.id] || [],
                    genreLoading[selectedGenreConfig.id],
                    true
                  )}
                  {!genreLoading[selectedGenreConfig.id] && !genreErrors[selectedGenreConfig.id] && (
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      {(genreResults[selectedGenreConfig.id] || []).map((spot, spotIdx) => (
                        <SpotGridCard
                          key={spot.id}
                          spot={spot}
                          fallbackEmoji={selectedGenreConfig.emoji}
                          tutorialDataId={
                            selectedGenreConfig.id === "performing" && spotIdx === 0 ? "map.genre.pick-spot" : undefined
                          }
                          onOpen={() => {
                            if (selectedGenreConfig.id === "performing" && spotIdx === 0) {
                              onTutorialAction?.("map.genre.pick-spot");
                            }
                            openSpotDetail(spot);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-8">
                  {GENRES.map((genre) => {
                    const allSpots = genreResults[genre.id] || [];
                    const shelfSpots = allSpots.slice(0, GENRE_SHELF_PREVIEW_MAX);
                    const isGenreLoading = genreLoading[genre.id];

                    return (
                      <section key={genre.id}>
                        <div className="mb-3 flex items-center justify-between gap-4">
                          <div className="pl-3 min-w-0">
                            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#ef7e8d", lineHeight: 1.2 }}>
                              {genreHeading(genre.id, t)}
                            </h2>
                          </div>
                          <button
                            type="button"
                            data-tutorial-id={genre.id === "performing" ? "map.genre.performing-load-more" : undefined}
                            onClick={() => {
                              if (genre.id === "performing") {
                                onTutorialAction?.("map.genre.performing-load-more");
                              }
                              openGenrePage(genre.id);
                            }}
                            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                            style={{ border: "1px solid #f3d1da", color: "#ef95a5", backgroundColor: "#fff" }}
                          >
                            {t.mapTab.loadMore}
                          </button>
                        </div>

                        {renderGenreState(genre.id, allSpots, isGenreLoading)}

                        {!isGenreLoading && !genreErrors[genre.id] && allSpots.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                            {shelfSpots.map((spot, shelfIdx) => (
                              <SpotShelfCard
                                key={spot.id}
                                spot={spot}
                                fallbackEmoji={genre.emoji}
                                tutorialDataId={
                                  genre.id === "performing" && shelfIdx === 0 ? "map.genre.pick-spot" : undefined
                                }
                                onOpen={() => {
                                  if (genre.id === "performing" && shelfIdx === 0) {
                                    onTutorialAction?.("map.genre.pick-spot");
                                  }
                                  openSpotDetail(spot);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
      </div>

      {/* スポット詳細シート */}
      {selectedSpot && (
        <SpotDetailSheet
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          onTutorialAction={onTutorialAction}
          isLoadingInfo={isFetchingSpotInfo}
          isFavorite={favoriteSpotIds.includes(selectedSpot.id)}
          onToggleFavorite={() => onToggleFavorite(selectedSpot.id)}
          onOpenLanguageHelper={onOpenLanguageHelper}
          onShowMap={() => {
            const spot = selectedSpot;
            if (!spot) return;
            let locs: SearchLocation[] | null = null;
            if (hasSearched) {
              locs = searchResultLocations;
            } else if (selectedGenreConfig) {
              locs = genreLocations[selectedGenreConfig.id] || null;
            } else {
              for (const g of GENRES) {
                const spots = genreResults[g.id] || [];
                if (spots.some((s) => s.id === spot.id)) {
                  locs = genreLocations[g.id] || null;
                  break;
                }
              }
            }
            openGoogleMapsForSpot(spot, locs);
          }}
          onOpenReservationGuide={
            onOpenReservationGuide
              ? () => {
                  setSelectedSpot(null);
                  onOpenReservationGuide();
                }
              : undefined
          }
        />
      )}
    </div>
  );
});

export default MapTabView;
