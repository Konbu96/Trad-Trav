"use client";

import { useLanguage } from "../i18n/LanguageContext";
import { getLocalizedGuideSteps, getLocalizedTopic } from "../lib/localizeHelpfulLibrary";

interface HelpfulGuideStepPageProps {
  topicId: string;
  emoji: string;
  onBack: () => void;
}

export default function HelpfulGuideStepPage({ topicId, emoji, onBack }: HelpfulGuideStepPageProps) {
  const { t } = useLanguage();
  const loc = getLocalizedTopic(topicId, t);
  const title = loc?.title ?? "";
  const subtitle = loc?.subtitle ?? "";
  const description = loc?.description ?? "";
  const steps = getLocalizedGuideSteps(topicId, t);

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "18px", paddingBottom: "28px" }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: 700,
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span style={{ fontSize: "18px", lineHeight: 1 }} aria-hidden>
          ←
        </span>
        {t.manner.detailBackToTips}
      </button>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "18px",
          padding: "14px 16px",
          border: "1px solid #f3f4f6",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              backgroundColor: "#fdf3f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}
            aria-hidden
          >
            {emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#e88fa3", margin: 0 }}>{subtitle}</p>
            <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#111827", margin: "6px 0 0", lineHeight: 1.35 }}>
              {title}
            </h2>
            {description ? (
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.7, margin: "8px 0 0" }}>{description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#e88fa3", margin: "0 0 10px 2px" }}>
          {t.manner.guideStepsHeading}
        </p>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0" }}>
          {steps.map((step, index) => (
            <li
              key={`${topicId}-step-${index}`}
              style={{
                display: "flex",
                gap: "14px",
                alignItems: "flex-start",
                paddingTop: index === 0 ? 0 : "18px",
                marginTop: index === 0 ? 0 : "18px",
                borderTop: index === 0 ? "none" : "1px solid #e5e7eb",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#111827", margin: "2px 0 0", lineHeight: 1.4 }}>
                  {step.heading}
                </h3>
                <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.75, margin: "8px 0 0" }}>{step.body}</p>
                {step.bullets.length > 0 ? (
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {step.bullets.map((line, bi) => (
                      <div
                        key={`${topicId}-step-${index}-b-${bi}`}
                        style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", lineHeight: 1.65 }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "999px",
                            backgroundColor: "#e88fa3",
                            flexShrink: 0,
                            marginTop: "calc(0.825em - 2.5px)",
                          }}
                        />
                        <span style={{ color: "#374151" }}>{line}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
