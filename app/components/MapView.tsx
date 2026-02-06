"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SearchBar, { type SearchLocation } from "./SearchBar";
import SpotDetailSheet from "./SpotDetailSheet";
import { recommendedSpots, type Spot } from "../data/spots";

// 北海道の中心座標
const HOKKAIDO_CENTER: [number, number] = [43.0642, 141.3469];
const DEFAULT_ZOOM = 7;

// 赤いピンのカスタムアイコン（小さめサイズ）
const createPinIcon = () => {
  return L.divIcon({
    className: "custom-pin-icon",
    html: `
      <div class="pin-container">
        <svg width="22" height="30" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.164 0 0 7.164 0 16c0 10 16 26 16 26s16-16 16-26c0-8.836-7.164-16-16-16z" fill="#E53935"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [22, 30],
    iconAnchor: [11, 30],
    popupAnchor: [0, -30],
  });
};

// おすすめスポット用のピンアイコン
const createSpotPinIcon = () => {
  return L.divIcon({
    className: "custom-pin-icon spot-pin",
    html: `
      <div class="pin-container">
        <svg width="28" height="36" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.164 0 0 7.164 0 16c0 10 16 26 16 26s16-16 16-26c0-8.836-7.164-16-16-16z" fill="#E53935"/>
          <circle cx="16" cy="16" r="6" fill="#3E2723"/>
        </svg>
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
};

// マップの移動を制御するコンポーネント
function MapController({ targetLocation }: { targetLocation: SearchLocation | null }) {
  const map = useMap();
  const prevLocationRef = useRef<SearchLocation | null>(null);

  useEffect(() => {
    if (
      targetLocation &&
      (prevLocationRef.current?.lat !== targetLocation.lat ||
        prevLocationRef.current?.lng !== targetLocation.lng)
    ) {
      // 境界ボックスがある場合はそれに合わせてズーム
      if (targetLocation.boundingBox) {
        const [south, north, west, east] = targetLocation.boundingBox;
        map.flyToBounds(
          [
            [south, west],
            [north, east],
          ],
          {
            duration: 2,
            padding: [50, 50],
          }
        );
      } else {
        // スムーズにズームインしながら移動
        map.flyTo([targetLocation.lat, targetLocation.lng], targetLocation.zoom, {
          duration: 2,
          easeLinearity: 0.25,
        });
      }
      prevLocationRef.current = targetLocation;
    }
  }, [targetLocation, map]);

  return null;
}

// 検索結果のマーカーコンポーネント
function SearchMarker({ location }: { location: SearchLocation | null }) {
  const [pinIcon, setPinIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    setPinIcon(createPinIcon());
  }, []);

  if (!location || !pinIcon) return null;

  return (
    <Marker position={[location.lat, location.lng]} icon={pinIcon}>
      <Popup>
        <div className="text-sm font-medium text-gray-800">
          {location.name.split(",")[0]}
        </div>
      </Popup>
    </Marker>
  );
}

// おすすめスポットのマーカーコンポーネント
function SpotMarkers({ onSpotClick }: { onSpotClick: (spot: Spot) => void }) {
  const [spotIcon, setSpotIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    setSpotIcon(createSpotPinIcon());
  }, []);

  if (!spotIcon) return null;

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

export default function MapView() {
  const [isMounted, setIsMounted] = useState(false);
  const [targetLocation, setTargetLocation] = useState<SearchLocation | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const mapKey = useRef(`map-${Date.now()}`);

  // クライアントサイドでのみマップを表示
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  const handleLocationSearch = (location: SearchLocation) => {
    setTargetLocation(location);
  };

  const handleSpotClick = (spot: Spot) => {
    setSelectedSpot(spot);
  };

  const handleCloseSheet = () => {
    setSelectedSpot(null);
  };

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
      <SearchBar onLocationSearch={handleLocationSearch} isHidden={selectedSpot !== null} />
      
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
          // 滑らかなズーム設定
          zoomSnap={0.25}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={120}
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
          <MapController targetLocation={targetLocation} />
          <SpotMarkers onSpotClick={handleSpotClick} />
          <SearchMarker location={targetLocation} />
        </MapContainer>
      </div>

      {/* スポット詳細シート */}
      <SpotDetailSheet spot={selectedSpot} onClose={handleCloseSheet} />
    </>
  );
}
