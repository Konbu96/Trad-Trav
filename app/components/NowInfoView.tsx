"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TraditionalGenreId } from "../data/traditionalGenres";
import { getRecommendedMannerItemsByScenes, type MannerItem } from "../data/manners";
import { getRecommendedHelpfulTopicsByScenes } from "../data/helpfulInfo";
import { useLanguage } from "../i18n/LanguageContext";
import type { Translations } from "../i18n/translations";
import { estimateDrivingMinutesFromCrowMeters, getDistanceMeters } from "../lib/geoEstimate";
import { makeLocationKey } from "../lib/location";
import type { CurrentAddress, LocationPermissionState } from "../page";
import type { SearchLocation } from "./SearchBar";
import { locationIssueMessage } from "../lib/locationIssue";
import type { LocationIssueCode } from "../lib/locationIssue";
import { getLocalizedMannerItem, getLocalizedTopic } from "../lib/localizeHelpfulLibrary";
import { resolveNearbyMannerIntro, type NearbyContextPayload } from "../lib/nearbyContextCopy";

interface NowInfoViewProps {
  locationPermissionState?: LocationPermissionState;
  locationIssueCode?: LocationIssueCode;
  currentPosition?: { latitude: number; longitude: number } | null;
  currentAddress?: CurrentAddress | null;
  isUsingMockLocation?: boolean;
  onRequestLocationPermission?: () => void;
  onOpenLocationSettings?: () => void;
  onTutorialAction?: (actionId: string) => void;
  /** 開発時のみ: 宮城県栗原市の固定座標を現在地として適用 */
  onUseDeveloperKuriharaLocation?: () => void;
}

type NearbyResponse = {
  locations?: SearchLocation[];
  context?: NearbyContextPayload;
  error?: string;
};

const NEARBY_MIN_REFETCH_INTERVAL_MS = 20_000;
const WALKING_REFETCH_DISTANCE_METERS = 150;
const CYCLING_REFETCH_DISTANCE_METERS = 500;
const VEHICLE_REFETCH_DISTANCE_METERS = 800;

function traditionalGenreLabel(genre: TraditionalGenreId | undefined, t: Translations): string | null {
  if (!genre) return null;
  const labels: Record<TraditionalGenreId, string> = {
    performing: t.nowInfo.traditionalGenrePerforming,
    festival: t.nowInfo.traditionalGenreFestival,
    craft: t.nowInfo.traditionalGenreCraft,
    history: t.nowInfo.traditionalGenreHistory,
  };
  return labels[genre] ?? null;
}

function getRefetchDistanceBySpeed(speedMetersPerSecond: number) {
  if (speedMetersPerSecond < 2) return WALKING_REFETCH_DISTANCE_METERS;
  if (speedMetersPerSecond < 6) return CYCLING_REFETCH_DISTANCE_METERS;
  return VEHICLE_REFETCH_DISTANCE_METERS;
}

function NearbySpotCard({
  location,
  origin,
  t,
}: {
  location: SearchLocation;
  origin: { latitude: number; longitude: number } | null;
  t: Translations;
}) {
  const photo = location.photos?.[0];
  const meters =
    origin != null
      ? getDistanceMeters(origin.latitude, origin.longitude, location.lat, location.lng)
      : null;
  const minutes = meters != null ? estimateDrivingMinutesFromCrowMeters(meters) : null;
  const genreLabel = traditionalGenreLabel(location.traditionalGenre, t);

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
          {genreLabel ? (
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#b85f74", marginBottom: "4px", lineHeight: 1.4 }}>
              {genreLabel}
            </p>
          ) : null}
          <p style={{ fontSize: "15px", fontWeight: "800", color: "#111827", lineHeight: "1.4" }}>
            {location.name}
          </p>
          {minutes != null ? (
            <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.6, marginTop: "6px" }}>
              {t.nowInfo.nearbyFacilityCarMinutes.replace("{minutes}", String(minutes))}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function RecommendedMannerCard({
  item,
  mannerBadge,
  t,
}: {
  item: MannerItem;
  mannerBadge: string;
  t: Translations;
}) {
  const loc = getLocalizedMannerItem(item.id, t);
  const title = loc?.title ?? item.title;
  const shortDescription = loc?.shortDescription ?? item.shortDescription;
  const details = loc?.details ?? item.details;
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
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#b85f74", marginBottom: "6px" }}>{mannerBadge}</p>
      <p style={{ fontSize: "15px", fontWeight: "800", color: "#111827", lineHeight: "1.4" }}>{title}</p>
      <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.8", marginTop: "8px" }}>{shortDescription}</p>
      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {details.slice(0, 2).map((detail, index) => (
          <div key={`${item.id}-${index}`} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
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
            <p style={{ fontSize: "12px", color: "#374151", lineHeight: "1.7" }}>{detail}</p>
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
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#b85f74" }}>{subtitle}</p>
          <p style={{ fontSize: "15px", fontWeight: 800, color: "#111827", marginTop: "4px", lineHeight: "1.4" }}>
            {title}
          </p>
        </div>
      </div>
      <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.75", marginTop: "10px" }}>
        {description}
      </p>
    </article>
  );
}

export default function NowInfoView({
  locationPermissionState = "idle",
  locationIssueCode = "",
  currentPosition = null,
  currentAddress = null,
  isUsingMockLocation = false,
  onRequestLocationPermission,
  onOpenLocationSettings,
  onTutorialAction,
  onUseDeveloperKuriharaLocation,
}: NowInfoViewProps) {
  const { t, language } = useLanguage();
  const [nearbyLocations, setNearbyLocations] = useState<SearchLocation[]>([]);
  const [nearbyContext, setNearbyContext] = useState<NearbyContextPayload | null>(null);
  const [nearbyError, setNearbyError] = useState("");
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyFetchPosition, setNearbyFetchPosition] = useState<{ latitude: number; longitude: number } | null>(null);
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
          `/api/google-places/nearby?lat=${encodeURIComponent(nearbyFetchPosition.latitude)}&lng=${encodeURIComponent(nearbyFetchPosition.longitude)}&lang=${encodeURIComponent(language)}`
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
        setNearbyError(t.nowInfo.nearbyFetchFailed);
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
  }, [nearbyFetchKey, nearbyFetchPosition, language, t.nowInfo.nearbyFetchFailed]);

  const recommendedItems = useMemo(
    () => getRecommendedMannerItemsByScenes(nearbyContext?.scenes || [], 3),
    [nearbyContext]
  );
  const recommendedGuideTopics = useMemo(
    () => getRecommendedHelpfulTopicsByScenes(nearbyContext?.scenes || [], 3),
    [nearbyContext]
  );

  const nearbyMannerLines = useMemo(() => {
    if (!nearbyContext) return null;
    return resolveNearbyMannerIntro(nearbyContext.kind, nearbyContext.placeName, t);
  }, [nearbyContext, t]);

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
          background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
          minHeight: "92px",
          padding: "0 20px",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 800, textAlign: "center" }}>{t.nowInfo.pageTitle}</h1>
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
                <p style={{ fontSize: "16px", fontWeight: "800", color: "#b85f74" }}>{t.nowInfo.currentLocationTitle}</p>
                <p style={{ fontSize: "12px", color: "#374151", lineHeight: "1.7", marginTop: "4px" }}>
                  {isUsingMockLocation ? t.nowInfo.locationMockHint : t.nowInfo.locationLiveHint}
                </p>
              </div>

              {onRequestLocationPermission && (
                <button
                  onClick={() => {
                    onTutorialAction?.("now.location-update-button");
                    onRequestLocationPermission();
                  }}
                  data-tutorial-id="now.location-update-button"
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
                  {isUsingMockLocation ? t.nowInfo.refreshPosition : t.nowInfo.refreshCurrentLocation}
                </button>
              )}
            </div>
          ) : locationPermissionState === "requesting" ? (
            <div>
              <p style={{ fontSize: "14px", fontWeight: "800", color: "#111827" }}>
                {t.nowInfo.locationRequestingTitle}
              </p>
              <ul
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  paddingLeft: "1.25rem",
                  listStyleType: "disc",
                  listStylePosition: "outside",
                  fontSize: "12px",
                  color: "#374151",
                  lineHeight: 1.75,
                }}
              >
                <li style={{ marginBottom: "6px", display: "list-item" }}>{t.nowInfo.locationRequestingPoint1}</li>
                <li style={{ display: "list-item" }}>{t.nowInfo.locationRequestingPoint2}</li>
              </ul>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "14px", fontWeight: "800", color: "#111827" }}>
                {t.nowInfo.locationDeniedTitle}
              </p>
              <p style={{ fontSize: "12px", color: "#374151", lineHeight: "1.75", marginTop: "8px" }}>
                {t.nowInfo.locationDeniedLead}
              </p>
              <ul
                style={{
                  marginTop: "10px",
                  marginBottom: 0,
                  paddingLeft: "1.25rem",
                  listStyleType: "disc",
                  listStylePosition: "outside",
                  fontSize: "12px",
                  color: "#374151",
                  lineHeight: 1.75,
                }}
              >
                <li style={{ marginBottom: "6px", display: "list-item" }}>{t.nowInfo.locationDeniedBenefit1}</li>
                <li style={{ marginBottom: "6px", display: "list-item" }}>{t.nowInfo.locationDeniedBenefit2}</li>
                <li style={{ display: "list-item" }}>{t.nowInfo.locationDeniedBenefit3}</li>
              </ul>
            </div>
          )}

          {hasLocation && currentAddress && (
            <div style={{ marginTop: "14px" }}>
              <p style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>
                {currentAddress.prefecture}{currentAddress.city}{currentAddress.town}
              </p>
              <p style={{ fontSize: "12px", color: "#374151", marginTop: "4px", lineHeight: "1.7" }}>
                {currentAddress.formattedAddress}
              </p>
              <p style={{ fontSize: "11px", color: "#374151", marginTop: "6px" }}>
                {t.common.latLng
                  .replace("{lat}", String(currentPosition?.latitude.toFixed(5)))
                  .replace("{lng}", String(currentPosition?.longitude.toFixed(5)))}
              </p>
            </div>
          )}

          {!hasLocation && onOpenLocationSettings && (
            <div style={{ marginTop: "14px" }}>
              <button
                onClick={() => {
                  onTutorialAction?.("now.location-settings-button");
                  onOpenLocationSettings();
                }}
                data-tutorial-id="now.location-settings-button"
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
                {t.nowInfo.openLocationSettingsButton}
              </button>
            </div>
          )}

          {!hasLocation && locationIssueCode && (
            <div
              style={{
                marginTop: "12px",
                borderRadius: "14px",
                backgroundColor: "#fdf3f5",
                border: "1px solid #fecdd3",
                padding: "12px 14px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#991b1b", lineHeight: "1.7" }}>
                {locationIssueMessage(t, locationIssueCode)}
              </p>
            </div>
          )}

          {onUseDeveloperKuriharaLocation && (
            <div
              style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px dashed #d1d5db",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#9ca3af",
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                }}
              >
                {t.nowInfo.developerLocationSectionLabel}
              </p>
              <p style={{ fontSize: "11px", color: "#6b7280", lineHeight: 1.6, marginBottom: "10px" }}>
                {t.nowInfo.developerKuriharaLocationHelp}
              </p>
              <button
                type="button"
                onClick={onUseDeveloperKuriharaLocation}
                style={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid #d4d4d8",
                  backgroundColor: "#f4f4f5",
                  color: "#52525b",
                  padding: "10px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.nowInfo.developerKuriharaLocationButton}
              </button>
            </div>
          )}
        </section>

        {hasLocation && (
          <>
            <section>
              <div style={{ marginBottom: "10px" }}>
                <p style={{ fontSize: "17px", fontWeight: "800", color: "#111827" }}>{t.nowInfo.mannerSectionTitle}</p>
                {nearbyMannerLines && (
                  <>
                    <p style={{ fontSize: "12px", color: "#b85f74", fontWeight: "700", marginTop: "6px" }}>
                      {nearbyMannerLines.title}
                    </p>
                    <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.8", marginTop: "4px" }}>
                      {nearbyMannerLines.summary}
                    </p>
                  </>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recommendedItems.map((item) => (
                  <RecommendedMannerCard key={item.id} item={item} mannerBadge={t.nowInfo.mannerBadge} t={t} />
                ))}
              </div>
            </section>

            <section>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <p style={{ fontSize: "17px", fontWeight: "800", color: "#111827" }}>{t.nowInfo.facilitiesSectionTitle}</p>
                  <p style={{ fontSize: "12px", color: "#374151", lineHeight: "1.7", marginTop: "4px" }}>
                    {t.nowInfo.nearbyFacilitiesIntro}
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
                  <p style={{ fontSize: "13px", color: "#374151" }}>{t.nowInfo.facilitiesLoading}</p>
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
                  <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.8" }}>
                    {t.nowInfo.facilitiesEmpty}
                  </p>
                </div>
              )}

              {!isLoadingNearby && !nearbyError && nearbyLocations.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {nearbyLocations.map((location) => (
                    <NearbySpotCard
                      key={`${location.placeId || location.name}-${location.lat}-${location.lng}`}
                      location={location}
                      origin={currentPosition}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div style={{ marginBottom: "10px" }}>
                <p style={{ fontSize: "17px", fontWeight: "800", color: "#111827" }}>{t.nowInfo.guideSectionTitle}</p>
                <p style={{ fontSize: "12px", color: "#374151", lineHeight: "1.7", marginTop: "4px" }}>
                  {t.nowInfo.guideSectionLead}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recommendedGuideTopics.map((topic) => {
                  const loc = getLocalizedTopic(topic.id, t);
                  return (
                    <HelpfulTopicCard
                      key={topic.id}
                      title={loc?.title ?? topic.title}
                      subtitle={loc?.subtitle ?? topic.subtitle}
                      description={loc?.description ?? topic.description}
                      emoji={topic.emoji}
                    />
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
