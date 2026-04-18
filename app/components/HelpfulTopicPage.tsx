"use client";

import type { HelpfulTopic } from "../data/helpfulInfo";
import { useLanguage } from "../i18n/LanguageContext";
import { getLocalizedTopic } from "../lib/localizeHelpfulLibrary";

interface HelpfulTopicPageProps {
  topic: HelpfulTopic;
  onBack: () => void;
  onAskAi: (query: string) => void;
}

export default function HelpfulTopicPage({ topic, onBack, onAskAi }: HelpfulTopicPageProps) {
  const { t } = useLanguage();
  const loc = getLocalizedTopic(topic.id, t);
  const title = loc?.title ?? topic.title;
  const subtitle = loc?.subtitle ?? topic.subtitle;
  const description = loc?.description ?? topic.description;
  const details = loc?.details ?? topic.details;

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <button
        onClick={onBack}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: 700,
        }}
      >
        <span style={{ fontSize: "18px", lineHeight: 1 }}>←</span>
        {t.manner.detailBackToTips}
      </button>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "16px",
          border: "1px solid #f3f4f6",
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
            {topic.emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#e88fa3" }}>{subtitle}</p>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", lineHeight: "1.4", marginTop: "2px" }}>
              {title}
            </h2>
          </div>
        </div>
        <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.8", marginTop: "12px" }}>{description}</p>
      </div>

      <article
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "16px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
        }}
      >
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#e88fa3", marginBottom: "8px" }}>
          {t.manner.detailPointsLabel}
        </p>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {details.map((detail, index) => (
            <div
              key={`${topic.id}-${index}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: index === 0 ? "4px 0 12px" : "12px 0",
                borderTop: index === 0 ? "none" : "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "999px",
                  backgroundColor: "#e88fa3",
                  flexShrink: 0,
                  marginTop: "6px",
                }}
              />
              <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.75" }}>{detail}</p>
            </div>
          ))}
        </div>
      </article>

      <div
        style={{
          backgroundColor: "#fdf3f5",
          borderRadius: "20px",
          padding: "16px",
          border: "1px solid #f3d1da",
        }}
      >
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#e88fa3" }}>{t.manner.detailAskAiTopicTitle}</p>
        <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.8", marginTop: "6px" }}>
          {t.manner.detailAskAiTopicBody}
        </p>
        <button
          onClick={() => onAskAi(topic.aiPrompt)}
          style={{
            marginTop: "12px",
            borderRadius: "999px",
            backgroundColor: "#e88fa3",
            color: "white",
            padding: "10px 14px",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {t.manner.detailAskAiTopicCta}
        </button>
      </div>
    </div>
  );
}
