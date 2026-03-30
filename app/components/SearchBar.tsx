"use client";

import { useState } from "react";

// 検索結果の位置情報の型
export interface SearchLocation {
  lat: number;
  lng: number;
  name: string;
  osm_id?: number;
  osm_type?: string;
  category?: string;
  type?: string;
  extratags?: {
    opening_hours?: string;
    phone?: string;
    website?: string;
    "contact:phone"?: string;
    "contact:website"?: string;
    fee?: string;
    access?: string;
    parking?: string;
    reservation?: string;
    [key: string]: string | undefined;
  };
  address?: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    [key: string]: string | undefined;
  };
}

// 検索結果（複数対応）
export interface SearchResult {
  locations: SearchLocation[];
  query: string;
}

interface SearchBarProps {
  onLocationSearch: (result: SearchResult) => void;
  onClearSearch: () => void;
  isHidden?: boolean;
  hasSearchResults?: boolean;
}

// 宮城県の座標範囲
const MIYAGI_BOUNDS = {
  minLat: 37.75,
  maxLat: 39.05,
  minLng: 140.45,
  maxLng: 141.95,
};

// 座標が宮城県内かチェック
function isInMiyagi(lat: number, lng: number): boolean {
  return (
    lat >= MIYAGI_BOUNDS.minLat &&
    lat <= MIYAGI_BOUNDS.maxLat &&
    lng >= MIYAGI_BOUNDS.minLng &&
    lng <= MIYAGI_BOUNDS.maxLng
  );
}

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  osm_id: number;
  osm_type: string;
  category: string;
  type: string;
  importance: number;
  extratags?: SearchLocation["extratags"];
  address?: SearchLocation["address"];
};

function toSearchLocation(r: NominatimResult): SearchLocation {
  return {
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    name: r.display_name,
    osm_id: r.osm_id,
    osm_type: r.osm_type,
    category: r.category,
    type: r.type,
    extratags: r.extratags,
    address: r.address,
  };
}

// Nominatim APIで地名から座標を取得（複数結果対応、宮城のみ）
async function geocodeLocations(query: string): Promise<SearchLocation[]> {
  const NOMINATIM = "https://nominatim.openstreetmap.org/search";
  // Miyagi viewbox: left(west), top(north), right(east), bottom(south)
  const VIEWBOX = "140.45,39.05,141.95,37.75";
  const HEADERS = { "Accept-Language": "ja", "User-Agent": "trad-trav-app" };

  const baseParams = {
    format: "json",
    limit: "20",
    addressdetails: "1",
    extratags: "1",
    countrycodes: "jp",
  };

  try {
    // Step 1: クエリそのまま + viewbox bounded で検索（最も精度が高い）
    const p1 = new URLSearchParams({ ...baseParams, q: query, viewbox: VIEWBOX, bounded: "1" });
    const r1 = await fetch(`${NOMINATIM}?${p1}`, { headers: HEADERS });
    if (!r1.ok) throw new Error("Geocoding failed");
    let data: NominatimResult[] = await r1.json();

    // Step 2: 結果が少ない場合、bounded なしで宮城全域を検索
    if (data.length < 3) {
      const p2 = new URLSearchParams({ ...baseParams, q: query, viewbox: VIEWBOX });
      const r2 = await fetch(`${NOMINATIM}?${p2}`, { headers: HEADERS });
      if (r2.ok) {
        const d2: NominatimResult[] = await r2.json();
        // 重複除去してマージ
        const existing = new Set(data.map(d => d.osm_id));
        data = [...data, ...d2.filter(d => !existing.has(d.osm_id))];
      }
    }

    // 宮城県内のみフィルタリング → importance 降順にソート
    const results = data
      .map(toSearchLocation)
      .filter(loc => isInMiyagi(loc.lat, loc.lng));

    return results.slice(0, 10);
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

export default function SearchBar({ 
  onLocationSearch, 
  onClearSearch,
  isHidden = false,
  hasSearchResults = false,
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [activeQuery, setActiveQuery] = useState(""); // 検索実行済みのクエリ
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    const query = searchValue.trim();
    if (!query || isSearching) return;

    setIsSearching(true);
    try {
      const locations = await geocodeLocations(query);
      if (locations.length > 0) {
        onLocationSearch({ locations, query });
        setActiveQuery(query); // 検索クエリを保持
        // 入力欄はクリアしない（activeQueryで表示）
        setSearchValue("");
      } else {
        alert("場所が見つかりませんでした");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchValue("");
    setActiveQuery("");
    onClearSearch();
  };

  // 表示する値：検索実行後はactiveQuery、入力中はsearchValue
  const displayValue = searchValue || activeQuery;

  return (
    <div 
      className="absolute top-0 left-0 right-0 z-50 safe-area-top"
      style={{
        opacity: isHidden ? 0 : 1,
        pointerEvents: isHidden ? "none" : "auto",
        transition: "opacity 0.3s ease-in-out",
      }}
    >
      <div 
        style={{
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingTop: "28px",
          paddingBottom: "16px",
        }}
      >
        <div 
          className="flex items-center bg-white rounded-full"
          style={{
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.15)",
            paddingLeft: "16px",
            paddingRight: "12px",
            paddingTop: "10px",
            paddingBottom: "10px",
            gap: "12px",
          }}
        >
          {/* 検索アイコン / ローディング */}
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <button onClick={handleSearch}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#666666"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          )}
          
          <input
            type="text"
            placeholder="場所を検索..."
            value={displayValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              // 入力し始めたらactiveQueryをリセット
              if (activeQuery) setActiveQuery("");
            }}
            onKeyDown={handleKeyDown}
            disabled={isSearching}
            style={{ color: activeQuery && !searchValue ? "#ec4899" : undefined }}
            className="flex-1 bg-transparent border-none outline-none text-base text-gray-800 placeholder-gray-400 disabled:opacity-50"
          />
          
          {/* クリアボタン（入力がある時 または 検索中クエリがある時に表示） */}
          {(displayValue || hasSearchResults) && !isSearching && (
            <button 
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#999999"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
