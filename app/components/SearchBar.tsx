"use client";

import { useState } from "react";

// 検索結果の位置情報の型
export interface SearchLocation {
  lat: number;
  lng: number;
  zoom: number;
  name: string;
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
}

interface SearchBarProps {
  onLocationSearch: (location: SearchLocation) => void;
  isHidden?: boolean;
}

// 場所の種類に応じてズームレベルを決定
function getZoomLevel(boundingBox?: [number, number, number, number]): number {
  if (boundingBox) {
    const [south, north, west, east] = boundingBox;
    const latDiff = north - south;
    const lngDiff = east - west;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff > 1) return 8;
    if (maxDiff > 0.5) return 9;
    if (maxDiff > 0.2) return 10;
    if (maxDiff > 0.1) return 11;
    if (maxDiff > 0.05) return 12;
    if (maxDiff > 0.02) return 13;
    return 14;
  }
  
  return 14;
}

// Nominatim APIで地名から座標を取得
async function geocodeLocation(query: string): Promise<SearchLocation | null> {
  try {
    // 北海道内での検索を優先するためにviewboxを設定
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
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

    const data = await response.json();

    if (data.length === 0) {
      // 北海道内で見つからなかった場合、範囲制限なしで再検索
      const paramsUnbounded = new URLSearchParams({
        q: query + " 北海道",
        format: "json",
        limit: "1",
      });

      const responseUnbounded = await fetch(
        `https://nominatim.openstreetmap.org/search?${paramsUnbounded}`,
        {
          headers: {
            "Accept-Language": "ja",
          },
        }
      );

      const dataUnbounded = await responseUnbounded.json();
      
      if (dataUnbounded.length === 0) {
        return null;
      }

      const result = dataUnbounded[0];
      const boundingBox: [number, number, number, number] | undefined = result.boundingbox
        ? [
            parseFloat(result.boundingbox[0]),
            parseFloat(result.boundingbox[1]),
            parseFloat(result.boundingbox[2]),
            parseFloat(result.boundingbox[3]),
          ]
        : undefined;

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        zoom: getZoomLevel(boundingBox),
        name: result.display_name,
        boundingBox,
      };
    }

    const result = data[0];
    const boundingBox: [number, number, number, number] | undefined = result.boundingbox
      ? [
          parseFloat(result.boundingbox[0]),
          parseFloat(result.boundingbox[1]),
          parseFloat(result.boundingbox[2]),
          parseFloat(result.boundingbox[3]),
        ]
      : undefined;

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      zoom: getZoomLevel(boundingBox),
      name: result.display_name,
      boundingBox,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export default function SearchBar({ onLocationSearch, isHidden = false }: SearchBarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const location = await geocodeLocation(searchValue.trim());
      if (location) {
        onLocationSearch(location);
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
          
          {/* クリアボタン（入力がある時のみ表示） */}
          {searchValue && !isSearching && (
            <button 
              onClick={() => setSearchValue("")}
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
