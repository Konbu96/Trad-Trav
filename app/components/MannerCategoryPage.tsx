"use client";

import { useCallback, useEffect, useState } from "react";
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
  /** お気に入りから開いたときに最初から展開する項目 */
  initialExpandedItemId?: string | null;
  helpfulFavoriteKeys?: string[];
  onToggleHelpfulFavorite?: (favoriteKey: string) => void;
  onTutorialAction?: (actionId: string) => void;
}

function mannerSceneLabel(scene: string, sceneLabels: Record<string, string>): string {
  return sceneLabels[scene] ?? scene;
}

export default function MannerCategoryPage({
  categoryId,
  onBack,
  onAskAi,
  initialExpandedItemId = null,
  helpfulFavoriteKeys = [],
  onToggleHelpfulFavorite,
  onTutorialAction,
}: MannerCategoryPageProps) {
  const { t, language } = useLanguage();
  const sceneLabels = t.manner.sceneLabels as Record<string, string>;
  const category = getLocalizedMannerCategory(categoryId, t);
  const categoryMeta = MANNER_CATEGORIES.find((c) => c.id === categoryId) ?? MANNER_CATEGORIES[0];
  const items = MANNER_ITEMS.filter((item) => item.categoryId === categoryId);
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(() =>
    initialExpandedItemId ? new Set([initialExpandedItemId]) : new Set()
  );

  useEffect(() => {
    if (initialExpandedItemId) {
      setExpandedItemIds(new Set([initialExpandedItemId]));
    } else {
      setExpandedItemIds(new Set());
    }
  }, [categoryId, initialExpandedItemId]);

  const toggleItemExpanded = useCallback((itemId: string) => {
    setExpandedItemIds((prev) => {
      if (prev.has(itemId)) return new Set();
      return new Set([itemId]);
    });
  }, []);

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <button
        type="button"
        data-tutorial-id="manner.category-back"
        onClick={() => {
          onTutorialAction?.("manner.category-back");
          onBack();
        }}
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

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {items.map((item, itemIndex) => {
        const loc = getLocalizedMannerItem(item.id, t, { language, base: item });
        const title = loc?.title ?? item.title;
        const shortDescription = loc?.shortDescription ?? item.shortDescription;
        const details = loc?.details ?? item.details;
        const expanded = expandedItemIds.has(item.id);
        const favoriteKey = `mannerItem:${item.id}`;
        const isFav = helpfulFavoriteKeys.includes(favoriteKey);
        return (
          <article
            key={item.id}
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "16px 18px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: expanded ? "12px" : "0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
                width: "100%",
                minWidth: 0,
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: "1.45",
                  margin: 0,
                  flex: "1 1 auto",
                  minWidth: 0,
                }}
              >
                {title}
              </h3>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flexShrink: 0 }}>
                {onToggleHelpfulFavorite ? (
                  <button
                    type="button"
                    aria-label={isFav ? t.manner.favoriteRemoveAria : t.manner.favoriteAddAria}
                    data-tutorial-id={itemIndex === 0 ? "manner.item-favorite" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (itemIndex === 0) {
                        onTutorialAction?.("manner.item-favorite");
                      }
                      onToggleHelpfulFavorite(favoriteKey);
                    }}
                    style={{
                      padding: "4px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill={isFav ? "#e88fa3" : "none"}
                      stroke={isFav ? "#e88fa3" : "#9ca3af"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                ) : null}
                <div
                  role="list"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    maxWidth: "200px",
                  }}
                >
                  {item.scenes.map((scene) => (
                    <span
                      key={scene}
                      role="listitem"
                      style={{
                        display: "inline-block",
                        fontSize: "11px",
                        fontWeight: 700,
                        lineHeight: 1.3,
                        padding: "4px 9px",
                        borderRadius: "999px",
                        color: "#9f4060",
                        backgroundColor: "#fff5f8",
                        border: "1px solid #f9c4d8",
                        boxShadow: "0 1px 0 rgba(255, 182, 193, 0.35)",
                      }}
                    >
                      {mannerSceneLabel(scene, sceneLabels)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {expanded ? (
              <>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#e88fa3", marginBottom: "4px" }}>
                    {t.manner.detailContentLabel}
                  </p>
                  <p style={{ fontSize: "14px", color: "#1f2937", lineHeight: "1.8", margin: 0 }}>{shortDescription}</p>
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
                          gap: "8px",
                          fontSize: "13px",
                          lineHeight: "1.75",
                          padding: index === 0 ? "4px 0 12px" : "12px 0",
                          borderTop: index === 0 ? "none" : "1px solid #e5e7eb",
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "999px",
                            backgroundColor: "#e88fa3",
                            flexShrink: 0,
                            marginTop: "calc(0.875em - 2.5px)",
                          }}
                        />
                        <p style={{ flex: 1, minWidth: 0, color: "#374151", margin: 0 }}>{detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            <button
              type="button"
              aria-expanded={expanded}
              data-tutorial-id={itemIndex === 0 ? "manner.item-see-more" : undefined}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (itemIndex === 0) {
                  onTutorialAction?.("manner.item-see-more");
                }
                toggleItemExpanded(item.id);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              style={{
                alignSelf: "flex-start",
                marginTop: expanded ? "2px" : "4px",
                padding: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700,
                color: "#e88fa3",
              }}
            >
              {expanded ? t.manner.detailSeeLess : t.manner.detailSeeMore}
            </button>
          </article>
        );
      })}
      </div>

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
