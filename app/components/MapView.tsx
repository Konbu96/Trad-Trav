"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap, Marker, Popup, Polyline, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SearchLocation } from "./SearchBar";
import SpotDetailSheet from "./SpotDetailSheet";
import { recommendedSpots, type Spot } from "../data/spots";
import { useLanguage } from "../i18n/LanguageContext";
import type { Translations } from "../i18n/translations";
import {
  estimateDrivingMinutesFromCrowMeters,
  formatStraightLineKm,
  getDistanceMeters,
} from "../lib/geoEstimate";

type SearchResultSpot = Spot & { placeId?: string };

// 宮城県の中心座標
const MIYAGI_CENTER: [number, number] = [38.45, 140.9];
const DEFAULT_ZOOM = 8;

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

// マップの移動を制御するコンポーネント（複数ピン対応・現在地＋1件のときは両方を収める）
function MapController({
  searchLocations,
  viewerPosition,
}: {
  searchLocations: SearchLocation[];
  viewerPosition?: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const prevSigRef = useRef("");

  useEffect(() => {
    if (searchLocations.length === 0) {
      prevSigRef.current = "";
      return;
    }

    const sig = JSON.stringify({
      locs: searchLocations.map((l) => [l.lat, l.lng]),
      v: viewerPosition ? [viewerPosition.lat, viewerPosition.lng] : null,
    });
    if (sig === prevSigRef.current) return;
    prevSigRef.current = sig;

    if (viewerPosition && searchLocations.length === 1) {
      const loc = searchLocations[0];
      const dM = getDistanceMeters(viewerPosition.lat, viewerPosition.lng, loc.lat, loc.lng);
      if (dM < 80) {
        map.flyTo([loc.lat, loc.lng], 16, { duration: 0.9, easeLinearity: 0.25 });
        return;
      }
      const bounds = L.latLngBounds(
        [viewerPosition.lat, viewerPosition.lng] as L.LatLngTuple,
        [loc.lat, loc.lng] as L.LatLngTuple
      );
      map.flyToBounds(bounds, {
        padding: [90, 90],
        maxZoom: 13,
        duration: 1.2,
      });
      return;
    }

    if (searchLocations.length === 1) {
      const loc = searchLocations[0];
      map.flyTo([loc.lat, loc.lng], 14, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
      return;
    }

    const bounds = L.latLngBounds(searchLocations.map((loc) => [loc.lat, loc.lng] as [number, number]));
    map.flyToBounds(bounds, {
      padding: [50, 50],
      duration: 1.5,
      maxZoom: 12,
    });
  }, [searchLocations, viewerPosition, map]);

  return null;
}

function ViewerToExperienceRoute({
  viewer,
  destination,
  t,
}: {
  viewer: { lat: number; lng: number };
  destination: SearchLocation;
  t: Translations;
}) {
  const meters = getDistanceMeters(viewer.lat, viewer.lng, destination.lat, destination.lng);
  const minutes = estimateDrivingMinutesFromCrowMeters(meters);
  const kmStr = formatStraightLineKm(meters);

  return (
    <>
      <CircleMarker
        center={[viewer.lat, viewer.lng]}
        radius={8}
        pathOptions={{
          color: "#1e40af",
          fillColor: "#3b82f6",
          fillOpacity: 0.92,
          weight: 2,
        }}
      >
        <Popup>
          <span style={{ fontSize: "13px" }}>{t.map.routeLegendYou}</span>
        </Popup>
      </CircleMarker>
      <Polyline
        positions={[
          [viewer.lat, viewer.lng],
          [destination.lat, destination.lng],
        ]}
        pathOptions={{
          color: "#e88fa3",
          weight: 4,
          opacity: 0.88,
          dashArray: "10 12",
        }}
      />
    </>
  );
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
function getCategoryLabel(category: string | undefined, type: string | undefined, t: Translations): string {
  const byCat = t.map.poiByCategory as Record<string, string>;
  const byType = t.map.poiByType as Record<string, string>;
  if (category && byCat[category]) return byCat[category];
  if (type && byType[type]) return byType[type];
  return t.map.poiDefault;
}

function buildAddress(loc: SearchLocation): string {
  if (loc.formattedAddress) {
    return loc.formattedAddress;
  }
  if (!loc.address) {
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

function searchLocationToSpot(location: SearchLocation, index: number, t: Translations): SearchResultSpot {
  const shortName = location.name.trim();
  const category = getCategoryLabel(location.category, location.type, t);
  const address = buildAddress(location);
  const ext = location.extratags || {};
  const phone = ext.phone || ext["contact:phone"];
  const website = ext.website || ext["contact:website"];
  const hours = ext.opening_hours;

  const infos: Spot["infos"] = [];
  if (hours) infos.push({ type: "hours", label: t.spot.hours, value: hours });
  infos.push({ type: "address", label: t.spot.address, value: address });
  if (phone) infos.push({ type: "phone", label: t.spot.phone, value: phone });
  if (website) infos.push({ type: "website", label: t.spot.website, value: website });

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
    photos: location.photos,
    placeId: location.placeId,
  };
}

// 検索結果のマーカーコンポーネント（複数対応）
function SearchMarkers({
  locations,
  onLocationClick,
  t,
}: {
  locations: SearchLocation[];
  onLocationClick: (spot: SearchResultSpot) => void;
  t: Translations;
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
            click: () => onLocationClick(searchLocationToSpot(location, index, t)),
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
  externalSearchLocations?: SearchLocation[] | null;
  /** 現在地が取れているとき、検索結果が1件の場合に体験スポットまでの線・距離を表示 */
  viewerPosition?: { lat: number; lng: number } | null;
}

const TUTORIAL_KEY = "trad-trav-map-tutorial-done";

// マップ内でピンのピクセル座標を計算して親に通知するだけのコンポーネント
function TutorialPositionUpdater({
  spot,
  onPositionChange,
}: {
  spot: Spot;
  onPositionChange: (pos: { x: number; y: number }) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const update = () => {
      const p = map.latLngToContainerPoint([spot.lat, spot.lng]);
      onPositionChange({ x: p.x, y: p.y });
    };
    update();
    map.on("move zoom resize", update);
    return () => { map.off("move zoom resize", update); };
  }, [map, spot, onPositionChange]);

  return null;
}

export default function MapView({
  onSpotView,
  jumpToSpotId,
  onJumpComplete,
  favoriteSpotIds = [],
  onToggleFavorite,
  recommendedSpotIds,
  externalSearchLocations,
  viewerPosition = null,
}: MapViewProps) {
  const { t, language } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  const [searchLocations, setSearchLocations] = useState<SearchLocation[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [targetSpot, setTargetSpot] = useState<Spot | null>(null);
  const [isFetchingSpotInfo, setIsFetchingSpotInfo] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialPos, setTutorialPos] = useState<{ x: number; y: number } | null>(null);
  const mapKey = useRef(`map-${Date.now()}`);

  // チュートリアル表示判定（初回のみ）
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(TUTORIAL_KEY)) {
      setShowTutorial(true);
    }
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    setTutorialPos(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(TUTORIAL_KEY, "1");
    }
  };

  const handleTutorialPosition = useCallback((pos: { x: number; y: number }) => {
    setTutorialPos(pos);
  }, []);

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

  useEffect(() => {
    if (!externalSearchLocations) return;
    setSearchLocations(externalSearchLocations);
  }, [externalSearchLocations]);

  const handleSpotClick = (spot: Spot) => {
    // チュートリアルが表示中なら閉じる
    if (showTutorial) handleCloseTutorial();
    // 現在位置からスポットまでの距離を計算
    const latDiff = Math.abs(spot.lat - MIYAGI_CENTER[0]);
    const lngDiff = Math.abs(spot.lng - MIYAGI_CENTER[1]);
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

  const fetchPlaceDetailById = useCallback(
    async (placeId: string) => {
      setIsFetchingSpotInfo(true);
      try {
        const res = await fetch(
          `/api/google-places/detail?placeId=${encodeURIComponent(placeId)}&lang=${encodeURIComponent(language)}`
        );
        if (!res.ok) return;
        const info = await res.json();
        const extraInfos: Spot["infos"] = [];
        if (info.hours) extraInfos.push({ type: "hours", label: t.spot.hours, value: info.hours });
        if (info.address) extraInfos.push({ type: "address", label: t.spot.address, value: info.address });
        if (info.phone) extraInfos.push({ type: "phone", label: t.spot.phone, value: info.phone });
        if (info.website) extraInfos.push({ type: "website", label: t.spot.website, value: info.website });
        if (info.mapsUrl) extraInfos.push({ type: "website", label: t.map.googleMaps, value: info.mapsUrl });

        setSelectedSpot((prev) =>
          prev && "placeId" in prev && prev.placeId === placeId
            ? {
                ...prev,
                name: info.name || prev.name,
                category: info.category ? getCategoryLabel(info.category, info.category, t) : prev.category,
                reviews: info.reviews?.length ? info.reviews : prev.reviews,
                photos: info.photos?.length ? info.photos : prev.photos,
                infos: [
                  ...prev.infos.filter(
                    (prevInfo) =>
                      !extraInfos.some(
                        (nextInfo) => nextInfo.type === prevInfo.type && nextInfo.label === prevInfo.label
                      )
                  ),
                  ...extraInfos,
                ],
              }
            : prev
        );
      } catch (err) {
        console.warn("Google Places 情報の取得に失敗:", err);
      } finally {
        setIsFetchingSpotInfo(false);
      }
    },
    [language, t]
  );

  useEffect(() => {
    const placeId =
      selectedSpot && "placeId" in selectedSpot && typeof selectedSpot.placeId === "string"
        ? selectedSpot.placeId
        : null;
    if (!placeId) return;
    void fetchPlaceDetailById(placeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 言語切替時のみ再取得（開いた直後はクリックハンドラで取得）
  }, [language]);

  // 検索結果のピンをクリックした時
  const handleSearchLocationClick = async (spot: SearchResultSpot) => {
    // まず既存情報で即座に詳細シートを表示
    setSelectedSpot({ ...spot });
    if (onSpotView) {
      onSpotView({ id: spot.id, name: spot.name, category: spot.category });
    }

    const placeId = spot.placeId;
    if (!placeId) {
      return;
    }

    await fetchPlaceDetailById(placeId);
  };

  // 検索結果がある時はおすすめスポットとハートピンを非表示
  const showSpotMarkers = searchLocations.length === 0;
  const showFavoriteMarkers = searchLocations.length === 0;

  const showViewerToSpotRoute = Boolean(viewerPosition && searchLocations.length === 1);
  const routeDestination = showViewerToSpotRoute ? searchLocations[0] : null;
  const routeMeters =
    viewerPosition && routeDestination
      ? getDistanceMeters(
          viewerPosition.lat,
          viewerPosition.lng,
          routeDestination.lat,
          routeDestination.lng
        )
      : null;
  const routeMinutes =
    routeMeters != null ? estimateDrivingMinutesFromCrowMeters(routeMeters) : null;
  const routeKmStr = routeMeters != null ? formatStraightLineKm(routeMeters) : null;

  if (!isMounted) {
    return (
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 text-sm">{t.map.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="trad-trav-map-root absolute inset-0 z-0">
        <MapContainer
          key={mapKey.current}
          center={MIYAGI_CENTER}
          zoom={DEFAULT_ZOOM}
          zoomControl={false}
          className="w-full h-full"
          minZoom={7}
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
          // 宮城県の範囲に制限
          maxBounds={[
            [37.75, 140.45], // 南西
            [39.05, 141.95], // 北東
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
          <MapController searchLocations={searchLocations} viewerPosition={viewerPosition} />
          {showViewerToSpotRoute && viewerPosition && routeDestination ? (
            <ViewerToExperienceRoute viewer={viewerPosition} destination={routeDestination} t={t} />
          ) : null}
          <SpotFlyController targetSpot={targetSpot} />
          <SpotMarkers onSpotClick={handleSpotClick} isVisible={showSpotMarkers} filterIds={recommendedSpotIds} />
          <FavoriteMarkers favoriteSpotIds={favoriteSpotIds} onSpotClick={handleSpotClick} isVisible={showFavoriteMarkers} />
          <SearchMarkers locations={searchLocations} onLocationClick={handleSearchLocationClick} t={t} />
          {/* チュートリアル：マップ内ではピンのピクセル座標計算のみ行う */}
          {(() => {
            if (!showTutorial || searchLocations.length > 0) return null;
            const ids = recommendedSpotIds && recommendedSpotIds.length > 0 ? recommendedSpotIds : null;
            const candidates = ids
              ? recommendedSpots.filter(s => ids.includes(s.id))
              : recommendedSpots;
            if (candidates.length === 0) return null;
            const withVideo = candidates.filter(s => s.videos && s.videos.length > 0);
            const pool = withVideo.length > 0 ? withVideo : candidates;
            const tutorialSpot = pool.reduce((best, s) => {
              const dBest = Math.hypot(best.lat - MIYAGI_CENTER[0], best.lng - MIYAGI_CENTER[1]);
              const dS    = Math.hypot(s.lat    - MIYAGI_CENTER[0], s.lng    - MIYAGI_CENTER[1]);
              return dS < dBest ? s : best;
            });
            return <TutorialPositionUpdater spot={tutorialSpot} onPositionChange={handleTutorialPosition} />;
          })()}
        </MapContainer>
        {showViewerToSpotRoute &&
        viewerPosition &&
        routeDestination &&
        routeKmStr != null &&
        routeMinutes != null ? (
          <div
            className="pointer-events-none"
            style={{
              position: "absolute",
              left: 10,
              right: 10,
              top: 10,
              zIndex: 700,
            }}
          >
            <div
              className="pointer-events-auto"
              style={{
                marginLeft: "auto",
                marginRight: "auto",
                maxWidth: "340px",
                backgroundColor: "rgba(255,255,255,0.96)",
                borderRadius: "16px",
                padding: "12px 14px",
                border: "1px solid #f7dfe5",
                boxShadow: "0 4px 18px rgba(15,23,42,0.12)",
              }}
            >
              <p style={{ fontSize: "12px", fontWeight: 800, color: "#b85f74", margin: "0 0 6px", lineHeight: 1.35 }}>
                {t.map.routeFromYouTitle}
              </p>
              <p style={{ fontSize: "13px", color: "#111827", margin: "0 0 4px", fontWeight: 700 }}>
                {routeDestination.name}
              </p>
              <p style={{ fontSize: "12px", color: "#374151", margin: 0, lineHeight: 1.55 }}>
                {t.map.routeStraightKm.replace("{km}", routeKmStr)}
                <br />
                {t.map.routeCarMinutes.replace("{minutes}", String(routeMinutes))}
              </p>
              <p style={{ fontSize: "10px", color: "#9ca3af", margin: "8px 0 0", lineHeight: 1.45 }}>
                {t.map.routeAccessNote}
              </p>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "10px", color: "#6b7280", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "999px",
                      backgroundColor: "#3b82f6",
                      border: "2px solid #1e40af",
                      flexShrink: 0,
                    }}
                  />
                  {t.map.routeLegendYou}
                </span>
                <span style={{ fontSize: "10px", color: "#6b7280", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "2px",
                      background: "repeating-linear-gradient(90deg, #e88fa3 0 3px, transparent 3px 6px)",
                      flexShrink: 0,
                    }}
                  />
                  {t.map.routeLegendSpot}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* チュートリアル吹き出し（マップ外オーバーレイ） */}
      {showTutorial && tutorialPos && searchLocations.length === 0 && (
        <div
          style={{
            position: "absolute",
            left: tutorialPos.x - 110,
            top: tutorialPos.y - 115,
            width: 220,
            zIndex: 500,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "12px 14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
              border: "1.5px solid #f7dfe5",
              position: "relative",
            }}
          >
            <button
              onClick={handleCloseTutorial}
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
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#e88fa3", margin: "0 0 4px" }}>
              {t.spotDetail.mapTutorialTitle}
            </p>
            <p style={{ fontSize: "12px", color: "#6b7280", margin: 0, lineHeight: 1.4 }}>
              {t.spotDetail.mapTutorialBody}
            </p>
          </div>
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
        </div>
      )}

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
