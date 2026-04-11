"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getRecommendedMannerItemsByScenes, type MannerItem } from "../data/manners";
import { getRecommendedHelpfulTopicsByScenes, type HelpfulTabId } from "../data/helpfulInfo";
import { makeLocationKey } from "../lib/location";
import type { CurrentAddress, LocationPermissionState } from "../page";
import type { SearchLocation } from "./SearchBar";

interface NowInfoViewProps {
  locationPermissionState?: LocationPermissionState;
  locationError?: string;
  currentPosition?: { latitude: number; longitude: number } | null;
  currentAddress?: CurrentAddress | null;
  isUsingMockLocation?: boolean;
  onRequestLocationPermission?: () => void;
  onOpenLocationSettings?: () => void;
  onOpenHelpfulTab?: (tabId: HelpfulTabId) => void;
  onOpenExperienceBooking?: () => void;
}

type NearbyContext = {
  title: string;
  summary: string;
  scenes: string[];
  placeName?: string;
};

type NearbyResponse = {
  locations?: SearchLocation[];
  context?: NearbyContext;
  error?: string;
};

const NEARBY_MIN_REFETCH_INTERVAL_MS = 20_000;
const WALKING_REFETCH_DISTANCE_METERS = 150;
const CYCLING_REFETCH_DISTANCE_METERS = 500;
const VEHICLE_REFETCH_DISTANCE_METERS = 800;

function getDistanceMeters(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(toLatitude - fromLatitude);
  const dLng = toRadians(toLongitude - fromLongitude);
  const startLat = toRadians(fromLatitude);
  const endLat = toRadians(toLatitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(startLat) * Math.cos(endLat);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getRefetchDistanceBySpeed(speedMetersPerSecond: number) {
  if (speedMetersPerSecond < 2) return WALKING_REFETCH_DISTANCE_METERS;
  if (speedMetersPerSecond < 6) return CYCLING_REFETCH_DISTANCE_METERS;
  return VEHICLE_REFETCH_DISTANCE_METERS;
}

function QuickJumpButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        borderRadius: "18px",
        backgroundColor: "#fdf3f5",
        border: "1px solid #f3d1da",
        color: "#b85f74",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "14px",
        fontWeight: 700,
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: "16px" }}>&gt;</span>
    </button>
  );
}

function NearbySpotCard({ location }: { location: SearchLocation }) {
  const photo = location.photos?.[0];

  return (
    <article
      style={{
        backgroundColor: "white",
        borderRadius: "20px",
        border: "1px solid #f7dfe5",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(236,72,153,0.08)",
      }}
    >
      <div style={{ display: "flex", gap: "12px", padding: "12px" }}>
        <div
          style={{
            width: "92px",
            height: "92px",
            borderRadius: "16px",
            overflow: "hidden",
            flexShrink: 0,
            background: "linear-gradient(135deg, #f6d7b8, #f3b6c3)",
          }}
        >
          {photo ? (
            // Google Places photo URLs are resolved at runtime and are not preconfigured for next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={location.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "28px",
              }}
            >
              📍
            </div>
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: "15px", fontWeight: "800", color: "#111827", lineHeight: "1.4" }}>
            {location.name}
          </p>
          <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.6", marginTop: "4px" }}>
            {location.formattedAddress || "住所情報は準備中です。"}
          </p>
          <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.7", marginTop: "8px" }}>
            {location.summary || "現在地から立ち寄りやすい体験スポットです。"}
          </p>
        </div>
      </div>
    </article>
  );
}

function RecommendedMannerCard({ item }: { item: MannerItem }) {
  return (
    <article
      style={{
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "16px",
        border: "1px solid #f7dfe5",
        boxShadow: "0 2px 12px rgba(236,72,153,0.08)",
      }}
    >
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#e88fa3", marginBottom: "6px" }}>マナー</p>
      <p style={{ fontSize: "15px", fontWeight: "800", color: "#111827", lineHeight: "1.4" }}>
        {item.title}
      </p>
      <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.8", marginTop: "8px" }}>
        {item.shortDescription}
      </p>
      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {item.details.slice(0, 2).map((detail) => (
          <div key={detail} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "999px",
                backgroundColor: "#e88fa3",
                flexShrink: 0,
                marginTop: "5px",
              }}
            />
            <p style={{ fontSize: "12px", color: "#4b5563", lineHeight: "1.7" }}>{detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function HelpfulTopicCard({
  title,
  subtitle,
  description,
  emoji,
}: {
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
}) {
  return (
    <article
      style={{
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "16px",
        border: "1px solid #f7dfe5",
        boxShadow: "0 2px 12px rgba(236,72,153,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "14px",
            backgroundColor: "#fdf3f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          {emoji}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#e88fa3" }}>{subtitle}</p>
          <p style={{ fontSize: "15px", fontWeight: 800, color: "#111827", marginTop: "4px", lineHeight: "1.4" }}>
            {title}
          </p>
        </div>
      </div>
      <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.75", marginTop: "10px" }}>
        {description}
      </p>
    </article>
  );
}

export default function NowInfoView({
  locationPermissionState = "idle",
  locationError = "",
  currentPosition = null,
  currentAddress = null,
  isUsingMockLocation = false,
  onRequestLocationPermission,
  onOpenLocationSettings,
  onOpenHelpfulTab,
  onOpenExperienceBooking,
}: NowInfoViewProps) {
  const [nearbyLocations, setNearbyLocations] = useState<SearchLocation[]>([]);
  const [nearbyContext, setNearbyContext] = useState<NearbyContext | null>(null);
  const [nearbyError, setNearbyError] = useState("");
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyFetchPosition, setNearbyFetchPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const mannerSectionRef = useRef<HTMLElement | null>(null);
  const facilitySectionRef = useRef<HTMLElement | null>(null);
  const guideSectionRef = useRef<HTMLElement | null>(null);
  const lastNearbyFetchPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastNearbyFetchAtRef = useRef(0);
  const lastObservedPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastObservedAtRef = useRef(0);

  const coordinateKey = useMemo(() => {
    if (!currentPosition) return "";
    return makeLocationKey(currentPosition.latitude, currentPosition.longitude);
  }, [currentPosition]);

  const nearbyFetchKey = useMemo(() => {
    if (!nearbyFetchPosition) return "";
    return makeLocationKey(nearbyFetchPosition.latitude, nearbyFetchPosition.longitude);
  }, [nearbyFetchPosition]);

  useEffect(() => {
    if (!currentPosition || !coordinateKey) {
      lastNearbyFetchPositionRef.current = null;
      lastNearbyFetchAtRef.current = 0;
      lastObservedPositionRef.current = null;
      lastObservedAtRef.current = 0;
      setNearbyFetchPosition(null);
      return;
    }

    const now = Date.now();

    if (!lastObservedPositionRef.current) {
      lastObservedPositionRef.current = currentPosition;
      lastObservedAtRef.current = now;
    } else {
      const elapsedSeconds = Math.max((now - lastObservedAtRef.current) / 1000, 1);
      const movedDistanceSinceObservation = getDistanceMeters(
        lastObservedPositionRef.current.latitude,
        lastObservedPositionRef.current.longitude,
        currentPosition.latitude,
        currentPosition.longitude
      );
      const speedMetersPerSecond = movedDistanceSinceObservation / elapsedSeconds;
      const movedDistanceSinceFetch = lastNearbyFetchPositionRef.current
        ? getDistanceMeters(
            lastNearbyFetchPositionRef.current.latitude,
            lastNearbyFetchPositionRef.current.longitude,
            currentPosition.latitude,
            currentPosition.longitude
          )
        : Number.POSITIVE_INFINITY;
      const refetchDistance = getRefetchDistanceBySpeed(speedMetersPerSecond);
      const elapsedSinceLastFetch = now - lastNearbyFetchAtRef.current;

      lastObservedPositionRef.current = currentPosition;
      lastObservedAtRef.current = now;

      if (
        lastNearbyFetchPositionRef.current &&
        elapsedSinceLastFetch >= NEARBY_MIN_REFETCH_INTERVAL_MS &&
        movedDistanceSinceFetch >= refetchDistance
      ) {
        lastNearbyFetchPositionRef.current = currentPosition;
        lastNearbyFetchAtRef.current = now;
        setNearbyFetchPosition(currentPosition);
      }
    }

    if (!lastNearbyFetchPositionRef.current) {
      lastNearbyFetchPositionRef.current = currentPosition;
      lastNearbyFetchAtRef.current = now;
      setNearbyFetchPosition(currentPosition);
      return;
    }
  }, [coordinateKey, currentPosition]);

  useEffect(() => {
    if (!nearbyFetchPosition || !nearbyFetchKey) {
      setNearbyLocations([]);
      setNearbyContext(null);
      setNearbyError("");
      setIsLoadingNearby(false);
      return;
    }

    let isActive = true;

    const loadNearbyInfo = async () => {
      setIsLoadingNearby(true);
      setNearbyError("");

      try {
        const res = await fetch(
          `/api/google-places/nearby?lat=${encodeURIComponent(nearbyFetchPosition.latitude)}&lng=${encodeURIComponent(nearbyFetchPosition.longitude)}`
        );
        const data: NearbyResponse = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "nearby search failed");
        }

        if (!isActive) return;
        setNearbyLocations(data.locations || []);
        setNearbyContext(data.context || null);
      } catch (error) {
        console.error("nearby info fetch error:", error);
        if (!isActive) return;
        setNearbyLocations([]);
        setNearbyContext(null);
        setNearbyError("近くの施設情報を取得できませんでした。少し時間をおいて再度お試しください。");
      } finally {
        if (isActive) {
          setIsLoadingNearby(false);
        }
      }
    };

    void loadNearbyInfo();

    return () => {
      isActive = false;
    };
  }, [nearbyFetchKey, nearbyFetchPosition]);

  const recommendedItems = useMemo(
    () => getRecommendedMannerItemsByScenes(nearbyContext?.scenes || [], 3),
    [nearbyContext]
  );
  const recommendedGuideTopics = useMemo(
    () => getRecommendedHelpfulTopicsByScenes(nearbyContext?.scenes || [], 3),
    [nearbyContext]
  );

  const hasLocation = Boolean(currentPosition);
  const scrollToSection = (element: HTMLElement | null) => {
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const handleHelpfulJump = (tabId: HelpfulTabId, section: HTMLElement | null) => {
    if (!hasLocation && onOpenHelpfulTab) {
      onOpenHelpfulTab(tabId);
      return;
    }
    scrollToSection(section);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#f8fafc",
        overflowY: "auto",
        paddingBottom: "110px",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
          minHeight: "92px",
          padding: "0 20px",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 800, textAlign: "center" }}>なう情報</h1>
      </div>

      <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <section
          style={{
            backgroundColor: "white",
            borderRadius: "22px",
            padding: "16px 14px",
            border: hasLocation ? "1px solid #f7dfe5" : "1px solid #d1d5db",
            boxShadow: hasLocation ? "0 2px 10px rgba(236,72,153,0.08)" : "none",
          }}
        >
          {hasLocation ? (
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: "16px", fontWeight: "800", color: "#b85f74" }}>現在地</p>
                <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.7", marginTop: "4px" }}>
                  {isUsingMockLocation
                    ? "PC確認用の仮位置を使っています。"
                    : "現在地に合わせて、いま役立つ情報を表示します。"}
                </p>
              </div>

              {onRequestLocationPermission && (
                <button
                  onClick={onRequestLocationPermission}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid #f3b6c3",
                    backgroundColor: "#fdf3f5",
                    color: "#b85f74",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: "700",
                    flexShrink: 0,
                  }}
                >
                  {isUsingMockLocation ? "位置を更新" : "現在地を更新"}
                </button>
              )}
            </div>
          ) : locationPermissionState === "requesting" ? (
            <div>
              <p style={{ fontSize: "14px", fontWeight: "800", color: "#111827" }}>
                現在地を取得中です...
              </p>
              <p style={{ fontSize: "11px", color: "#6b7280", lineHeight: "1.7", marginTop: "6px" }}>
                geolocation API で現在地を確認しています。
                <br />
                取得できると緯度・経度を表示します。
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "14px", fontWeight: "800", color: "#111827" }}>
                現在地の取得が許可されていません
              </p>
              <p style={{ fontSize: "11px", color: "#6b7280", lineHeight: "1.7", marginTop: "6px" }}>
                位置情報を使うと、現在地に合わせて
                <br />
                今役立つスポット、体験施設を表示できます。
              </p>
            </div>
          )}

          {hasLocation && currentAddress && (
            <div style={{ marginTop: "14px" }}>
              <p style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>
                {currentAddress.prefecture}{currentAddress.city}{currentAddress.town}
              </p>
              <p style={{ fontSize: "12px", color: "#475569", marginTop: "4px", lineHeight: "1.7" }}>
                {currentAddress.formattedAddress}
              </p>
              <p style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
                緯度 {currentPosition?.latitude.toFixed(5)} / 経度 {currentPosition?.longitude.toFixed(5)}
              </p>
            </div>
          )}

          {!hasLocation && onOpenLocationSettings && (
            <div style={{ marginTop: "14px" }}>
              <button
                onClick={onOpenLocationSettings}
                style={{
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  border: "1px solid #f3b6c3",
                  backgroundColor: "#fdf3f5",
                  color: "#b85f74",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                マイページで位置情報を設定
              </button>
            </div>
          )}

          {!hasLocation && locationError && (
            <div
              style={{
                marginTop: "12px",
                borderRadius: "14px",
                backgroundColor: "#fdf3f5",
                border: "1px solid #fecdd3",
                padding: "12px 14px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#991b1b", lineHeight: "1.7" }}>{locationError}</p>
            </div>
          )}
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <QuickJumpButton label="マナーの情報を見に行く" onClick={() => handleHelpfulJump("manner", mannerSectionRef.current)} />
          <QuickJumpButton
            label="体験施設の情報を見に行く"
            onClick={() => {
              if (onOpenExperienceBooking) {
                onOpenExperienceBooking();
                return;
              }
              scrollToSection(facilitySectionRef.current);
            }}
          />
          <QuickJumpButton label="ガイド情報を見に行く" onClick={() => handleHelpfulJump("travel", guideSectionRef.current)} />
        </section>

        {hasLocation && (
          <>
            <section ref={mannerSectionRef}>
              <div style={{ marginBottom: "10px" }}>
                <p style={{ fontSize: "17px", fontWeight: "800", color: "#111827" }}>マナーの情報</p>
                {nearbyContext && (
                  <>
                    <p style={{ fontSize: "12px", color: "#e88fa3", fontWeight: "700", marginTop: "6px" }}>
                      {nearbyContext.title}
                    </p>
                    <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.8", marginTop: "4px" }}>
                      {nearbyContext.summary}
                    </p>
                  </>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recommendedItems.map((item) => (
                  <RecommendedMannerCard key={item.id} item={item} />
                ))}
              </div>
            </section>

            <section ref={facilitySectionRef}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <p style={{ fontSize: "17px", fontWeight: "800", color: "#111827" }}>体験施設の情報</p>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.7", marginTop: "4px" }}>
                    現在地の近くで立ち寄りやすい施設を最大5件表示します。
                  </p>
                </div>
              </div>

              {isLoadingNearby && (
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "20px",
                    border: "1px solid #e5e7eb",
                    padding: "18px 16px",
                  }}
                >
                  <p style={{ fontSize: "13px", color: "#64748b" }}>近くの施設を読み込み中です...</p>
                </div>
              )}

              {!isLoadingNearby && nearbyError && (
                <div
                  style={{
                backgroundColor: "#fdf3f5",
                    borderRadius: "18px",
                    border: "1px solid #fecdd3",
                    padding: "14px",
                  }}
                >
                  <p style={{ fontSize: "12px", color: "#991b1b", lineHeight: "1.7" }}>{nearbyError}</p>
                </div>
              )}

              {!isLoadingNearby && !nearbyError && nearbyLocations.length === 0 && (
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "20px",
                    border: "1px solid #e5e7eb",
                    padding: "18px 16px",
                  }}
                >
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.8" }}>
                    近くの体験施設がまだ見つかっていません。位置情報を更新すると結果が変わる場合があります。
                  </p>
                </div>
              )}

              {!isLoadingNearby && !nearbyError && nearbyLocations.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {nearbyLocations.map((location) => (
                    <NearbySpotCard key={`${location.placeId || location.name}-${location.lat}-${location.lng}`} location={location} />
                  ))}
                </div>
              )}
            </section>

            <section ref={guideSectionRef}>
              <div style={{ marginBottom: "10px" }}>
                <p style={{ fontSize: "17px", fontWeight: "800", color: "#111827" }}>ガイド情報</p>
                <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.7", marginTop: "4px" }}>
                  いまの場所に合わせて、知っておくと役立つ豆知識や旅のヒントをまとめています。
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recommendedGuideTopics.map((topic) => (
                  <HelpfulTopicCard
                    key={topic.id}
                    title={topic.title}
                    subtitle={topic.subtitle}
                    description={topic.description}
                    emoji={topic.emoji}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
