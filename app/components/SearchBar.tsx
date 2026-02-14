"use client";

import { useState } from "react";

// 検索結果の位置情報の型
export interface SearchLocation {
  lat: number;
  lng: number;
  name: string;
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

// 北海道の座標範囲
const HOKKAIDO_BOUNDS = {
  minLat: 40.5,
  maxLat: 46.0,
  minLng: 138.0,
  maxLng: 146.5,
};

// 座標が北海道内かチェック
function isInHokkaido(lat: number, lng: number): boolean {
  return (
    lat >= HOKKAIDO_BOUNDS.minLat &&
    lat <= HOKKAIDO_BOUNDS.maxLat &&
    lng >= HOKKAIDO_BOUNDS.minLng &&
    lng <= HOKKAIDO_BOUNDS.maxLng
  );
}

// Nominatim APIで地名から座標を取得（複数結果対応、北海道のみ）
async function geocodeLocations(query: string): Promise<SearchLocation[]> {
  try {
    // 北海道内での検索を優先するためにviewboxを設定
    const params = new URLSearchParams({
      q: query + " 北海道",
      format: "json",
      limit: "20", // 多めに取得してフィルタリング
      viewbox: "138.0,46.0,146.5,40.5",
      bounded: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "Accept-Language": "ja",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    let data = await response.json();

    if (data.length === 0) {
      // bounded検索で見つからなかった場合、北海道キーワードで再検索
      const paramsUnbounded = new URLSearchParams({
        q: query + " 北海道",
        format: "json",
        limit: "20",
      });

      const responseUnbounded = await fetch(
        `https://nominatim.openstreetmap.org/search?${paramsUnbounded}`,
        {
          headers: {
            "Accept-Language": "ja",
          },
        }
      );

      data = await responseUnbounded.json();
    }

    // 結果を変換し、北海道内のみフィルタリング
    const results: SearchLocation[] = data
      .map((result: { lat: string; lon: string; display_name: string }) => ({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        name: result.display_name,
      }))
      .filter((loc: SearchLocation) => isInHokkaido(loc.lat, loc.lng));

    // 最大10件まで
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
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const locations = await geocodeLocations(searchValue.trim());
      if (locations.length > 0) {
        onLocationSearch({
          locations,
          query: searchValue.trim(),
        });
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
    onClearSearch();
  };

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
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSearching}
            className="flex-1 bg-transparent border-none outline-none text-base text-gray-800 placeholder-gray-400 disabled:opacity-50"
          />
          
          {/* クリアボタン（入力がある時 または 検索結果がある時に表示） */}
          {(searchValue || hasSearchResults) && !isSearching && (
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
