"use client";

import { useState } from "react";
import type { DiagnosisResult } from "./DiagnosisView";
import { useLanguage } from "../i18n/LanguageContext";
import { DefaultAvatarIcon } from "./icons";
import { recommendedSpots, getRecommendedSpotIds, INTEREST_CATEGORY_MAP } from "../data/spots";

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
}

export default function MyPageView({ diagnosisResult, user, viewHistory = [], onLogout, onJumpToSpot, onStartDiagnosis, onLoginRequest }: MyPageViewProps) {
  const { language, setLanguage, t } = useLanguage();
  const [userName, setUserName] = useState(user?.name || t.mypage.guest);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showTravelTypeModal, setShowTravelTypeModal] = useState(false);

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
          backgroundColor: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
          background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
          padding: "48px 24px 32px",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" }}>
          {t.mypage.title}
        </h1>

        {/* プロフィール */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* アバター */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <DefaultAvatarIcon size={72} backgroundColor="rgba(255, 255, 255, 0.3)" silhouetteColor="rgba(255, 255, 255, 0.7)" />
          </div>

          {/* 名前 */}
          <div style={{ flex: 1 }}>
            {isEditingName ? (
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                autoFocus
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "white",
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
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {userName}
                <span style={{ fontSize: "14px", opacity: 0.7 }}>✏️</span>
              </button>
            )}
            <p style={{ fontSize: "13px", opacity: 0.8, marginTop: "4px" }}>
              {t.mypage.editName}
            </p>
          </div>
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
                backgroundColor: "#fdf2f8", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "28px",
              }}>
                {getTravelStyleEmoji(diagnosisResult.travelStyle)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "18px", fontWeight: "bold", color: "#be185d" }}>
                  {getLocalizedTravelStyle(diagnosisResult.travelStyle)}
                </p>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                  {diagnosisResult.recommendedPlan.title}
                </p>
              </div>
              <span style={{ fontSize: "20px", color: "#ec4899" }}>›</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {diagnosisResult.interests.map((interest) => (
                <span key={interest} style={{
                  backgroundColor: "#fce7f3", color: "#be185d",
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
                backgroundColor: "#fdf2f8", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "26px",
              }}>
                {getTravelStyleEmoji(diagnosisResult.travelStyle)}
              </div>
              <div>
                <p style={{ fontSize: "20px", fontWeight: "bold", color: "#be185d" }}>
                  {getLocalizedTravelStyle(diagnosisResult.travelStyle)}
                </p>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>{diagnosisResult.recommendedPlan.title}</p>
              </div>
            </div>

            {/* 説明 */}
            <div style={{ backgroundColor: "#fdf2f8", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
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
                      backgroundColor: "#fce7f3", color: "#be185d",
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
                    <span style={{ color: "#ec4899", fontSize: "16px" }}>地図 ›</span>
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
                      <span style={{ color: "#ec4899", fontSize: "14px", flexShrink: 0 }}>💡</span>
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
                borderRadius: "12px", backgroundColor: "#ec4899",
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
                backgroundColor: "#fdf2f8",
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
          <span style={{ fontSize: "20px", color: "#ec4899" }}>›</span>
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
                    borderBottom: index < displayedHistory.length - 1 || viewHistory.length > 3 ? "1px solid #f3f4f6" : "none",
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
                  <span style={{ fontSize: "20px", color: onJumpToSpot ? "#ec4899" : "#d1d5db" }}>›</span>
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
                    color: "#ec4899",
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
              backgroundColor: "#fff1f2",
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
                background: "linear-gradient(135deg, #ec4899, #f472b6)",
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
                border: language === "ja" ? "2px solid #ec4899" : "1px solid #e5e7eb",
                backgroundColor: language === "ja" ? "#fdf2f8" : "white",
                marginBottom: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "15px", color: "#374151" }}>🇯🇵 日本語</span>
              {language === "ja" && <span style={{ color: "#ec4899" }}>✓</span>}
            </button>
            
            <button
              onClick={() => { setLanguage("en"); setShowLanguageModal(false); }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: language === "en" ? "2px solid #ec4899" : "1px solid #e5e7eb",
                backgroundColor: language === "en" ? "#fdf2f8" : "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "15px", color: "#374151" }}>🇺🇸 English</span>
              {language === "en" && <span style={{ color: "#ec4899" }}>✓</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
