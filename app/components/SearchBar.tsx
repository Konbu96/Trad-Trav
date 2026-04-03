"use client";

import { useState } from "react";

// 検索結果の位置情報の型
export interface SearchLocation {
  lat: number;
  lng: number;
  name: string;
  placeId?: string;
  formattedAddress?: string;
  photos?: string[];
  summary?: string;
  officialSourceUrl?: string;
  genreLabel?: string;
  source?: "google";
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

type GooglePlacesSearchResponse = {
  locations?: SearchLocation[];
  error?: string;
};

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
      const res = await fetch(`/api/google-places/search?query=${encodeURIComponent(query)}`);
      const data: GooglePlacesSearchResponse = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google search failed");
      }

      const locations = data.locations || [];
      if (locations.length > 0) {
        onLocationSearch({ locations, query });
        setActiveQuery(query); // 検索クエリを保持
        // 入力欄はクリアしない（activeQueryで表示）
        setSearchValue("");
      } else {
        alert("場所が見つかりませんでした");
      }
    } catch (error) {
      console.error("Google Places search error:", error);
      alert("検索に失敗しました。Google Maps API の設定を確認してください。");
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
