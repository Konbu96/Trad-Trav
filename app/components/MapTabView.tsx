"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type Spot } from "../data/spots";
import { TRADITIONAL_GENRES, type TraditionalGenreId } from "../data/traditionalGenres";
import SpotDetailSheet from "./SpotDetailSheet";
import type { SearchLocation } from "./SearchBar";

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

interface MapTabViewProps {
  onSpotView: (spot: { id: number; name: string; category: string }) => void;
  jumpToSpotId: number | null;
  onJumpComplete: () => void;
  favoriteSpotIds: number[];
  onToggleFavorite: (spotId: number) => void;
  recommendedSpotIds: number[] | null;
  onOpenLanguageHelper?: (spotName: string) => void;
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
}

interface SpotGridCardProps {
  spot: SearchPanelSpot | Spot;
  fallbackEmoji: string;
  onOpen: () => void;
  onShowMap: () => void;
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

function SpotShelfCard({ spot, fallbackEmoji, onOpen }: SpotShelfCardProps) {
  const primaryPhoto = getPrimaryPhoto(spot);

  return (
    <button
      onClick={onOpen}
      className="w-28 shrink-0 overflow-hidden rounded-3xl bg-white text-left shadow-sm"
      style={{ border: "1px solid #f3f4f6" }}
    >
      <div style={{ position: "relative", aspectRatio: "1 / 1", background: "linear-gradient(135deg, #fde68a, #f9a8d4)" }}>
        {primaryPhoto ? (
          // Google Places photo URLs are resolved at runtime and are not preconfigured for next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryPhoto}
            alt={spot.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white" style={{ fontSize: "36px" }}>
            {fallbackEmoji}
          </div>
        )}
      </div>
      <div className="px-3 py-2">
        <p className="line-clamp-1 text-sm font-semibold text-gray-900">{spot.name}</p>
      </div>
    </button>
  );
}

function SpotGridCard({ spot, fallbackEmoji, onOpen, onShowMap }: SpotGridCardProps) {
  const primaryPhoto = getPrimaryPhoto(spot);

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm" style={{ border: "1px solid #f3f4f6" }}>
      <button onClick={onOpen} className="block w-full text-left">
        <div style={{ position: "relative", aspectRatio: "1 / 1", background: "linear-gradient(135deg, #fde68a, #f9a8d4)" }}>
          {primaryPhoto ? (
            // Google Places photo URLs are resolved at runtime and are not preconfigured for next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryPhoto}
              alt={spot.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white" style={{ fontSize: "40px" }}>
              {fallbackEmoji}
            </div>
          )}
        </div>
      </button>

      <div className="p-3">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">{spot.name}</p>

        <div className="mt-3 grid grid-cols-1 gap-2">
          <button
            onClick={onOpen}
            className="rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ color: "#ec4899", border: "1px solid #f9a8d4" }}
          >
            詳細を見る
          </button>
          <button
            onClick={onShowMap}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: "#ec4899" }}
          >
            地図で見る
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
      throw new Error(data.error || "curated search failed");
    }
    return data.locations || [];
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
    if (!genre || genreResults[genreId] || genreLoading[genreId]) return;

    setGenreLoading(prev => ({ ...prev, [genreId]: true }));
    try {
      const locations = await fetchCuratedGenreLocations(genreId);
      setGenreLocations(prev => ({ ...prev, [genreId]: locations }));
      setGenreResults(prev => ({ ...prev, [genreId]: locations.map(searchLocationToPanelSpot) }));
    } catch (error) {
      console.error("genre google search error:", error);
      setGenreLocations(prev => ({ ...prev, [genreId]: [] }));
      setGenreResults(prev => ({ ...prev, [genreId]: [] }));
    } finally {
      setGenreLoading(prev => ({ ...prev, [genreId]: false }));
    }
  }, [fetchCuratedGenreLocations, genreLoading, genreResults]);

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
      GENRES.forEach((genre) => {
        void loadGenre(genre.id);
      });
    }
  }, [hasSearched, loadGenre]);

  const displayedSpots = hasSearched ? searchResults : [];
  const displayedLocations = hasSearched ? searchResultLocations : null;
  const selectedGenreConfig = selectedGenre
    ? GENRES.find(genre => genre.id === selectedGenre) || null
    : null;

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
      <div className="flex-shrink-0 bg-white border-b border-gray-200 pt-12 z-10">
        <div className="flex">
          {(["map", "search"] as const).map((tab) => {
            const isActive = activeSubTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className="flex-1 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderBottomColor: isActive ? "#ec4899" : "transparent",
                  color: isActive ? "#ec4899" : "#6b7280",
                }}
              >
                {tab === "map" ? "🗺️ マップ" : "🔍 体験を探す"}
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
            <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-5">
              <div className="mb-4">
                <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") void handleSearch(); }}
                    placeholder="スポット名で探す"
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

              {!hasSearched && (
                <p className="text-xs text-gray-500">
                  ジャンルごとに、Google Maps から拾った写真付きスポットを5件ずつ表示しています。
                </p>
              )}
            </div>

            <div className="px-4 pt-5">
              {hasSearched && (
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-pink-500">名前検索</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">
                      {`「${keyword}」の検索結果`}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      スポット名から見つかった候補を、写真つきで表示します。
                    </p>
                  </div>
                  <button
                    onClick={handleClearAll}
                    className="shrink-0 rounded-full border border-pink-200 px-3 py-1 text-xs font-semibold text-pink-500"
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
                  <p className="text-xs font-semibold text-pink-500">{selectedGenreConfig.label}</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900">{selectedGenreConfig.heading}</h2>
                  <p className="mt-1 text-sm text-gray-500">{selectedGenreConfig.description}</p>
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
                <div className="grid grid-cols-2 gap-4">
                  {displayedSpots.map((spot) => (
                    <SpotGridCard
                      key={spot.id}
                      spot={spot}
                      fallbackEmoji="🔍"
                      onOpen={() => openSpotDetail(spot)}
                      onShowMap={() => handleSearchResultClick(spot, searchResultLocations)}
                    />
                  ))}
                </div>
              ) : selectedGenreConfig ? (
                <div className="grid grid-cols-2 gap-4">
                  {(genreResults[selectedGenreConfig.id] || []).map((spot) => (
                    <SpotGridCard
                      key={spot.id}
                      spot={spot}
                      fallbackEmoji={selectedGenreConfig.emoji}
                      onOpen={() => openSpotDetail(spot)}
                      onShowMap={() => handleSearchResultClick(spot, genreLocations[selectedGenreConfig.id] || null)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  {GENRES.map((genre) => {
                    const spots = genreResults[genre.id] || [];
                    const isGenreLoading = genreLoading[genre.id];

                    return (
                      <section key={genre.id}>
                        <div className="mb-3 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold text-pink-500">{genre.label}</p>
                            <h2 className="mt-1 text-lg font-bold text-gray-900">{genre.heading}</h2>
                          </div>
                          <button
                            onClick={() => openGenrePage(genre.id)}
                            className="shrink-0 rounded-full border border-pink-200 px-3 py-1 text-xs font-semibold text-pink-500"
                          >
                            もっと見る &gt;
                          </button>
                        </div>

                        {isGenreLoading && (
                          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                            {Array.from({ length: 5 }).map((_, index) => (
                              <div
                                key={index}
                                className="w-28 shrink-0 overflow-hidden rounded-3xl bg-white shadow-sm animate-pulse"
                                style={{ border: "1px solid #f3f4f6" }}
                              >
                                <div style={{ aspectRatio: "1 / 1", backgroundColor: "#f3f4f6" }} />
                                <div className="p-3">
                                  <div className="h-3 w-20 rounded bg-gray-100" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!isGenreLoading && spots.length === 0 && (
                          <div className="rounded-3xl bg-white px-4 py-6 text-sm text-gray-500 shadow-sm" style={{ border: "1px solid #f3f4f6" }}>
                            いまはこのジャンルの候補が見つかっていません。
                          </div>
                        )}

                        {!isGenreLoading && spots.length > 0 && (
                          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                            {spots.map((spot) => (
                              <SpotShelfCard
                                key={spot.id}
                                spot={spot}
                                fallbackEmoji={genre.emoji}
                                onOpen={() => openSpotDetail(spot)}
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
        />
      )}
    </div>
  );
}
