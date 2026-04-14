"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { DiagnosisResult } from "./DiagnosisView";
import { useLanguage } from "../i18n/LanguageContext";
import { ClockIcon, DefaultAvatarIcon, GearIcon, HeartIcon, PenIcon } from "./icons";
import { recommendedSpots, getRecommendedSpotIds, INTEREST_CATEGORY_MAP } from "../data/spots";
import type { CurrentAddress, LocationPermissionState } from "../page";
import { BADGE_META, defaultPlayerProgress, xpIntoCurrentLevel, type PlayerProgress } from "../lib/playerProgress";

interface User {
  name: string;
  email: string;
}

interface ViewHistoryItem {
  id: number;
  name: string;
  date: string;
  category: string;
}

type MypagePanel = "main" | "history" | "favorites" | "settings";

function MypageSubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { t } = useLanguage();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px 16px",
        borderBottom: "1px solid #f7dfe5",
        background: "#fdf3f5",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          border: "none",
          background: "rgba(255,255,255,0.9)",
          borderRadius: "12px",
          padding: "8px 14px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#374151",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          cursor: "pointer",
        }}
      >
        ← {t.common.back}
      </button>
      <h1 style={{ fontSize: "17px", fontWeight: 800, color: "#111827", flex: 1 }}>{title}</h1>
    </div>
  );
}

interface MyPageViewProps {
  diagnosisResult: DiagnosisResult | null;
  user: User | null;
  viewHistory?: ViewHistoryItem[];
  onLogout?: () => void;
  onJumpToSpot?: (spotId: number) => void;
  onStartDiagnosis?: () => void;
  onLoginRequest?: () => void;
  locationPermissionState?: LocationPermissionState;
  locationError?: string;
  currentPosition?: { latitude: number; longitude: number } | null;
  currentAddress?: CurrentAddress | null;
  isUsingMockLocation?: boolean;
  onRequestLocationPermission?: () => void;
  settingsOpenKey?: number;
  onTutorialAction?: (actionId: string) => void;
  onReplayTutorials?: () => void;
  favoriteSpotIds?: number[];
  onToggleFavorite?: (spotId: number) => void;
  /** 未ログイン時に localStorage から復元した表示名（空ならゲスト扱い） */
  guestDisplayName?: string;
  onSaveDisplayName?: (name: string) => Promise<void>;
  playerProgress?: PlayerProgress;
}

export default function MyPageView({
  diagnosisResult,
  user,
  viewHistory = [],
  onLogout,
  onJumpToSpot,
  onStartDiagnosis,
  onLoginRequest,
  locationPermissionState = "idle",
  locationError = "",
  currentPosition = null,
  currentAddress = null,
  isUsingMockLocation = false,
  onRequestLocationPermission,
  settingsOpenKey = 0,
  onTutorialAction,
  onReplayTutorials,
  favoriteSpotIds = [],
  onToggleFavorite,
  guestDisplayName = "",
  onSaveDisplayName,
  playerProgress: playerProgressProp,
}: MyPageViewProps) {
  const playerProgress = playerProgressProp ?? defaultPlayerProgress();
  const levelRingGradId = useId().replace(/:/g, "");
  const { language, setLanguage, t } = useLanguage();
  const { level: playerLevel, current: xpInLevel, need: xpNeedForLevel } = xpIntoCurrentLevel(playerProgress.xp);
  const levelBarPercent =
    xpNeedForLevel > 0 ? Math.min(100, Math.round((xpInLevel / xpNeedForLevel) * 100)) : 0;
  const xpToNextLevel = Math.max(0, xpNeedForLevel - xpInLevel);
  const RING_SIZE = 92;
  const RING_R = 40;
  const ringCircumference = 2 * Math.PI * RING_R;
  const ringDashOffset = ringCircumference * (1 - levelBarPercent / 100);
  const savedRawDisplayName = user ? (user.name ?? "") : guestDisplayName;
  const resolvedDisplayName = savedRawDisplayName.trim() || t.mypage.guest;
  const [draftName, setDraftName] = useState(savedRawDisplayName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [saveNameError, setSaveNameError] = useState("");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showTravelTypeModal, setShowTravelTypeModal] = useState(false);
  const [panel, setPanel] = useState<MypagePanel>("main");
  const [subPanelEntered, setSubPanelEntered] = useState(false);
  const locationSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (panel === "main") {
      setSubPanelEntered(false);
      return;
    }
    setSubPanelEntered(false);
    const t = window.setTimeout(() => setSubPanelEntered(true), 20);
    return () => window.clearTimeout(t);
  }, [panel]);

  const beginCloseSubPanel = useCallback(() => {
    setSubPanelEntered(false);
  }, []);

  const handleSubPanelTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
      if (!subPanelEntered) {
        setPanel("main");
      }
    },
    [subPanelEntered]
  );

  // 診断結果からおすすめスポット・カテゴリを計算
  const recommendedSpotIds = diagnosisResult ? getRecommendedSpotIds(diagnosisResult.interests) : [];
  const recommendedSpotList = recommendedSpots.filter(s => recommendedSpotIds.includes(s.id));
  const recommendedCategories = diagnosisResult
    ? Array.from(new Map(
        diagnosisResult.interests.flatMap(i => INTEREST_CATEGORY_MAP[i] || []).map(c => [c.label, c])
      ).values())
    : [];

  const favoriteDisplayRows = favoriteSpotIds.map((id) => {
    const spot = recommendedSpots.find((s) => s.id === id);
    const hist = viewHistory.find((h) => h.id === id);
    const name =
      spot?.name ||
      hist?.name ||
      (language === "ja" ? "マップのスポット" : "Map spot");
    const category = spot?.category || hist?.category || "";
    return { id, name, category };
  });

  // 旅行タイプの表示名を取得
  const getTravelStyleEmoji = (style: string) => {
    if (style.includes("グルメ") || style.includes("Gourmet")) return "🍜";
    if (style.includes("アクティブ") || style.includes("Active")) return "🏔️";
    if (style.includes("癒し") || style.includes("Relax")) return "♨️";
    if (style.includes("観光") || style.includes("Sightseeing")) return "🏛️";
    return "🌸";
  };

  const getLocalizedTravelStyle = (style: string) => {
    if (language === "en") {
      if (style.includes("グルメ")) return t.diagnosis.travelStyles.gourmet;
      if (style.includes("アクティブ")) return t.diagnosis.travelStyles.active;
      if (style.includes("癒し")) return t.diagnosis.travelStyles.relaxGourmet;
      if (style.includes("観光")) return t.diagnosis.travelStyles.sightseeing;
      return t.diagnosis.travelStyles.balanced;
    }
    return style;
  };

  useEffect(() => {
    if (!settingsOpenKey) return;
    setPanel("settings");
    const id = window.setTimeout(() => {
      locationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(id);
  }, [settingsOpenKey]);

  useEffect(() => {
    if (!isEditingName) {
      setDraftName(savedRawDisplayName);
    }
  }, [savedRawDisplayName, isEditingName]);

  const beginEditName = useCallback(() => {
    setDraftName(savedRawDisplayName);
    setSaveNameError("");
    setIsEditingName(true);
  }, [savedRawDisplayName]);

  const handleCancelNameEdit = useCallback(() => {
    setDraftName(savedRawDisplayName);
    setSaveNameError("");
    setIsEditingName(false);
  }, [savedRawDisplayName]);

  const handleConfirmSaveName = useCallback(async () => {
    if (!onSaveDisplayName) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    setSaveNameError("");
    try {
      await onSaveDisplayName(draftName);
      setIsEditingName(false);
    } catch {
      setSaveNameError(t.mypage.saveDisplayNameFailed);
    } finally {
      setSavingName(false);
    }
  }, [draftName, onSaveDisplayName, t.mypage.saveDisplayNameFailed]);

  const getLocationErrorGuide = () => {
    if (locationPermissionState === "denied") {
      return "ブラウザや端末の設定で、このサイトの位置情報を許可してください。";
    }

    if (locationPermissionState === "unsupported") {
      return "この端末やブラウザでは、位置情報機能が使えない可能性があります。";
    }

    if (locationError.includes("タイムアウト")) {
      return "屋外や電波の良い場所に移動して、もう一度お試しください。";
    }

    if (locationError.includes("安全な接続")) {
      return "https の URL で開いているか確認してください。";
    }

    if (locationError.includes("特定できません")) {
      return "GPS、Wi-Fi、モバイル通信がオンになっているか確認してください。";
    }

    return "少し時間を置いてから、もう一度お試しください。";
  };

  const settingsPanelBody = (
    <>
      <div style={{ padding: "0 0 8px" }}>
        <div
          ref={locationSectionRef}
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "18px 16px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            marginBottom: "12px",
            border: "1px solid #f7dfe5",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "14px",
                backgroundColor: "#fdf3f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              📍
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "15px", fontWeight: "600", color: "#1f2937" }}>
                位置情報の利用
              </p>
              <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.7", marginTop: "4px" }}>
                下のボタンを押したときだけ、ブラウザに位置情報の許可を求めます。許可後、なう情報などが場所に合わせて変わります。
              </p>
            </div>
          </div>

          {onRequestLocationPermission && (
            <button
              type="button"
              onClick={() => {
                onTutorialAction?.("mypage.location-share-button");
                onRequestLocationPermission();
              }}
              data-tutorial-id="mypage.location-share-button"
              style={{
                marginTop: "14px",
                borderRadius: "999px",
                backgroundColor:
                  isUsingMockLocation
                    ? "#f59e0b"
                    : locationPermissionState === "granted"
                      ? "#e88fa3"
                      : locationPermissionState === "requesting"
                        ? "#f3b6c3"
                        : "#e88fa3",
                color: "white",
                padding: "10px 14px",
                fontSize: "13px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                opacity: locationPermissionState === "requesting" ? 0.9 : 1,
              }}
            >
              {locationPermissionState === "requesting"
                ? "取得中..."
                : isUsingMockLocation
                  ? "仙台市の仮位置を使用中"
                  : locationPermissionState === "granted"
                    ? "現在地を取得中"
                    : "現在地を共有する（許可を確認）"}
            </button>
          )}

          {currentPosition && (
            <div style={{ marginTop: "10px" }}>
              <p style={{ fontSize: "12px", color: isUsingMockLocation ? "#b45309" : "#166534", fontWeight: "700" }}>
                {isUsingMockLocation ? "PC確認用に仮の現在地を表示しています" : "現在地を継続監視しています"}
              </p>
              {currentAddress && (
                <p style={{ fontSize: "12px", color: "#1f2937", lineHeight: "1.6", marginTop: "4px" }}>
                  {currentAddress.prefecture}{currentAddress.city}{currentAddress.town}
                </p>
              )}
              <p style={{ fontSize: "12px", color: "#374151", lineHeight: "1.6", marginTop: "2px" }}>
                緯度 {currentPosition.latitude.toFixed(5)} / 経度 {currentPosition.longitude.toFixed(5)}
              </p>
              {currentAddress?.formattedAddress && (
                <p style={{ fontSize: "11px", color: "#6b7280", lineHeight: "1.6", marginTop: "4px" }}>
                  {currentAddress.formattedAddress}
                </p>
              )}
            </div>
          )}

          {(locationPermissionState === "denied" || locationPermissionState === "unsupported" || locationPermissionState === "error") && locationError && (
            <div
              style={{
                marginTop: "12px",
                borderRadius: "14px",
                backgroundColor: "#fdf3f5",
                border: "1px solid #fecdd3",
                padding: "12px 14px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#b91c1c", fontWeight: "700" }}>
                位置情報を取得できませんでした
              </p>
              <p style={{ fontSize: "12px", color: "#991b1b", lineHeight: "1.7", marginTop: "4px" }}>
                {locationError}
              </p>
              <p style={{ fontSize: "11px", color: "#7f1d1d", lineHeight: "1.7", marginTop: "6px" }}>
                {getLocationErrorGuide()}
              </p>
            </div>
          )}
        </div>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              onTutorialAction?.("mypage.language-button");
              setShowLanguageModal(true);
            }}
            data-tutorial-id="mypage.language-button"
            style={{
              width: "100%",
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>🌐</span>
              <span style={{ fontSize: "15px", color: "#374151" }}>{t.mypage.language}</span>
            </div>
            <span style={{ fontSize: "14px", color: "#9ca3af" }}>
              {language === "ja" ? "日本語" : "English"} ›
            </span>
          </button>
          {onReplayTutorials && (
            <button
              type="button"
              onClick={onReplayTutorials}
              style={{
                width: "100%",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "none",
                border: "none",
                borderTop: "1px solid #f3f4f6",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>💡</span>
                <span style={{ fontSize: "15px", color: "#374151" }}>チュートリアルをもう一度見る</span>
              </div>
              <span style={{ fontSize: "14px", color: "#9ca3af" }}>›</span>
            </button>
          )}
        </div>
      </div>
    </>
  );

  const showSubPanelLayer = panel === "history" || panel === "favorites" || panel === "settings";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {showSubPanelLayer && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fdf3f5",
            transform: subPanelEntered ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.36s cubic-bezier(0.32, 0.72, 0, 1)",
            willChange: "transform",
            boxShadow: subPanelEntered ? "-8px 0 32px rgba(232, 143, 163, 0.18)" : "none",
          }}
          onTransitionEnd={handleSubPanelTransitionEnd}
        >
      {panel === "history" && (
        <>
          <MypageSubHeader
            title={t.mypage.viewHistory}
            onBack={beginCloseSubPanel}
          />
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 100px" }}>
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              }}
            >
              {viewHistory.length > 0 ? (
                viewHistory.map((item, index) => (
                  <button
                    key={`${item.id}-${item.date}`}
                    type="button"
                    onClick={() => {
                      onJumpToSpot?.(item.id);
                      setSubPanelEntered(false);
                      setPanel("main");
                    }}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderBottom: index < viewHistory.length - 1 ? "1px solid #f3f4f6" : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "none",
                      border: "none",
                      cursor: onJumpToSpot ? "pointer" : "default",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: "500", color: "#374151" }}>{item.name}</p>
                      <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        {item.category} • {item.date}
                      </p>
                    </div>
                    <span style={{ fontSize: "20px", color: onJumpToSpot ? "#e88fa3" : "#d1d5db" }}>›</span>
                  </button>
                ))
              ) : (
                <div style={{ padding: "24px", textAlign: "center" }}>
                  <p style={{ color: "#9ca3af", fontSize: "14px" }}>{t.mypage.noHistory}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {panel === "favorites" && (
        <>
          <MypageSubHeader
            title={t.mypage.favorites}
            onBack={beginCloseSubPanel}
          />
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 100px" }}>
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              }}
            >
              {favoriteDisplayRows.length > 0 ? (
                favoriteDisplayRows.map((row, index) => (
                  <div
                    key={row.id}
                    style={{
                      display: "flex",
                      alignItems: "stretch",
                      borderBottom: index < favoriteDisplayRows.length - 1 ? "1px solid #f3f4f6" : "none",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onJumpToSpot?.(row.id);
                        setSubPanelEntered(false);
                        setPanel("main");
                      }}
                      style={{
                        flex: 1,
                        padding: "16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "none",
                        border: "none",
                        cursor: onJumpToSpot ? "pointer" : "default",
                        textAlign: "left",
                        minWidth: 0,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p
                          className="line-clamp-2"
                          style={{ fontSize: "15px", fontWeight: "500", color: "#374151" }}
                        >
                          {row.name}
                        </p>
                        {row.category ? (
                          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{row.category}</p>
                        ) : null}
                      </div>
                      <span style={{ fontSize: "20px", color: onJumpToSpot ? "#e88fa3" : "#d1d5db", flexShrink: 0 }}>
                        ›
                      </span>
                    </button>
                    {onToggleFavorite && (
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(row.id)}
                        style={{
                          flexShrink: 0,
                          padding: "12px 14px",
                          border: "none",
                          borderLeft: "1px solid #f3f4f6",
                          background: "#fff",
                          color: "#e88fa3",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          alignSelf: "stretch",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {t.mypage.removeFavorite}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: "24px", textAlign: "center" }}>
                  <p style={{ color: "#9ca3af", fontSize: "14px" }}>{t.mypage.noFavorites}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {panel === "settings" && (
        <>
          <MypageSubHeader
            title={t.mypage.settings}
            onBack={beginCloseSubPanel}
          />
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 100px" }}>{settingsPanelBody}</div>
        </>
      )}
        </div>
      )}

      {panel === "main" && (
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: "100px" }}>
      {/* ヘッダー */}
      <div
        style={{
          backgroundColor: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
          background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
          minHeight: "92px",
          padding: "0 20px",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 800, textAlign: "center" }}>
          {t.mypage.title}
        </h1>
      </div>

      <div style={{ padding: "20px 24px 0" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "22px",
            padding: "18px 16px",
            boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
            border: "1px solid #f7dfe5",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}>
              <div
                style={{
                  position: "relative",
                  width: RING_SIZE,
                  height: RING_SIZE,
                  borderRadius: "50%",
                }}
                aria-label={t.mypage.playerLevelSummaryAria}
              >
                <svg
                  width={RING_SIZE}
                  height={RING_SIZE}
                  viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                  style={{ position: "absolute", left: 0, top: 0, transform: "rotate(-90deg)" }}
                  aria-hidden
                >
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_R}
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth={6}
                  />
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_R}
                    fill="none"
                    stroke={`url(#${levelRingGradId})`}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringDashOffset}
                  />
                  <defs>
                    <linearGradient id={levelRingGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#e88fa3" />
                      <stop offset="100%" stopColor="#f3a7b8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    backgroundColor: "#fdf3f5",
                    pointerEvents: "none",
                  }}
                >
                  <DefaultAvatarIcon size={70} backgroundColor="#fdf3f5" silhouetteColor="#f3a7b8" />
                </div>
              </div>
            </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12px", fontWeight: 800, color: "#e88fa3", margin: "0 0 4px" }}>
              {t.mypage.playerProgressLevel.replace("{level}", String(playerLevel))}
            </p>
            {isEditingName ? (
              <div style={{ width: "100%" }}>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleConfirmSaveName();
                    }
                  }}
                  disabled={savingName}
                  autoFocus
                  placeholder={t.mypage.guest}
                  style={{
                    backgroundColor: "#fdf3f5",
                    border: "1px solid #f3d1da",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    color: "#111827",
                    fontSize: "18px",
                    fontWeight: "600",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "10px",
                  }}
                >
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={() => void handleConfirmSaveName()}
                    style={{
                      border: "none",
                      background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
                      color: "white",
                      borderRadius: "10px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: savingName ? "default" : "pointer",
                      opacity: savingName ? 0.7 : 1,
                    }}
                  >
                    {savingName ? t.common.loading : t.common.save}
                  </button>
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={handleCancelNameEdit}
                    style={{
                      border: "1px solid #e5e7eb",
                      background: "white",
                      color: "#374151",
                      borderRadius: "10px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: savingName ? "default" : "pointer",
                    }}
                  >
                    {t.common.cancel}
                  </button>
                </div>
                {saveNameError ? (
                  <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px", marginBottom: 0 }}>
                    {saveNameError}
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={beginEditName}
                style={{
                  background: "none",
                  border: "none",
                  color: "#111827",
                  fontSize: "18px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: 0,
                }}
              >
                {resolvedDisplayName}
                <span style={{ fontSize: "14px", opacity: 0.7 }}>✏️</span>
              </button>
            )}
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
              {user ? t.mypage.accountDisplayNameLabel : t.mypage.guestTravelerNameLabel}
            </p>
          </div>
          </div>

          <div
            style={{
              marginTop: "14px",
              paddingTop: "14px",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#374151", margin: "0 0 6px" }}>
              {t.mypage.playerXpToNext.replace("{n}", String(xpToNextLevel))}
            </p>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
              {t.mypage.playerXpCurrent.replace("{xp}", String(playerProgress.xp))}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
          {[
            {
              label: "閲覧履歴",
              icon: <ClockIcon size={18} color="white" />,
              onClick: () => setPanel("history"),
            },
            {
              label: t.mypage.favorites,
              icon: <HeartIcon size={18} color="white" />,
              onClick: () => setPanel("favorites"),
            },
            { label: "診断", icon: <PenIcon size={18} color="white" />, onClick: onStartDiagnosis },
            {
              label: "設定",
              icon: <GearIcon size={18} color="white" />,
              onClick: () => {
                onTutorialAction?.("mypage.settings-entry");
                setPanel("settings");
              },
              tutorialId: "mypage.settings-entry" as const,
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              data-tutorial-id={"tutorialId" in item ? item.tutorialId : undefined}
              onClick={item.onClick}
              disabled={!item.onClick}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                background: "none",
                border: "none",
                padding: 0,
                cursor: item.onClick ? "pointer" : "default",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "999px",
                  backgroundColor: "#f28ca3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                {item.icon}
              </div>
              <p style={{ fontSize: "11px", color: "#374151", fontWeight: 600 }}>{item.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 24px 16px" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "16px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            border: "1px solid #f3f4f6",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#374151", marginBottom: "10px" }}>
            {t.mypage.playerProgressBadges}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {playerProgress.badgeIds.length === 0 ? (
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>—</span>
            ) : (
              playerProgress.badgeIds.map((id) => {
                const meta = BADGE_META[id];
                const label = meta ? (language === "en" ? meta.labelEn : meta.labelJa) : id;
                return (
                  <span
                    key={id}
                    title={label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#b85f74",
                      backgroundColor: "#fdf3f5",
                      padding: "6px 10px",
                      borderRadius: "999px",
                    }}
                  >
                    {meta?.emoji ? <span>{meta.emoji}</span> : null}
                    {label}
                  </span>
                );
              })
            )}
          </div>
          {!user && (
            <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "10px", marginBottom: 0, lineHeight: 1.5 }}>
              {t.mypage.playerProgressGuestHint}
            </p>
          )}
        </div>
      </div>

      {/* 診断（結果または受ける導線を一括） */}
      <div style={{ padding: "20px 24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
          {t.diagnosis.title}
        </h2>
        {diagnosisResult ? (
          <button
            type="button"
            onClick={() => setShowTravelTypeModal(true)}
            style={{
              width: "100%",
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "10px" }}>
              {t.mypage.travelType}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                backgroundColor: "#fdf3f5", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "28px",
              }}>
                {getTravelStyleEmoji(diagnosisResult.travelStyle)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "18px", fontWeight: "bold", color: "#b85f74" }}>
                  {getLocalizedTravelStyle(diagnosisResult.travelStyle)}
                </p>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                  {diagnosisResult.recommendedPlan.title}
                </p>
              </div>
              <span style={{ fontSize: "20px", color: "#e88fa3" }}>›</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {diagnosisResult.interests.map((interest) => (
                <span key={interest} style={{
                  backgroundColor: "#f7dfe5", color: "#b85f74",
                  padding: "4px 10px", borderRadius: "12px", fontSize: "12px",
                }}>
                  {t.diagnosis.interests[interest as keyof typeof t.diagnosis.interests] || interest}
                </span>
              ))}
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartDiagnosis}
            style={{
              width: "100%",
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px", height: "48px", borderRadius: "14px",
                  backgroundColor: "#fdf3f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "24px",
                }}
              >
                🌸
              </div>
              <div>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#1f2937" }}>
                  {language === "ja" ? "診断を受ける" : "Start Diagnosis"}
                </p>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                  {language === "ja" ? "あなたにぴったりのスポットを見つけよう" : "Find spots that suit you"}
                </p>
              </div>
            </div>
            <span style={{ fontSize: "20px", color: "#e88fa3" }}>›</span>
          </button>
        )}
      </div>

      {/* ログイン / ログアウトボタン */}
      <div style={{ padding: "0 24px 40px" }}>
        {user ? (
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #fecdd3",
              backgroundColor: "#fdf3f5",
              color: "#e11d48",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            {t.mypage.logout}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af" }}>
              {language === "ja"
                ? "ログインすると閲覧履歴やお気に入りが保存されます"
                : "Log in to save your history and favorites"}
            </p>
            <button
              onClick={onLoginRequest}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #e88fa3, #f3a7b8)",
                color: "white",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(236, 72, 153, 0.35)",
              }}
            >
              {language === "ja" ? "ログイン / 新規登録" : "Login / Sign Up"}
            </button>
          </div>
        )}
      </div>

        </div>
      )}

      {/* 旅行タイプ詳細モーダル */}
      {showTravelTypeModal && diagnosisResult && (
        <div
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999, display: "flex", alignItems: "flex-end",
          }}
          onClick={() => setShowTravelTypeModal(false)}
        >
          <div
            style={{
              backgroundColor: "white", borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px", width: "100%",
              maxHeight: "85vh", overflowY: "auto", padding: "24px",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: "48px", height: "5px", backgroundColor: "#d1d5db", borderRadius: "99px", margin: "0 auto 20px" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%",
                backgroundColor: "#fdf3f5", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "26px",
              }}>
                {getTravelStyleEmoji(diagnosisResult.travelStyle)}
              </div>
              <div>
                <p style={{ fontSize: "20px", fontWeight: "bold", color: "#b85f74" }}>
                  {getLocalizedTravelStyle(diagnosisResult.travelStyle)}
                </p>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>{diagnosisResult.recommendedPlan.title}</p>
              </div>
            </div>

            <div style={{ backgroundColor: "#fdf3f5", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.7" }}>
                {diagnosisResult.recommendedPlan.description}
              </p>
            </div>

            {recommendedCategories.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
                  おすすめカテゴリ
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {recommendedCategories.map(cat => (
                    <span key={cat.label} style={{
                      backgroundColor: "#f7dfe5", color: "#b85f74",
                      padding: "6px 14px", borderRadius: "20px",
                      fontSize: "14px", fontWeight: "500",
                    }}>
                      {cat.emoji} {cat.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
                あなたにおすすめのスポット
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {recommendedSpotList.map(spot => (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => { onJumpToSpot?.(spot.id); setShowTravelTypeModal(false); }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      backgroundColor: "#f9fafb", borderRadius: "12px",
                      padding: "12px 14px", border: "1px solid #f3f4f6",
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: "500", color: "#1f2937" }}>{spot.name}</p>
                      <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{spot.category}</p>
                    </div>
                    <span style={{ color: "#e88fa3", fontSize: "16px" }}>地図 ›</span>
                  </button>
                ))}
              </div>
            </div>

            {diagnosisResult.recommendedPlan.tips.length > 0 && (
              <div>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
                  旅のヒント
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {diagnosisResult.recommendedPlan.tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: "#e88fa3", fontSize: "14px", flexShrink: 0 }}>💡</span>
                      <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.6" }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowTravelTypeModal(false)}
              style={{
                width: "100%", marginTop: "24px", padding: "14px",
                borderRadius: "12px", backgroundColor: "#e88fa3",
                color: "white", border: "none", fontSize: "15px",
                fontWeight: "600", cursor: "pointer",
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 言語選択モーダル */}
      {showLanguageModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowLanguageModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "24px",
              width: "280px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "20px", textAlign: "center" }}>
              {t.mypage.language}
            </h3>
            
            <button
              onClick={() => { setLanguage("ja"); setShowLanguageModal(false); }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: language === "ja" ? "2px solid #e88fa3" : "1px solid #e5e7eb",
                backgroundColor: language === "ja" ? "#fdf3f5" : "white",
                marginBottom: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "15px", color: "#374151" }}>🇯🇵 日本語</span>
              {language === "ja" && <span style={{ color: "#e88fa3" }}>✓</span>}
            </button>
            
            <button
              onClick={() => { setLanguage("en"); setShowLanguageModal(false); }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: language === "en" ? "2px solid #e88fa3" : "1px solid #e5e7eb",
                backgroundColor: language === "en" ? "#fdf3f5" : "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "15px", color: "#374151" }}>🇺🇸 English</span>
              {language === "en" && <span style={{ color: "#e88fa3" }}>✓</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
