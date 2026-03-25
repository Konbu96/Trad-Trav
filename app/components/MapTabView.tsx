"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { recommendedSpots, type Spot } from "../data/spots";
import SpotDetailSheet from "./SpotDetailSheet";

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

const CATEGORIES = ["すべて", "観光", "体験", "グルメ"] as const;
type Category = typeof CATEGORIES[number];

const AREAS = ["すべて", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"] as const;
type Area = typeof AREAS[number];

const CATEGORY_EMOJI: Record<Category, string> = {
  すべて: "🗾",
  観光: "🏯",
  体験: "🎭",
  グルメ: "🍜",
};

interface MapTabViewProps {
  onSpotView: (spot: { id: number; name: string; category: string }) => void;
  jumpToSpotId: number | null;
  onJumpComplete: () => void;
  favoriteSpotIds: number[];
  onToggleFavorite: (spotId: number) => void;
  recommendedSpotIds: number[] | null;
}

export default function MapTabView({
  onSpotView,
  jumpToSpotId,
  onJumpComplete,
  favoriteSpotIds,
  onToggleFavorite,
  recommendedSpotIds,
}: MapTabViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"map" | "search">("search");
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [localJumpId, setLocalJumpId] = useState<number | null>(null);

  // 検索フォームの状態
  const [selectedCategory, setSelectedCategory] = useState<Category>("すべて");
  const [keyword, setKeyword] = useState("");
  const [selectedArea, setSelectedArea] = useState<Area>("すべて");

  // 実際に適用されたフィルタ（「検索する」ボタン押下後）
  const [appliedCategory, setAppliedCategory] = useState<Category>("すべて");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedArea, setAppliedArea] = useState<Area>("すべて");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    setAppliedCategory(selectedCategory);
    setAppliedKeyword(keyword);
    setAppliedArea(selectedArea);
    setHasSearched(true);
  };

  const handleClearAll = () => {
    setSelectedCategory("すべて");
    setKeyword("");
    setSelectedArea("すべて");
    setAppliedCategory("すべて");
    setAppliedKeyword("");
    setAppliedArea("すべて");
    setHasSearched(false);
  };

  const filteredSpots = useMemo(() => {
    if (!hasSearched) return recommendedSpots;
    return recommendedSpots.filter(spot => {
      const matchCategory = appliedCategory === "すべて" || spot.category === appliedCategory;
      const matchKeyword =
        !appliedKeyword ||
        spot.name.includes(appliedKeyword) ||
        spot.description?.includes(appliedKeyword);
      const matchArea =
        appliedArea === "すべて" ||
        spot.infos?.some(i => i.type === "address" && i.value.includes(appliedArea));
      return matchCategory && matchKeyword && matchArea;
    });
  }, [hasSearched, appliedCategory, appliedKeyword, appliedArea]);

  // 検索結果をタップ → マップタブへ切り替えてジャンプ
  const handleSearchResultClick = (spot: Spot) => {
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
                {tab === "map" ? "🗺️ マップ" : "🔍 スポット検索"}
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
          />
        </div>

        {/* 検索パネル */}
        {activeSubTab === "search" && (
          <div className="absolute inset-0 bg-gray-50 overflow-y-auto" style={{ paddingBottom: "80px" }}>

            {/* ── 検索フォーム ── */}
            <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* キーワード */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-2">🔍 キーワード</p>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="スポット名・キーワードを入力..."
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

              {/* カテゴリ */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 mb-2">🏷️ カテゴリ</p>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => {
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-colors"
                        style={{
                          border: isActive ? "2px solid #ec4899" : "2px solid #e5e7eb",
                          backgroundColor: isActive ? "#fdf2f8" : "white",
                          color: isActive ? "#be185d" : "#374151",
                        }}
                      >
                        <span>{CATEGORY_EMOJI[cat]}</span>
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* エリア（都道府県） */}
              <div className="px-4 py-3">
                <p className="text-xs font-bold text-gray-500 mb-2">📍 エリア（都道府県）</p>
                <div className="grid grid-cols-3 gap-2">
                  {AREAS.map(area => {
                    const isActive = selectedArea === area;
                    return (
                      <button
                        key={area}
                        onClick={() => setSelectedArea(area)}
                        className="py-2 px-2 rounded-xl text-xs font-medium text-center transition-colors"
                        style={{
                          border: isActive ? "2px solid #ec4899" : "2px solid #e5e7eb",
                          backgroundColor: isActive ? "#fdf2f8" : "white",
                          color: isActive ? "#be185d" : "#374151",
                        }}
                      >
                        {area === "すべて" ? "🗾 すべて" : area.replace("県", "")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 検索ボタン */}
              <div className="px-4 pb-4">
                <button
                  onClick={handleSearch}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #ec4899, #be185d)",
                    boxShadow: "0 4px 14px rgba(236,72,153,0.3)",
                  }}
                >
                  🔍 検索する
                </button>
              </div>
            </div>

            {/* ── 検索結果 ── */}
            <div className="px-4 pt-5 space-y-2">
              {hasSearched && (
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 font-medium">
                    {filteredSpots.length}件のスポットが見つかりました
                  </p>
                  <button
                    onClick={handleClearAll}
                    className="text-xs font-medium"
                    style={{ color: "#ec4899" }}
                  >
                    条件をリセット
                  </button>
                </div>
              )}

              {!hasSearched && (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-5xl mb-3">🏯</p>
                  <p className="text-sm font-medium text-gray-500">条件を選んで検索してください</p>
                  <p className="text-xs mt-1 text-gray-400">東北全{recommendedSpots.length}スポットから探せます</p>
                </div>
              )}

              {hasSearched && filteredSpots.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-sm">スポットが見つかりませんでした</p>
                  <p className="text-xs mt-1">条件を変えて再度お試しください</p>
                </div>
              )}

              {hasSearched && filteredSpots.map(spot => (
                <div
                  key={spot.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-gray-900 text-sm">{spot.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#fdf2f8", color: "#be185d" }}>
                            {spot.category}
                          </span>
                          {spot.infos?.find(i => i.type === "address") && (
                            <span className="text-xs text-gray-400">
                              📍 {spot.infos.find(i => i.type === "address")!.value.split("県")[0]}県
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {spot.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedSpot(spot);
                          onSpotView({ id: spot.id, name: spot.name, category: spot.category });
                        }}
                        className="flex-1 text-xs rounded-lg py-2 font-medium"
                        style={{ color: "#ec4899", border: "1px solid #f9a8d4" }}
                      >
                        詳細を見る
                      </button>
                      <button
                        onClick={() => handleSearchResultClick(spot)}
                        className="flex-1 text-xs text-white rounded-lg py-2 font-medium flex items-center justify-center gap-1"
                        style={{ backgroundColor: "#ec4899" }}
                      >
                        🗺️ 地図で見る
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* スポット詳細シート */}
      {selectedSpot && (
        <SpotDetailSheet
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          isFavorite={favoriteSpotIds.includes(selectedSpot.id)}
          onToggleFavorite={() => onToggleFavorite(selectedSpot.id)}
        />
      )}
    </div>
  );
}
