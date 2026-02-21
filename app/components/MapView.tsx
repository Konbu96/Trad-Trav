"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SearchBar, { type SearchLocation, type SearchResult } from "./SearchBar";
import SpotDetailSheet from "./SpotDetailSheet";
import { recommendedSpots, type Spot } from "../data/spots";

// 北海道の中心座標
const HOKKAIDO_CENTER: [number, number] = [43.0642, 141.3469];
const DEFAULT_ZOOM = 7;

// 共通のピンアイコン（赤ピン + 茶色の中心）
const createPinIcon = (size: "small" | "normal" = "normal") => {
  const dimensions = size === "small" 
    ? { width: 22, height: 30, anchor: 11 }
    : { width: 28, height: 36, anchor: 14 };
  
  return L.divIcon({
    className: "custom-pin-icon",
    html: `
      <div class="pin-container">
        <svg width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.164 0 0 7.164 0 16c0 10 16 26 16 26s16-16 16-26c0-8.836-7.164-16-16-16z" fill="#E53935"/>
          <circle cx="16" cy="16" r="6" fill="#3E2723"/>
        </svg>
      </div>
    `,
    iconSize: [dimensions.width, dimensions.height],
    iconAnchor: [dimensions.anchor, dimensions.height],
    popupAnchor: [0, -dimensions.height],
  });
};

// マップの移動を制御するコンポーネント（複数ピン対応）
function MapController({ searchLocations }: { searchLocations: SearchLocation[] }) {
  const map = useMap();
  const prevLocationsRef = useRef<SearchLocation[]>([]);

  useEffect(() => {
    // 検索結果が変わった場合のみ処理
    if (searchLocations.length === 0) {
      prevLocationsRef.current = [];
      return;
    }

    // 同じ検索結果の場合はスキップ
    if (
      prevLocationsRef.current.length === searchLocations.length &&
      prevLocationsRef.current.every((loc, i) => 
        loc.lat === searchLocations[i].lat && loc.lng === searchLocations[i].lng
      )
    ) {
      return;
    }

    prevLocationsRef.current = searchLocations;

    if (searchLocations.length === 1) {
      // 1件の場合はその場所にズームイン
      const loc = searchLocations[0];
      map.flyTo([loc.lat, loc.lng], 14, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    } else {
      // 複数件の場合は全てのピンが見えるようにフィット
      const bounds = L.latLngBounds(
        searchLocations.map((loc) => [loc.lat, loc.lng] as [number, number])
      );
      map.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 1.5,
        maxZoom: 12,
      });
    }
  }, [searchLocations, map]);

  return null;
}

// スポットクリック時のマップ移動を制御
function SpotFlyController({ targetSpot }: { targetSpot: Spot | null }) {
  const map = useMap();
  const prevSpotRef = useRef<Spot | null>(null);

  useEffect(() => {
    if (targetSpot && prevSpotRef.current?.id !== targetSpot.id) {
      // 現在位置からの距離を計算
      const currentCenter = map.getCenter();
      const latDiff = Math.abs(targetSpot.lat - currentCenter.lat);
      const lngDiff = Math.abs(targetSpot.lng - currentCenter.lng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      // 距離に応じてアニメーション時間を計算（最小0.5秒、最大2.5秒）
      const duration = Math.min(2.5, Math.max(0.5, distance * 1));
      
      map.flyTo([targetSpot.lat, targetSpot.lng], 14, {
        duration: duration,
        easeLinearity: 0.25,
      });
      prevSpotRef.current = targetSpot;
    }
  }, [targetSpot, map]);

  return null;
}

// 検索結果をSpot型に変換
function searchLocationToSpot(location: SearchLocation, index: number): Spot {
  const nameParts = location.name.split(",");
  const shortName = nameParts[0].trim();
  const address = location.name;
  
  return {
    id: -1000 - index, // 負のIDで検索結果を区別
    name: shortName,
    lat: location.lat,
    lng: location.lng,
    description: "aaa",
    category: "検索結果",
    reviews: [],
    infos: [
      { type: "address", label: "住所", value: address },
    ],
  };
}

// 検索結果のマーカーコンポーネント（複数対応）
function SearchMarkers({ 
  locations, 
  onLocationClick 
}: { 
  locations: SearchLocation[];
  onLocationClick: (spot: Spot) => void;
}) {
  const [pinIcon, setPinIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    setPinIcon(createPinIcon("normal"));
  }, []);

  if (!pinIcon || locations.length === 0) return null;

  return (
    <>
      {locations.map((location, index) => (
        <Marker 
          key={`search-${index}-${location.lat}-${location.lng}`}
          position={[location.lat, location.lng]} 
          icon={pinIcon}
          eventHandlers={{
            click: () => onLocationClick(searchLocationToSpot(location, index)),
          }}
        />
      ))}
    </>
  );
}

// おすすめスポットのマーカーコンポーネント
function SpotMarkers({ 
  onSpotClick, 
  isVisible 
}: { 
  onSpotClick: (spot: Spot) => void;
  isVisible: boolean;
}) {
  const [spotIcon, setSpotIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    setSpotIcon(createPinIcon("normal"));
  }, []);

  if (!spotIcon || !isVisible) return null;

  return (
    <>
      {recommendedSpots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={spotIcon}
          eventHandlers={{
            click: () => onSpotClick(spot),
          }}
        />
      ))}
    </>
  );
}

interface MapViewProps {
  onSpotView?: (spot: { id: number; name: string; category: string }) => void;
}

export default function MapView({ onSpotView }: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [searchLocations, setSearchLocations] = useState<SearchLocation[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [targetSpot, setTargetSpot] = useState<Spot | null>(null);
  const mapKey = useRef(`map-${Date.now()}`);

  // クライアントサイドでのみマップを表示
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const handleLocationSearch = (result: SearchResult) => {
    setSearchLocations(result.locations);
  };

  const handleClearSearch = () => {
    setSearchLocations([]);
  };

  const handleSpotClick = (spot: Spot) => {
    // 現在位置からスポットまでの距離を計算
    const latDiff = Math.abs(spot.lat - HOKKAIDO_CENTER[0]);
    const lngDiff = Math.abs(spot.lng - HOKKAIDO_CENTER[1]);
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    // 距離に応じて遅延時間を計算（最小500ms、最大2500ms）
    const delay = Math.min(2500, Math.max(500, distance * 1000));
    
    // スポットの位置にマップを移動
    setTargetSpot({ ...spot });
    
    // アニメーション完了後に詳細シートを表示
    setTimeout(() => {
      setSelectedSpot({ ...spot });
      // 閲覧履歴に追加
      if (onSpotView && spot.id > 0) {
        onSpotView({ id: spot.id, name: spot.name, category: spot.category });
      }
    }, delay);
  };

  const handleCloseSheet = () => {
    setSelectedSpot(null);
  };

  // 検索結果のピンをクリックした時
  const handleSearchLocationClick = (spot: Spot) => {
    // 即座に詳細シートを表示（マップ移動なし）
    setSelectedSpot({ ...spot });
  };

  // 検索結果がある時はおすすめスポットを非表示
  const showSpotMarkers = searchLocations.length === 0;

  if (!isMounted) {
    return (
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 text-sm">マップを読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 検索バー */}
      <SearchBar 
        onLocationSearch={handleLocationSearch} 
        onClearSearch={handleClearSearch}
        isHidden={selectedSpot !== null}
        hasSearchResults={searchLocations.length > 0}
      />
      
      {/* マップ */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          key={mapKey.current}
          center={HOKKAIDO_CENTER}
          zoom={DEFAULT_ZOOM}
          zoomControl={false}
          className="w-full h-full"
          minZoom={6}
          maxZoom={16}
          // ズーム設定（速度重視）
          zoomSnap={0}
          zoomDelta={1}
          // アニメーションを無効
          zoomAnimation={false}
          fadeAnimation={false}
          markerZoomAnimation={false}
          // 慣性を強めに
          inertia={true}
          inertiaDeceleration={5000}
          inertiaMaxSpeed={3000}
          // 北海道の範囲に制限
          maxBounds={[
            [40.5, 138.0], // 南西
            [46.0, 146.5], // 北東
          ]}
          maxBoundsViscosity={1.0}
        >
          {/* シンプルなマップタイル（ラベル少なめ） */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
          />
          {/* 主要なラベルのみ表示 */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            maxZoom={12}
          />
          <ZoomControl position="bottomright" />
          <MapController searchLocations={searchLocations} />
          <SpotFlyController targetSpot={targetSpot} />
          <SpotMarkers onSpotClick={handleSpotClick} isVisible={showSpotMarkers} />
          <SearchMarkers locations={searchLocations} onLocationClick={handleSearchLocationClick} />
        </MapContainer>
      </div>

      {/* スポット詳細シート */}
      <SpotDetailSheet spot={selectedSpot} onClose={handleCloseSheet} />
    </>
  );
}
