"use client";

import { type MouseEvent } from "react";
import type { HelpfulTopic } from "../data/helpfulInfo";
import { useLanguage } from "../i18n/LanguageContext";
import { getHelpfulTopicKeywords } from "../lib/helpfulTopicKeywords";
import { getLocalizedTopic, helpfulTopicTabSubtitle } from "../lib/localizeHelpfulLibrary";

interface HelpfulTipsAccordionListProps {
  topics: HelpfulTopic[];
  expandedTopicId: string | null;
  onTopicUrlChange: (topicId: string | null) => void;
  onOpenFullGuide: (topicId: string) => void;
  helpfulFavoriteKeys?: string[];
  /** 既定 `tips:`（お気に入りキーは `tips:${topic.id}`） */
  favoriteKeyPrefix?: string;
  onToggleHelpfulFavorite?: (favoriteKey: string) => void;
}

export default function HelpfulTipsAccordionList({
  topics,
  expandedTopicId,
  onTopicUrlChange,
  onOpenFullGuide,
  helpfulFavoriteKeys = [],
  favoriteKeyPrefix = "tips:",
  onToggleHelpfulFavorite,
}: HelpfulTipsAccordionListProps) {
  const { t, language } = useLanguage();

  const toggleTopic = (topic: HelpfulTopic, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (topic.guideSteps?.length) {
      onOpenFullGuide(topic.id);
      return;
    }
    const next = expandedTopicId === topic.id ? null : topic.id;
    onTopicUrlChange(next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {topics.map((topic) => {
        const loc = getLocalizedTopic(topic.id, t);
        const title = loc?.title ?? topic.title;
        const subtitle = helpfulTopicTabSubtitle(topic.id, t) || loc?.subtitle || topic.subtitle;
        const description = loc?.description ?? topic.description;
        const details = loc?.details ?? topic.details;
        const isStepGuide = Boolean(topic.guideSteps?.length);
        const expanded = !isStepGuide && expandedTopicId === topic.id;
        const favoriteKey = `${favoriteKeyPrefix}${topic.id}`;
        const isFav = helpfulFavoriteKeys.includes(favoriteKey);
        const keywords = getHelpfulTopicKeywords(topic.id, language);

        return (
          <article
            key={topic.id}
            style={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "22px",
              padding: "16px 18px",
              boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: expanded ? "12px" : "0",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "16px",
                  backgroundColor: "#fdf3f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  flexShrink: 0,
                }}
              >
                {topic.emoji}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "6px 8px",
                    rowGap: "6px",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#e88fa3", flexShrink: 0 }}>{subtitle}</span>
                  {keywords.map((kw, kwIndex) => (
                    <span
                      key={`${topic.id}-kw-${kwIndex}`}
                      style={{
                        display: "inline-block",
                        fontSize: "11px",
                        fontWeight: 700,
                        lineHeight: 1.3,
                        padding: "3px 8px",
                        borderRadius: "999px",
                        color: "#9f4060",
                        backgroundColor: "#fff5f8",
                        border: "1px solid #f9c4d8",
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: "16px", fontWeight: 800, color: "#111827", marginTop: "6px", marginBottom: 0 }}>
                  {title}
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.6", marginTop: "4px", marginBottom: 0 }}>
                  {description}
                </p>
              </div>
              </div>
              {onToggleHelpfulFavorite ? (
                <button
                  type="button"
                  aria-label={isFav ? t.manner.favoriteRemoveAria : t.manner.favoriteAddAria}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleHelpfulFavorite(favoriteKey);
                  }}
                  style={{
                    flexShrink: 0,
                    width: "44px",
                    height: "44px",
                    border: "none",
                    borderRadius: "14px",
                    background: "#fdf3f5",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={isFav ? "#e88fa3" : "none"} stroke={isFav ? "#e88fa3" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              ) : null}
            </div>

            {expanded ? (
              <>
                <div style={{ paddingLeft: "0" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#e88fa3", marginBottom: "4px", marginTop: 0 }}>
                    {t.manner.detailPointsLabel}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {details.map((detail, index) => (
                      <div
                        key={`${topic.id}-${index}`}
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
              aria-expanded={isStepGuide ? false : expanded}
              onClick={(e) => toggleTopic(topic, e)}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                alignSelf: "flex-start",
                marginTop: expanded ? "4px" : "2px",
                padding: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700,
                color: "#e88fa3",
              }}
            >
              {isStepGuide ? t.manner.detailSeeMore : expanded ? t.manner.detailSeeLess : t.manner.detailSeeMore}
            </button>
          </article>
        );
      })}
    </div>
  );
}
