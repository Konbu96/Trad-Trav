"use client";

import { useEffect, useRef, useState } from "react";
import type { DiagnosisResult } from "./DiagnosisView";
import { useLanguage } from "../i18n/LanguageContext";
import { ClockIcon, DefaultAvatarIcon, GearIcon, HeartIcon, PenIcon } from "./icons";
import { recommendedSpots, getRecommendedSpotIds, INTEREST_CATEGORY_MAP } from "../data/spots";
import type { CurrentAddress, LocationPermissionState } from "../page";

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
  locationSettingsFocusKey?: number;
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
  locationSettingsFocusKey = 0,
}: MyPageViewProps) {
  const { language, setLanguage, t } = useLanguage();
  const [userName, setUserName] = useState(user?.name || t.mypage.guest);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showTravelTypeModal, setShowTravelTypeModal] = useState(false);
  const locationSectionRef = useRef<HTMLDivElement | null>(null);

  const displayedHistory = showAllHistory ? viewHistory : viewHistory.slice(0, 3);

  // 診断結果からおすすめスポット・カテゴリを計算
  const recommendedSpotIds = diagnosisResult ? getRecommendedSpotIds(diagnosisResult.interests) : [];
  const recommendedSpotList = recommendedSpots.filter(s => recommendedSpotIds.includes(s.id));
  const recommendedCategories = diagnosisResult
    ? Array.from(new Map(
        diagnosisResult.interests.flatMap(i => INTEREST_CATEGORY_MAP[i] || []).map(c => [c.label, c])
      ).values())
    : [];

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
    if (!locationSettingsFocusKey) return;
    locationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [locationSettingsFocusKey]);

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

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#f8fafc",
        overflowY: "auto",
        paddingBottom: "100px",
      }}
    >
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
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <DefaultAvatarIcon size={72} backgroundColor="#fdf3f5" silhouetteColor="#f3a7b8" />
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#e88fa3", marginBottom: "4px" }}>Lv.3</p>
            {isEditingName ? (
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                autoFocus
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
                }}
              />
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
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
                {userName}
                <span style={{ fontSize: "14px", opacity: 0.7 }}>✏️</span>
              </button>
            )}
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
              ゲストトラベラーネーム
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
          {[
            { label: "閲覧履歴", icon: <ClockIcon size={18} color="white" /> },
            {
              label: "お気に入り",
              icon: <HeartIcon size={18} color="white" />,
            },
            { label: "診断", icon: <PenIcon size={18} color="white" /> },
            { label: "設定", icon: <GearIcon size={18} color="white" /> },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
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
            </div>
          ))}
        </div>
      </div>

      {/* 診断結果 */}
      {diagnosisResult && (
        <div style={{ padding: "20px 24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
            {t.mypage.travelType}
          </h2>
          <button
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
            {/* ハンドルバー */}
            <div style={{ width: "48px", height: "5px", backgroundColor: "#d1d5db", borderRadius: "99px", margin: "0 auto 20px" }} />

            {/* タイトル */}
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

            {/* 説明 */}
            <div style={{ backgroundColor: "#fdf3f5", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.7" }}>
                {diagnosisResult.recommendedPlan.description}
              </p>
            </div>

            {/* おすすめカテゴリ */}
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

            {/* おすすめスポット */}
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
                あなたにおすすめのスポット
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {recommendedSpotList.map(spot => (
                  <button
                    key={spot.id}
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

            {/* ヒント */}
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

      {/* バッジ */}
      <div style={{ padding: "0 24px 20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
          {language === "ja" ? "バッジ" : "Badges"}
        </h2>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "80px",
          }}
        >
          <p style={{ color: "#d1d5db", fontSize: "14px" }}>
            {language === "ja" ? "バッジ機能は準備中です" : "Badges coming soon"}
          </p>
        </div>
      </div>

      {/* 旅の好み診断 */}
      <div style={{ padding: "0 24px 20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
          {language === "ja" ? "旅の好み診断" : "Travel Diagnosis"}
        </h2>
        <button
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
                {diagnosisResult
                  ? (language === "ja" ? "診断をやり直す" : "Retake Diagnosis")
                  : (language === "ja" ? "診断を受ける" : "Start Diagnosis")}
              </p>
              <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                {diagnosisResult
                  ? (language === "ja" ? `現在: ${diagnosisResult.travelStyle}` : `Current: ${diagnosisResult.travelStyle}`)
                  : (language === "ja" ? "あなたにぴったりのスポットを見つけよう" : "Find spots that suit you")}
              </p>
            </div>
          </div>
          <span style={{ fontSize: "20px", color: "#e88fa3" }}>›</span>
        </button>
      </div>

      {/* 閲覧履歴 */}
      <div style={{ padding: "0 24px 20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
          {t.mypage.viewHistory}
        </h2>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          {viewHistory.length > 0 ? (
            <>
              {displayedHistory.map((item, index) => (
                <button
                  key={`${item.id}-${item.date}`}
                  onClick={() => onJumpToSpot?.(item.id)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderBottom: index < displayedHistory.length - 1 || viewHistory.length > 3 ? "1px solid #f3f4f6" : "none",
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
                    <p style={{ fontSize: "15px", fontWeight: "500", color: "#374151" }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                      {item.category} • {item.date}
                    </p>
                  </div>
                  <span style={{ fontSize: "20px", color: onJumpToSpot ? "#e88fa3" : "#d1d5db" }}>›</span>
                </button>
              ))}
              {viewHistory.length > 3 && (
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    backgroundColor: "#f9fafb",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#e88fa3",
                    fontWeight: "500",
                  }}
                >
                  {showAllHistory 
                    ? (language === "ja" ? "閉じる" : "Show Less")
                    : (language === "ja" ? `もっと見る (${viewHistory.length - 3}件)` : `Show More (${viewHistory.length - 3})`)}
                </button>
              )}
            </>
          ) : (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>{t.mypage.noHistory}</p>
            </div>
          )}
        </div>
      </div>

      {/* 設定 */}
      <div style={{ padding: "0 24px 20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
          {t.mypage.settings}
        </h2>
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
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              backgroundColor: "#fdf3f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}>
              📍
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "15px", fontWeight: "600", color: "#1f2937" }}>
                位置情報の利用
              </p>
              <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.7", marginTop: "4px" }}>
                許可すると、状況に合わせたマナー表示に今後使えるようになります。
              </p>
            </div>
          </div>

          {onRequestLocationPermission && (
            <button
              onClick={onRequestLocationPermission}
              style={{
                marginTop: "14px",
                borderRadius: "999px",
                backgroundColor:
                  isUsingMockLocation
                    ? "#f59e0b"
                    : locationPermissionState === "granted"
                    ? "#16a34a"
                    : locationPermissionState === "requesting"
                      ? "#f3b6c3"
                      : "#e88fa3",
                color: "white",
                padding: "10px 14px",
                fontSize: "13px",
                fontWeight: "700",
                opacity: locationPermissionState === "requesting" ? 0.9 : 1,
              }}
            >
              {locationPermissionState === "requesting"
                ? "取得中..."
                : isUsingMockLocation
                  ? "仙台市の仮位置を使用中"
                  : locationPermissionState === "granted"
                ? "現在地を監視中"
                  : "現在地を共有する"}
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
          {/* 言語 */}
          <button
            onClick={() => setShowLanguageModal(true)}
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
        </div>
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
