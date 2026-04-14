"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type Spot } from "../data/spots";
import { TRADITIONAL_GENRES, type TraditionalGenreId } from "../data/traditionalGenres";
import SpotDetailSheet from "./SpotDetailSheet";
import type { SearchLocation } from "./SearchBar";
import { LocationIcon, TravelGuideIcon } from "./icons";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600 text-sm">マップを読み込み中...</span>
      </div>
    </div>
  ),
});

const GENRES = TRADITIONAL_GENRES;
type GenreId = TraditionalGenreId;

/** トップ一覧のジャンル棚に並べる最大件数 */
const GENRE_SHELF_PREVIEW_MAX = 5;

interface MapTabViewProps {
  onSpotView: (spot: { id: number; name: string; category: string }) => void;
  jumpToSpotId: number | null;
  onJumpComplete: () => void;
  favoriteSpotIds: number[];
  onToggleFavorite: (spotId: number) => void;
  recommendedSpotIds: number[] | null;
  onOpenLanguageHelper?: (spotName: string) => void;
  /** お役立ちの「旅ガイド」タブへ */
  onOpenTravelGuide?: () => void;
  resetToSearchKey?: number;
  onTutorialAction?: (actionId: string) => void;
}

type SearchPanelSpot = Spot & { placeId?: string; source?: "google" };

type GoogleSearchResponse = {
  locations?: SearchLocation[];
  error?: string;
};

type CuratedGenreFetchResult =
  | { ok: true; locations: SearchLocation[] }
  | { ok: false; error: string };

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
  onJumpToMap: () => void;
  onOpenGuide: () => void;
}

interface SpotGridCardProps {
  spot: SearchPanelSpot | Spot;
  fallbackEmoji: string;
  onOpen: () => void;
  onJumpToMap: () => void;
  onOpenGuide: () => void;
}

function getSearchCategory(category?: string, type?: string): string {
  const source = `${category || ""} ${type || ""}`;
  if (/festival|event/.test(source)) return "祭り・行事";
  if (/performing_arts|dance|music/.test(source)) return "伝統芸能";
  if (/museum|art_gallery|historical|history_museum/.test(source)) return "歴史・郷土文化";
  if (/educational_institution|store|point_of_interest|tourist_attraction|manufacturer/.test(source)) return "工芸・手しごと";
  return "工芸・手しごと";
}

function searchLocationToPanelSpot(location: SearchLocation, index: number): SearchPanelSpot {
  const category = location.genreLabel || getSearchCategory(location.category, location.type);
  const address = location.formattedAddress || location.name;

  return {
    id: -5000 - index,
    name: location.name,
    lat: location.lat,
    lng: location.lng,
    description: location.summary || `${category}を楽しめるスポットです。`,
    category,
    reviews: [],
    infos: [{ type: "address", label: "住所", value: address }],
    photos: location.photos,
    placeId: location.placeId,
  };
}

function getPrimaryPhoto(spot: SearchPanelSpot | Spot) {
  return spot.photos?.[0] || null;
}

function getFallbackEmojiByCategory(category: string) {
  return GENRES.find((genre) => genre.label === category)?.emoji || "📍";
}

const shelfActionBtnStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  padding: "3px 2px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

function SpotShelfCard({ spot, fallbackEmoji, onOpen, onJumpToMap, onOpenGuide }: SpotShelfCardProps) {
  const primaryPhoto = getPrimaryPhoto(spot);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    setPhotoFailed(false);
  }, [primaryPhoto]);

  const showImage = Boolean(primaryPhoto) && !photoFailed;

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
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div style={{ position: "relative", aspectRatio: "1 / 1", background: "linear-gradient(135deg, #f6d7b8, #f3b6c3)" }}>
          {showImage ? (
            // Google Places photo URLs are resolved at runtime and are not preconfigured for next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryPhoto!}
              alt={spot.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white" style={{ fontSize: "36px" }}>
              {fallbackEmoji}
            </div>
          )}
        </div>
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          padding: "4px 4px 5px",
        }}
      >
        <button type="button" onClick={onJumpToMap} aria-label="地図へ" style={shelfActionBtnStyle}>
          <LocationIcon size={14} color="#e88fa3" />
          <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", lineHeight: 1.1 }}>地図</span>
        </button>
        <div
          style={{
            width: "1px",
            alignSelf: "stretch",
            flexShrink: 0,
            backgroundColor: "#e5e7eb",
            margin: "2px 0",
          }}
          aria-hidden
        />
        <button type="button" onClick={onOpenGuide} aria-label="ガイドへ" style={shelfActionBtnStyle}>
          <TravelGuideIcon size={14} color="#e88fa3" />
          <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", lineHeight: 1.1 }}>ガイド</span>
        </button>
      </div>
    </div>
  );
}

function SpotGridCard({ spot, fallbackEmoji, onOpen, onJumpToMap, onOpenGuide }: SpotGridCardProps) {
  const primaryPhoto = getPrimaryPhoto(spot);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    setPhotoFailed(false);
  }, [primaryPhoto]);

  const showImage = Boolean(primaryPhoto) && !photoFailed;

  const jumpBtnClass =
    "flex flex-1 flex-col items-center justify-center gap-0.5 border-0 bg-transparent py-1 text-xs font-bold leading-tight";

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm" style={{ border: "1px solid #f3f4f6" }}>
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div style={{ position: "relative", aspectRatio: "1 / 1", background: "linear-gradient(135deg, #f6d7b8, #f3b6c3)" }}>
          {showImage ? (
            // Google Places photo URLs are resolved at runtime and are not preconfigured for next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryPhoto!}
              alt={spot.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white" style={{ fontSize: "40px" }}>
              {fallbackEmoji}
            </div>
          )}
        </div>
      </button>

      <div className="p-3">
        <div className="flex items-stretch">
          <button type="button" onClick={onJumpToMap} className={jumpBtnClass} style={{ color: "#e88fa3" }}>
            <LocationIcon size={18} color="#e88fa3" />
            地図へ
          </button>
          <div className="my-0.5 w-px shrink-0 self-stretch bg-gray-200" aria-hidden />
          <button type="button" onClick={onOpenGuide} className={jumpBtnClass} style={{ color: "#e88fa3" }}>
            <TravelGuideIcon size={18} color="#e88fa3" />
            ガイドへ
          </button>
        </div>

        <div className="mt-2">
          <button
            type="button"
            onClick={onOpen}
            className="w-full rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ color: "#e88fa3", border: "1px solid #f3b6c3" }}
          >
            詳細を見る
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MapTabView({
  onSpotView,
  jumpToSpotId,
  onJumpComplete,
  favoriteSpotIds,
  onToggleFavorite,
  recommendedSpotIds,
  onOpenLanguageHelper,
  onOpenTravelGuide,
  resetToSearchKey = 0,
  onTutorialAction,
}: MapTabViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState<"map" | "search">("search");
  const [selectedSpot, setSelectedSpot] = useState<SearchPanelSpot | Spot | null>(null);
  const [isFetchingSpotInfo, setIsFetchingSpotInfo] = useState(false);
  const [localJumpId, setLocalJumpId] = useState<number | null>(null);
  const [mapSearchLocations, setMapSearchLocations] = useState<SearchLocation[] | null>(null);
  const [searchResults, setSearchResults] = useState<SearchPanelSpot[]>([]);
  const [searchResultLocations, setSearchResultLocations] = useState<SearchLocation[] | null>(null);
  const [genreResults, setGenreResults] = useState<Partial<Record<GenreId, SearchPanelSpot[]>>>({});
  const [genreLocations, setGenreLocations] = useState<Partial<Record<GenreId, SearchLocation[]>>>({});
  const [genreLoading, setGenreLoading] = useState<Partial<Record<GenreId, boolean>>>({});
  const [genreErrors, setGenreErrors] = useState<Partial<Record<GenreId, string>>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const selectedGenreParam = searchParams.get("genre");
  const selectedGenre = GENRES.some(genre => genre.id === selectedGenreParam)
    ? (selectedGenreParam as GenreId)
    : null;

  const fetchGoogleLocations = useCallback(async (query: string) => {
    const res = await fetch(`/api/google-places/search?query=${encodeURIComponent(query)}`);
    const data: GoogleSearchResponse = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "search failed");
    }
    return data.locations || [];
  }, []);

  const fetchCuratedGenreLocations = useCallback(async (genreId: GenreId) => {
    const res = await fetch(`/api/google-places/curated?genre=${encodeURIComponent(genreId)}`);
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
  }, []);

  const enrichSpotDetail = useCallback(async (spot: SearchPanelSpot | Spot) => {
    if (!("placeId" in spot) || !spot.placeId) return;

    setIsFetchingSpotInfo(true);
    try {
      const res = await fetch(`/api/google-places/detail?placeId=${encodeURIComponent(spot.placeId)}`);
      const info: GooglePlaceDetailResponse = await res.json();

      if (!res.ok) {
        throw new Error(info.error || "detail fetch failed");
      }

      const extraInfos: Spot["infos"] = [];
      if (info.hours)   extraInfos.push({ type: "hours", label: "営業時間", value: info.hours });
      if (info.address) extraInfos.push({ type: "address", label: "住所", value: info.address });
      if (info.phone)   extraInfos.push({ type: "phone", label: "電話番号", value: info.phone });
      if (info.website) extraInfos.push({ type: "website", label: "Webサイト", value: info.website });
      if (info.mapsUrl) extraInfos.push({ type: "website", label: "Google Maps", value: info.mapsUrl });

      setSelectedSpot(prev => {
        if (!prev) return prev;
        if (!("placeId" in prev) || prev.placeId !== spot.placeId) return prev;

        return {
          ...prev,
          name: info.name || prev.name,
          category: info.category ? getSearchCategory(info.category, info.category) : prev.category,
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
  }, []);

  const openSpotDetail = useCallback((spot: SearchPanelSpot | Spot) => {
    setSelectedSpot(spot);
    onSpotView({ id: spot.id, name: spot.name, category: spot.category });
    void enrichSpotDetail(spot);
  }, [enrichSpotDetail, onSpotView]);

  const loadGenre = useCallback(async (genreId: GenreId) => {
    const genre = GENRES.find(item => item.id === genreId);
    const hasLoadedGenre = Object.prototype.hasOwnProperty.call(genreResults, genreId);
    if (!genre || (hasLoadedGenre && !genreErrors[genreId]) || genreLoading[genreId]) return;

    setGenreLoading(prev => ({ ...prev, [genreId]: true }));
    setGenreErrors(prev => {
      const next = { ...prev };
      delete next[genreId];
      return next;
    });
    try {
      const result = await fetchCuratedGenreLocations(genreId);
      if (!result.ok) {
        setGenreLocations(prev => ({ ...prev, [genreId]: [] }));
        setGenreResults(prev => {
          const next = { ...prev };
          delete next[genreId];
          return next;
        });
        setGenreErrors(prev => ({
          ...prev,
          [genreId]: "このジャンルの候補を取得できませんでした。時間をおいて再度お試しください。",
        }));
        return;
      }

      const locations = result.locations;
      setGenreLocations(prev => ({ ...prev, [genreId]: locations }));
      setGenreResults(prev => ({ ...prev, [genreId]: locations.map(searchLocationToPanelSpot) }));
    } catch (error) {
      console.warn("genre google search error:", error);
      setGenreLocations(prev => ({ ...prev, [genreId]: [] }));
      setGenreResults(prev => {
        const next = { ...prev };
        delete next[genreId];
        return next;
      });
      setGenreErrors(prev => ({
        ...prev,
        [genreId]: "このジャンルの候補を取得できませんでした。時間をおいて再度お試しください。",
      }));
    } finally {
      setGenreLoading(prev => ({ ...prev, [genreId]: false }));
    }
  }, [fetchCuratedGenreLocations, genreErrors, genreLoading, genreResults]);

  /** 「もっと見る」・URL直叩き用。キュレーション全件＋検索で最大30件 */
  const loadGenreExpanded = useCallback(async (genreId: GenreId) => {
    const genre = GENRES.find(item => item.id === genreId);
    if (!genre) return;

    setGenreLoading(prev => ({ ...prev, [genreId]: true }));
    setGenreErrors(prev => {
      const next = { ...prev };
      delete next[genreId];
      return next;
    });
    try {
      const res = await fetch(`/api/google-places/curated?genre=${encodeURIComponent(genreId)}&expanded=1`);
      const data: GoogleSearchResponse = await res.json();
      if (!res.ok) {
        setGenreLocations(prev => ({ ...prev, [genreId]: [] }));
        setGenreResults(prev => {
          const next = { ...prev };
          delete next[genreId];
          return next;
        });
        setGenreErrors(prev => ({
          ...prev,
          [genreId]: "このジャンルの候補を取得できませんでした。時間をおいて再度お試しください。",
        }));
        return;
      }
      const locations = data.locations || [];
      setGenreLocations(prev => ({ ...prev, [genreId]: locations }));
      setGenreResults(prev => ({ ...prev, [genreId]: locations.map(searchLocationToPanelSpot) }));
    } catch (error) {
      console.warn("genre expanded load error:", error);
      setGenreErrors(prev => ({
        ...prev,
        [genreId]: "このジャンルの候補を取得できませんでした。時間をおいて再度お試しください。",
      }));
    } finally {
      setGenreLoading(prev => ({ ...prev, [genreId]: false }));
    }
  }, []);

  const handleSearch = async () => {
    setHasSearched(true);

    if (!keyword.trim()) {
      setSearchResults([]);
      setSearchResultLocations(null);
      return;
    }

    setIsSearching(true);
    try {
      const locations = await fetchGoogleLocations(keyword.trim());
      setSearchResultLocations(locations);
      setSearchResults(locations.map(searchLocationToPanelSpot));
      setMapSearchLocations(null);
    } catch (error) {
      console.error("search panel google search error:", error);
      setSearchResultLocations([]);
      setSearchResults([]);
      setMapSearchLocations(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearAll = () => {
    setKeyword("");
    setHasSearched(false);
    setSearchResults([]);
    setSearchResultLocations(null);
    setMapSearchLocations(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("genre");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
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

    setActiveSubTab("search");
    setSelectedSpot(null);
    setLocalJumpId(null);
    setMapSearchLocations(null);
    setKeyword("");
    setHasSearched(false);
    setSearchResults([]);
    setSearchResultLocations(null);
    setGenreErrors({});

    const params = new URLSearchParams(searchParams.toString());
    params.delete("genre");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, resetToSearchKey, router, searchParams]);

  const displayedSpots = hasSearched ? searchResults : [];
  const displayedLocations = hasSearched ? searchResultLocations : null;
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
        label: genre.label,
        emoji: genre.emoji,
        spots: grouped.get(genre.label) || [],
      }))
      .filter((section) => section.spots.length > 0);

    const otherSections = Array.from(grouped.entries())
      .filter(([label]) => !GENRES.some((genre) => genre.label === label))
      .map(([label, spots]) => ({
        label,
        emoji: "📍",
        spots,
      }));

    return [...orderedSections, ...otherSections];
  }, [displayedSpots]);

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
          <p style={{ fontSize: "13px", color: "#991b1b", lineHeight: "1.8" }}>{genreError}</p>
          <button
            onClick={() => void (expandedRetry ? loadGenreExpanded(genreId) : loadGenre(genreId))}
            className="mt-3 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ border: "1px solid #f3d1da", color: "#e88fa3", backgroundColor: "#fff" }}
          >
            もう一度読み込む
          </button>
        </div>
      );
    }

    if (spots.length === 0) {
      return (
        <div className="rounded-3xl bg-white px-4 py-6 text-sm text-gray-500 shadow-sm" style={{ border: "1px solid #f3f4f6" }}>
          いまはこのジャンルの候補が見つかっていません。
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
    const params = new URLSearchParams(searchParams.toString());
    params.delete("genre");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl, { scroll: false });
  };

  // 検索結果をタップ → マップタブへ切り替えてジャンプ
  const handleSearchResultClick = (
    spot: SearchPanelSpot | Spot,
    sourceLocations: SearchLocation[] | null = displayedLocations
  ) => {
    if (sourceLocations && "placeId" in spot && spot.placeId) {
      const matched = sourceLocations.find(location => location.placeId === spot.placeId);
      if (matched) {
        setActiveSubTab("map");
        onSpotView({ id: spot.id, name: spot.name, category: spot.category });
        setSelectedSpot(null);
        setMapSearchLocations([matched]);
        return;
      }
    }
    setMapSearchLocations(null);
    setLocalJumpId(spot.id);
    setActiveSubTab("map");
    setSelectedSpot(null);
    onSpotView({ id: spot.id, name: spot.name, category: spot.category });
  };

  const effectiveJumpId = jumpToSpotId ?? localJumpId;

  const handleJumpComplete = () => {
    setLocalJumpId(null);
    onJumpComplete();
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* サブタブヘッダー */}
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
            宮城の伝統文化体験
          </h1>
        </div>
        <div className="flex" style={{ backgroundColor: "rgba(255,255,255,0.12)", borderTop: "1px solid rgba(255,255,255,0.24)" }}>
          {(["search", "map"] as const).map((tab) => {
            const isActive = activeSubTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  onTutorialAction?.(`map.subtab.${tab}`);
                  setActiveSubTab(tab);
                }}
                data-tutorial-id={`map.subtab.${tab}`}
                className="flex-1 text-sm font-medium border-b-2 transition-colors"
                style={{
                  padding: "12px 8px",
                  borderBottomColor: isActive ? "#ffffff" : "transparent",
                  color: "#ffffff",
                  backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  borderRight: tab === "search" ? "1px solid rgba(255,255,255,0.24)" : "none",
                }}
              >
                {tab === "search" ? "🔎体験を探す" : "🗺️マップ"}
              </button>
            );
          })}
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 relative">
        {/* マップ（常にマウント・切り替え時は非表示） */}
        <div
          className="absolute inset-0"
          style={{ visibility: activeSubTab === "map" ? "visible" : "hidden" }}
        >
          <MapView
            onSpotView={onSpotView}
            jumpToSpotId={effectiveJumpId}
            onJumpComplete={handleJumpComplete}
            favoriteSpotIds={favoriteSpotIds}
            onToggleFavorite={onToggleFavorite}
            recommendedSpotIds={recommendedSpotIds}
            externalSearchLocations={mapSearchLocations}
          />
        </div>

        {/* 検索パネル */}
        {activeSubTab === "search" && (
          <div className="absolute inset-0 bg-gray-50 overflow-y-auto" style={{ paddingBottom: "80px" }}>
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
                    placeholder="スポットで探す"
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
                    <p className="text-xs font-semibold" style={{ color: "#e88fa3" }}>名前検索</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                      {`「${keyword}」の検索結果`}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      スポット名から見つかった候補を、写真つきで表示します。
                    </p>
                  </div>
                  <button
                    onClick={handleClearAll}
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ border: "1px solid #f3d1da", color: "#e88fa3", backgroundColor: "#fff" }}
                  >
                    戻す
                  </button>
                </div>
              )}

              {!hasSearched && selectedGenreConfig && (
                <div className="mb-5">
                  <button
                    onClick={closeGenrePage}
                    className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-gray-500"
                  >
                    <span style={{ fontSize: "18px", lineHeight: 1 }}>←</span>
                    一覧へ戻る
                  </button>
                  <h2 className="pl-3" style={{ fontSize: "18px", fontWeight: 800, color: "#ef7e8d" }}>
                    {selectedGenreConfig.label}
                  </h2>
                </div>
              )}

              {hasSearched && !isSearching && displayedSpots.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-sm">スポットが見つかりませんでした</p>
                  <p className="text-xs mt-1">条件を変えて再度お試しください</p>
                </div>
              )}

              {isSearching && (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-4xl mb-3">⏳</p>
                  <p className="text-sm">写真付きスポットを読み込み中です</p>
                </div>
              )}

              {hasSearched ? (
                <div className="space-y-8">
                  {groupedSearchSections.map((section) => (
                    <section key={section.label}>
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
                            fallbackEmoji={getFallbackEmojiByCategory(section.label)}
                            onOpen={() => openSpotDetail(spot)}
                            onJumpToMap={() => handleSearchResultClick(spot, displayedLocations)}
                            onOpenGuide={() => onOpenTravelGuide?.()}
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
                      {(genreResults[selectedGenreConfig.id] || []).map((spot) => (
                        <SpotGridCard
                          key={spot.id}
                          spot={spot}
                          fallbackEmoji={selectedGenreConfig.emoji}
                          onOpen={() => openSpotDetail(spot)}
                          onJumpToMap={() =>
                            handleSearchResultClick(spot, genreLocations[selectedGenreConfig.id] || null)
                          }
                          onOpenGuide={() => onOpenTravelGuide?.()}
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
                            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#ef7e8d", lineHeight: 1.2 }}>{genre.label}</h2>
                          </div>
                          <button
                            onClick={() => openGenrePage(genre.id)}
                            className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                            style={{ border: "1px solid #f3d1da", color: "#ef95a5", backgroundColor: "#fff" }}
                          >
                            もっと見る &gt;
                          </button>
                        </div>

                        {renderGenreState(genre.id, allSpots, isGenreLoading)}

                        {!isGenreLoading && !genreErrors[genre.id] && allSpots.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                            {shelfSpots.map((spot) => (
                              <SpotShelfCard
                                key={spot.id}
                                spot={spot}
                                fallbackEmoji={genre.emoji}
                                onOpen={() => openSpotDetail(spot)}
                                onJumpToMap={() => handleSearchResultClick(spot, genreLocations[genre.id] || null)}
                                onOpenGuide={() => onOpenTravelGuide?.()}
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
        )}
      </div>

      {/* スポット詳細シート */}
      {selectedSpot && (
        <SpotDetailSheet
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
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
            handleSearchResultClick(spot, locs);
          }}
        />
      )}
    </div>
  );
}
