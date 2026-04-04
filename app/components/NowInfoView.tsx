"use client";

import { useEffect, useMemo, useState } from "react";
import { getRecommendedMannerItemsByScenes, type MannerItem } from "../data/manners";
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

function NearbySpotCard({ location }: { location: SearchLocation }) {
  const photo = location.photos?.[0];

  return (
    <article
      style={{
        backgroundColor: "white",
        borderRadius: "20px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
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
            background: "linear-gradient(135deg, #fde68a, #f9a8d4)",
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
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
      }}
    >
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
                backgroundColor: "#ec4899",
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

export default function NowInfoView({
  locationPermissionState = "idle",
  locationError = "",
  currentPosition = null,
  currentAddress = null,
  isUsingMockLocation = false,
  onRequestLocationPermission,
  onOpenLocationSettings,
}: NowInfoViewProps) {
  const [nearbyLocations, setNearbyLocations] = useState<SearchLocation[]>([]);
  const [nearbyContext, setNearbyContext] = useState<NearbyContext | null>(null);
  const [nearbyError, setNearbyError] = useState("");
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  const coordinateKey = useMemo(() => {
    if (!currentPosition) return "";
    return makeLocationKey(currentPosition.latitude, currentPosition.longitude);
  }, [currentPosition]);

  useEffect(() => {
    if (!currentPosition || !coordinateKey) {
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
          `/api/google-places/nearby?lat=${encodeURIComponent(currentPosition.latitude)}&lng=${encodeURIComponent(currentPosition.longitude)}`
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
  }, [coordinateKey, currentPosition]);

  const recommendedItems = useMemo(
    () => getRecommendedMannerItemsByScenes(nearbyContext?.scenes || [], 3),
    [nearbyContext]
  );

  const hasLocation = Boolean(currentPosition);

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
          background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
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
            padding: "18px 16px",
            border: "1px solid #dbeafe",
            boxShadow: "0 2px 10px rgba(37,99,235,0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "16px", fontWeight: "800", color: "#1e3a8a" }}>現在地</p>
              <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.7", marginTop: "4px" }}>
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
                  border: "1px solid #93c5fd",
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
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

          {!hasLocation && (
            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.8" }}>
                位置情報を使うと、近くの施設に合わせたマナーと体験施設を表示できます。
              </p>
              {onOpenLocationSettings && (
                <button
                  onClick={onOpenLocationSettings}
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: "999px",
                    border: "1px solid #bfdbfe",
                    backgroundColor: "#f8fbff",
                    color: "#2563eb",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  マイページで位置情報を設定
                </button>
              )}
            </div>
          )}

          {!hasLocation && locationError && (
            <div
              style={{
                marginTop: "12px",
                borderRadius: "14px",
                backgroundColor: "#fff1f2",
                border: "1px solid #fecdd3",
                padding: "12px 14px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#991b1b", lineHeight: "1.7" }}>{locationError}</p>
            </div>
          )}
        </section>

        <section>
          <div style={{ marginBottom: "10px" }}>
            <p style={{ fontSize: "17px", fontWeight: "800", color: "#111827" }}>いま気を付けたいこと</p>
            {nearbyContext && (
              <>
                <p style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: "700", marginTop: "6px" }}>
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

        <section>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
            <div>
              <p style={{ fontSize: "17px", fontWeight: "800", color: "#111827" }}>近くの体験施設</p>
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
                backgroundColor: "#fff1f2",
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
      </div>
    </div>
  );
}
