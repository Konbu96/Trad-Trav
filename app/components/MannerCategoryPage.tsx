"use client";

import {
  MANNER_CATEGORIES,
  MANNER_ITEMS,
  MANNER_CATEGORY_AI_QUERY,
  type MannerCategoryId,
} from "../data/manners";
import { useLanguage } from "../i18n/LanguageContext";
import { getLocalizedMannerCategory, getLocalizedMannerItem } from "../lib/localizeHelpfulLibrary";

interface MannerCategoryPageProps {
  categoryId: MannerCategoryId;
  onBack: () => void;
  onAskAi: (query: string) => void;
}

export default function MannerCategoryPage({ categoryId, onBack, onAskAi }: MannerCategoryPageProps) {
  const { t } = useLanguage();
  const category = getLocalizedMannerCategory(categoryId, t);
  const categoryMeta = MANNER_CATEGORIES.find((c) => c.id === categoryId) ?? MANNER_CATEGORIES[0];
  const items = MANNER_ITEMS.filter((item) => item.categoryId === categoryId);

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
          borderRadius: "18px",
          padding: "12px 14px",
          border: "1px solid #f3f4f6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "12px",
              backgroundColor: "#fdf3f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            {categoryMeta.emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6" }}>{category.description}</p>
          </div>
        </div>
      </div>

      {items.map((item) => {
        const loc = getLocalizedMannerItem(item.id, t);
        const title = loc?.title ?? item.title;
        const shortDescription = loc?.shortDescription ?? item.shortDescription;
        const details = loc?.details ?? item.details;
        return (
          <article
            key={item.id}
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "16px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "10px",
                  backgroundColor: "#fdf3f5",
                  color: "#e88fa3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                !
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111827", lineHeight: "1.4" }}>{title}</h3>
              </div>
            </div>

            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#e88fa3", marginBottom: "4px" }}>
                {t.manner.detailContentLabel}
              </p>
              <p style={{ fontSize: "14px", color: "#1f2937", lineHeight: "1.8" }}>{shortDescription}</p>
            </div>

            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#e88fa3", marginBottom: "8px" }}>
                {t.manner.detailPointsLabel}
              </p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {details.map((detail, index) => (
                  <div
                    key={`${item.id}-${index}`}
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
            </div>
          </article>
        );
      })}

      <div
        style={{
          backgroundColor: "#fdf3f5",
          borderRadius: "20px",
          padding: "16px",
          border: "1px solid #f3d1da",
        }}
      >
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#e88fa3" }}>{t.manner.detailAskAiCategoryTitle}</p>
        <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.8", marginTop: "6px" }}>
          {t.manner.detailAskAiCategoryBody}
        </p>
        <button
          onClick={() => onAskAi(MANNER_CATEGORY_AI_QUERY[categoryId])}
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
          {t.manner.detailAskAiCategoryCta}
        </button>
      </div>
    </div>
  );
}
