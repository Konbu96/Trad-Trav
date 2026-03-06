"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, ZoomControl, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SearchBar, { type SearchLocation, type SearchResult } from "./SearchBar";
import SpotDetailSheet from "./SpotDetailSheet";
import { recommendedSpots, type Spot } from "../data/spots";

// 北海道の中心座標
const HOKKAIDO_CENTER: [number, number] = [43.0642, 141.3469];
const DEFAULT_ZOOM = 7;

// ハートピンアイコン（お気に入り）
const createHeartPinIcon = () => {
  return L.divIcon({
    className: "custom-heart-pin-icon",
    html: `
      <div style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <svg width="36" height="42" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 38 C18 38 2 24 2 14 C2 7.373 7.373 2 14 2 C16.28 2 18.41 2.66 20.2 3.8 C21.99 2.66 24.12 2 26.4 2 C33.027 2 38 7.373 38 14 C38 24 22 38 18 38Z" fill="none" stroke="none"/>
          <ellipse cx="18" cy="40" rx="4" ry="2" fill="rgba(0,0,0,0.15)"/>
          <path d="M18 36 L6 22 C3 18 3 12 7 9 C10 7 14 8 16 10 L18 12 L20 10 C22 8 26 7 29 9 C33 12 33 18 30 22 Z" fill="#ef4444"/>
          <path d="M18 34 L7 21 C4.5 17.5 4.5 12.5 8 9.5 C10.5 7.5 14 8.5 15.5 10 L18 12.5 L20.5 10 C22 8.5 25.5 7.5 28 9.5 C31.5 12.5 31.5 17.5 29 21 Z" fill="#f87171"/>
        </svg>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
    popupAnchor: [0, -40],
  });
};

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
// カテゴリを日本語ラベルに変換
function getCategoryLabel(category?: string, type?: string): string {
  const map: Record<string, string> = {
    tourism: "観光",
    amenity: "施設",
    historic: "歴史・文化財",
    natural: "自然",
    leisure: "レジャー",
    shop: "ショップ",
    religion: "宗教施設",
    highway: "道路",
    building: "建物",
    place: "場所",
  };
  if (category && map[category]) return map[category];
  if (type) {
    const typeMap: Record<string, string> = {
      shrine: "神社",
      temple: "寺院",
      museum: "博物館・美術館",
      attraction: "観光スポット",
      viewpoint: "展望スポット",
      park: "公園",
      castle: "城",
      ruins: "遺跡",
      artwork: "アート",
      hotel: "宿泊施設",
      restaurant: "飲食店",
      cafe: "カフェ",
      fast_food: "ファストフード",
      hot_spring: "温泉",
    };
    if (typeMap[type]) return typeMap[type];
  }
  return "検索結果";
}

function buildAddress(loc: SearchLocation): string {
  if (!loc.address) {
    // display_nameをそのまま使う
    return loc.name;
  }
  const a = loc.address;
  const parts = [
    a.postcode ? `〒${a.postcode}` : null,
    a.state,
    a.county,
    a.city || a.town || a.village,
    a.suburb || a.neighbourhood,
    a.road,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : loc.name;
}

function searchLocationToSpot(location: SearchLocation, index: number): Spot {
  const nameParts = location.name.split(",");
  const shortName = nameParts[0].trim();
  const category = getCategoryLabel(location.category, location.type);
  const address = buildAddress(location);
  const ext = location.extratags || {};
  const phone = ext.phone || ext["contact:phone"];
  const website = ext.website || ext["contact:website"];
  const hours = ext.opening_hours;

  const infos: Spot["infos"] = [];
  if (hours) infos.push({ type: "hours", label: "営業時間", value: hours });
  infos.push({ type: "address", label: "住所", value: address });
  if (phone) infos.push({ type: "phone", label: "電話番号", value: phone });
  if (website) infos.push({ type: "website", label: "Webサイト", value: website });

  return {
    id: -1000 - index,
    name: shortName,
    lat: location.lat,
    lng: location.lng,
    description: location.type
      ? `${category}（${location.type}）`
      : category,
    category,
    reviews: [],
    infos,
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
  isVisible,
  filterIds,
}: { 
  onSpotClick: (spot: Spot) => void;
  isVisible: boolean;
  filterIds?: number[] | null;
}) {
  const [spotIcon, setSpotIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    setSpotIcon(createPinIcon("normal"));
  }, []);

  if (!spotIcon || !isVisible) return null;

  const spotsToShow = filterIds ? recommendedSpots.filter(s => filterIds.includes(s.id)) : recommendedSpots;

  return (
    <>
      {spotsToShow.map((spot) => (
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

// お気に入りスポットのマーカー
function FavoriteMarkers({
  favoriteSpotIds,
  onSpotClick,
  isVisible,
}: {
  favoriteSpotIds: number[];
  onSpotClick: (spot: Spot) => void;
  isVisible: boolean;
}) {
  const [heartIcon, setHeartIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    setHeartIcon(createHeartPinIcon());
  }, []);

  if (!heartIcon || !isVisible) return null;

  const favoriteSpots = recommendedSpots.filter(s => favoriteSpotIds.includes(s.id));

  return (
    <>
      {favoriteSpots.map(spot => (
        <Marker
          key={`fav-${spot.id}`}
          position={[spot.lat, spot.lng]}
          icon={heartIcon}
          eventHandlers={{ click: () => onSpotClick(spot) }}
        />
      ))}
    </>
  );
}

interface MapViewProps {
  onSpotView?: (spot: { id: number; name: string; category: string }) => void;
  jumpToSpotId?: number | null;
  onJumpComplete?: () => void;
  favoriteSpotIds?: number[];
  onToggleFavorite?: (spotId: number) => void;
  recommendedSpotIds?: number[] | null;
}

const TUTORIAL_KEY = "trad-trav-map-tutorial-done";

// マップのlatLngをピクセル座標に変換してポータルで描画するコンポーネント
function TutorialTooltip({
  spot,
  onClose,
}: {
  spot: Spot;
  onClose: () => void;
}) {
  const map = useMap();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const p = map.latLngToContainerPoint([spot.lat, spot.lng]);
      setPos({ x: p.x, y: p.y });
    };
    update();
    map.on("move zoom resize", update);
    return () => { map.off("move zoom resize", update); };
  }, [map, spot]);

  if (!pos) return null;

  const W = 220;

  // map.getContainer() はマップの div 要素（position:relative）
  // createPortal でその直接の子として描画することで absolute 座標が正しく機能する
  return createPortal(
    <div
      style={{
        position: "absolute",
        left: pos.x - W / 2,
        top: pos.y - 110, // ピンアイコンの上
        width: W,
        zIndex: 1000,
        pointerEvents: "auto",
      }}
    >
      {/* 吹き出し本体 */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "12px 14px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
          border: "1.5px solid #fce7f3",
          position: "relative",
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9ca3af",
            fontSize: "14px",
            lineHeight: 1,
            padding: "2px 4px",
          }}
        >
          ✕
        </button>
        <p style={{ fontSize: "13px", fontWeight: "600", color: "#ec4899", margin: "0 0 4px" }}>
          👆 ここをタップ！
        </p>
        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0, lineHeight: 1.4 }}>
          スポットの詳細・営業時間が確認できます
        </p>
      </div>
      {/* 矢印 */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "10px solid white",
          margin: "0 auto",
          filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.1))",
        }}
      />
    </div>,
    map.getContainer()
  );
}

export default function MapView({ onSpotView, jumpToSpotId, onJumpComplete, favoriteSpotIds = [], onToggleFavorite, recommendedSpotIds }: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [searchLocations, setSearchLocations] = useState<SearchLocation[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [targetSpot, setTargetSpot] = useState<Spot | null>(null);
  const [isFetchingSpotInfo, setIsFetchingSpotInfo] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const mapKey = useRef(`map-${Date.now()}`);

  // チュートリアル表示判定（初回のみ）
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(TUTORIAL_KEY)) {
      setShowTutorial(true);
    }
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(TUTORIAL_KEY, "1");
    }
  };

  // クライアントサイドでのみマップを表示
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // 閲覧履歴からのジャンプ
  useEffect(() => {
    if (!jumpToSpotId || !isMounted) return;

    const spot = recommendedSpots.find(s => s.id === jumpToSpotId);
    if (spot) {
      setTargetSpot({ ...spot });
      setTimeout(() => {
        setSelectedSpot({ ...spot });
      }, 1200);
    }
    onJumpComplete?.();
  }, [jumpToSpotId, isMounted]);

  const handleLocationSearch = (result: SearchResult) => {
    setSearchLocations(result.locations);
  };

  const handleClearSearch = () => {
    setSearchLocations([]);
  };

  const handleSpotClick = (spot: Spot) => {
    // チュートリアルが表示中なら閉じる
    if (showTutorial) handleCloseTutorial();
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
      if (onSpotView) {
        onSpotView({ id: spot.id, name: spot.name, category: spot.category });
      }
    }, delay);
  };

  const handleCloseSheet = () => {
    setSelectedSpot(null);
  };

  // 検索結果のピンをクリックした時
  const handleSearchLocationClick = async (spot: Spot) => {
    // まず既存情報で即座に詳細シートを表示
    setSelectedSpot({ ...spot });
    if (onSpotView) {
      onSpotView({ id: spot.id, name: spot.name, category: spot.category });
    }

    // HOKKAIDO LOVE! から追加情報を非同期で取得
    setIsFetchingSpotInfo(true);
    try {
      const res = await fetch(`/api/spot-info?name=${encodeURIComponent(spot.name)}`);
      if (res.ok) {
        const info = await res.json();
        const extraInfos: Spot["infos"] = [];
        if (info.hours)       extraInfos.push({ type: "hours",      label: "営業時間", value: info.hours });
        if (info.address)     extraInfos.push({ type: "address",    label: "住所",     value: info.address });
        if (info.phone)       extraInfos.push({ type: "phone",      label: "電話番号", value: info.phone });
        if (info.closedDays)  extraInfos.push({ type: "closedDays", label: "休業日",   value: info.closedDays });
        if (info.price)       extraInfos.push({ type: "price",      label: "料金",     value: info.price });
        if (info.parking)     extraInfos.push({ type: "parking",    label: "駐車場",   value: info.parking });
        if (info.access)      extraInfos.push({ type: "access",     label: "アクセス", value: info.access });
        if (info.website)     extraInfos.push({ type: "website",    label: "公式サイト", value: info.website });
        if (info.sourceUrl)   extraInfos.push({ type: "website",    label: "HOKKAIDO LOVE!", value: info.sourceUrl });

        if (extraInfos.length > 0) {
          setSelectedSpot(prev => prev ? {
            ...prev,
            // 名前はAPIから取得したものが信頼できる場合のみ上書き
            name: (info.name && !info.name.includes("HOKKAIDO LOVE")) ? info.name : prev.name,
            infos: extraInfos,
          } : prev);
        }
      }
    } catch (err) {
      console.warn("HOKKAIDO LOVE! 情報の取得に失敗:", err);
    } finally {
      setIsFetchingSpotInfo(false);
    }
  };

  // 検索結果がある時はおすすめスポットとハートピンを非表示
  const showSpotMarkers = searchLocations.length === 0;
  const showFavoriteMarkers = searchLocations.length === 0;

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
          <SpotMarkers onSpotClick={handleSpotClick} isVisible={showSpotMarkers} filterIds={recommendedSpotIds} />
          <FavoriteMarkers favoriteSpotIds={favoriteSpotIds} onSpotClick={handleSpotClick} isVisible={showFavoriteMarkers} />
          <SearchMarkers locations={searchLocations} onLocationClick={handleSearchLocationClick} />
          {(() => {
            if (!showTutorial || searchLocations.length > 0) return null;
            const ids = recommendedSpotIds && recommendedSpotIds.length > 0 ? recommendedSpotIds : null;
            const candidates = ids
              ? recommendedSpots.filter(s => ids.includes(s.id))
              : recommendedSpots;
            if (candidates.length === 0) return null;
            // 動画付きスポットを優先してチュートリアル対象に選ぶ（なければ中心に最も近いスポット）
            const withVideo = candidates.filter(s => s.videos && s.videos.length > 0);
            const pool = withVideo.length > 0 ? withVideo : candidates;
            const tutorialSpot = pool.reduce((best, s) => {
              const dBest = Math.hypot(best.lat - HOKKAIDO_CENTER[0], best.lng - HOKKAIDO_CENTER[1]);
              const dS    = Math.hypot(s.lat    - HOKKAIDO_CENTER[0], s.lng    - HOKKAIDO_CENTER[1]);
              return dS < dBest ? s : best;
            });
            return <TutorialTooltip spot={tutorialSpot} onClose={handleCloseTutorial} />;
          })()}
        </MapContainer>
      </div>

      {/* スポット詳細シート */}
      <SpotDetailSheet
        spot={selectedSpot}
        onClose={handleCloseSheet}
        isFavorite={selectedSpot ? favoriteSpotIds.includes(selectedSpot.id) : false}
        onToggleFavorite={onToggleFavorite}
        isLoadingInfo={isFetchingSpotInfo}
      />
    </>
  );
}
