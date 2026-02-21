"use client";

import { useState } from "react";
import type { DiagnosisResult } from "./DiagnosisView";
import { useLanguage } from "../i18n/LanguageContext";
import { DefaultAvatarIcon } from "./icons";

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
}

export default function MyPageView({ diagnosisResult, user, viewHistory = [] }: MyPageViewProps) {
  const { language, setLanguage, t } = useLanguage();
  const [userName, setUserName] = useState(user?.name || t.mypage.guest);
  const [isEditingName, setIsEditingName] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

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
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#fdf2f8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                }}
              >
                {getTravelStyleEmoji(diagnosisResult.travelStyle)}
              </div>
              <div>
                <p style={{ fontSize: "18px", fontWeight: "bold", color: "#be185d" }}>
                  {getLocalizedTravelStyle(diagnosisResult.travelStyle)}
                </p>
                <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                  {diagnosisResult.recommendedPlan.title}
                </p>
              </div>
            </div>

            {/* 興味タグ */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {diagnosisResult.interests.map((interest) => (
                <span
                  key={interest}
                  style={{
                    backgroundColor: "#fce7f3",
                    color: "#be185d",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                >
                  {t.diagnosis.interests[interest as keyof typeof t.diagnosis.interests] || interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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
            viewHistory.map((item, index) => (
              <div
                key={item.id}
                style={{
                  padding: "16px",
                  borderBottom: index < viewHistory.length - 1 ? "1px solid #f3f4f6" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
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
                <span style={{ fontSize: "20px", color: "#d1d5db" }}>›</span>
              </div>
            ))
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
          {/* 通知 */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>🔔</span>
              <span style={{ fontSize: "15px", color: "#374151" }}>{t.mypage.notifications}</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              style={{
                width: "48px",
                height: "28px",
                borderRadius: "14px",
                backgroundColor: notifications ? "#ec4899" : "#d1d5db",
                border: "none",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                  position: "absolute",
                  top: "2px",
                  left: notifications ? "22px" : "2px",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                }}
              />
            </button>
          </div>

          {/* ダークモード */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>🌙</span>
              <span style={{ fontSize: "15px", color: "#374151" }}>{t.mypage.darkMode}</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                width: "48px",
                height: "28px",
                borderRadius: "14px",
                backgroundColor: darkMode ? "#ec4899" : "#d1d5db",
                border: "none",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                  position: "absolute",
                  top: "2px",
                  left: darkMode ? "22px" : "2px",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                }}
              />
            </button>
          </div>

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

      {/* その他 */}
      <div style={{ padding: "0 24px 20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
          {t.mypage.others}
        </h2>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* アプリについて */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>ℹ️</span>
              <span style={{ fontSize: "15px", color: "#374151" }}>{t.mypage.about}</span>
            </div>
            <span style={{ fontSize: "14px", color: "#9ca3af" }}>v1.0.0 ›</span>
          </div>

          {/* お問い合わせ */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>✉️</span>
              <span style={{ fontSize: "15px", color: "#374151" }}>{t.mypage.contact}</span>
            </div>
            <span style={{ fontSize: "20px", color: "#d1d5db" }}>›</span>
          </div>

          {/* 利用規約 */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>📄</span>
              <span style={{ fontSize: "15px", color: "#374151" }}>{t.mypage.terms}</span>
            </div>
            <span style={{ fontSize: "20px", color: "#d1d5db" }}>›</span>
          </div>

          {/* プライバシーポリシー */}
          <div
            style={{
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>🔒</span>
              <span style={{ fontSize: "15px", color: "#374151" }}>{t.mypage.privacy}</span>
            </div>
            <span style={{ fontSize: "20px", color: "#d1d5db" }}>›</span>
          </div>
        </div>
      </div>

      {/* ログアウトボタン */}
      <div style={{ padding: "0 24px 40px" }}>
        <button
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
