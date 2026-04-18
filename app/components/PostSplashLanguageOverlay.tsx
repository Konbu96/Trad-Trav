"use client";

import { useLanguage } from "../i18n/LanguageContext";

type PostSplashLanguageOverlayProps = {
  onDismiss: () => void;
};

export default function PostSplashLanguageOverlay({ onDismiss }: PostSplashLanguageOverlayProps) {
  const { language, setLanguage, t } = useLanguage();

  const select = (lang: "ja" | "en" | "zh" | "ko") => {
    setLanguage(lang);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100000,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "24px",
          width: "100%",
          maxWidth: "320px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18)",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#111827",
            marginBottom: "8px",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {t.splash.languagePromptTitle}
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            marginBottom: "20px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {t.splash.languagePromptSub}
        </p>

        <LanguageRow
          label={`🇯🇵 ${t.mypage.japanese}`}
          active={language === "ja"}
          onSelect={() => select("ja")}
        />
        <LanguageRow
          label={`🇺🇸 ${t.mypage.english}`}
          active={language === "en"}
          onSelect={() => select("en")}
        />
        <LanguageRow
          label={`🇨🇳 ${t.mypage.chinese}`}
          active={language === "zh"}
          onSelect={() => select("zh")}
        />
        <LanguageRow
          label={`🇰🇷 ${t.mypage.korean}`}
          active={language === "ko"}
          onSelect={() => select("ko")}
        />

        <button
          type="button"
          onClick={onDismiss}
          style={{
            width: "100%",
            marginTop: "18px",
            padding: "14px 16px",
            borderRadius: "14px",
            border: "none",
            background: "linear-gradient(135deg, #f9a8d4, #e88fa3)",
            color: "white",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(232, 143, 163, 0.45)",
          }}
        >
          {t.splash.languageContinue}
        </button>
      </div>
    </div>
  );
}

function LanguageRow({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: "100%",
        padding: "14px",
        borderRadius: "12px",
        border: active ? "2px solid #e88fa3" : "1px solid #e5e7eb",
        backgroundColor: active ? "#fdf3f5" : "white",
        marginBottom: "10px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontSize: "15px", color: "#374151" }}>{label}</span>
      {active ? <span style={{ color: "#e88fa3", fontWeight: 700 }}>✓</span> : <span style={{ width: "14px" }} />}
    </button>
  );
}
