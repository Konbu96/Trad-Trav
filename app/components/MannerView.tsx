"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { CloseIcon, SearchIcon } from "./icons";
import HelpfulAiMarkdown from "./HelpfulAiMarkdown";
import HelpfulGuideStepPage from "./HelpfulGuideStepPage";
import HelpfulTipsAccordionList from "./HelpfulTipsAccordionList";
import MannerCategoryPage from "./MannerCategoryPage";
import type { LocationPermissionState } from "../page";
import { useLanguage } from "../i18n/LanguageContext";
import { getAiKeywordChips } from "../data/helpfulAiKeywords";
import { MANNER_QUICK_QUESTIONS } from "../data/manners";
import {
  HELPFUL_TABS,
  TIPS_TOPICS,
  getHelpfulCards,
  getHelpfulDetail,
  normalizeGuideDetailKey,
  type HelpfulDetail,
  type HelpfulTabId,
} from "../data/helpfulInfo";
import { getLocalizedHelpfulDetailTitle, localizeHelpfulCard } from "../lib/localizeHelpfulLibrary";

export type MannerTutorialHandle = {
  applyTutorialAutomation: (targetId: string) => void;
};

interface MannerViewProps {
  spotName?: string | null;
  locationPermissionState?: LocationPermissionState;
  isUsingMockLocation?: boolean;
  preferredTab?: HelpfulTabId | null;
  onPreferredTabApplied?: () => void;
  onTutorialAction?: (actionId: string) => void;
  helpfulFavoriteKeys?: string[];
  onToggleHelpfulFavorite?: (favoriteKey: string) => void;
}

type HelperMessage = {
  role: "assistant" | "user";
  text: string;
};

const DETAIL_ANIMATION_MS = 280;

function isTopicStepGuideDetail(detail: HelpfulDetail | null): detail is Extract<HelpfulDetail, { kind: "topic" }> {
  return detail?.kind === "topic" && Boolean(detail.topic.guideSteps?.length);
}

function tabParamToHelpfulTabId(value: string | null): HelpfulTabId {
  if (value === "manner") return "manner";
  if (value === "trivia") return "trivia";
  if (value === "guide") return "guide";
  if (value === "tips" || value === "travel") return "trivia";
  return "manner";
}

const TUTORIAL_FIRST_MANNER_ITEM_KEY = "mannerItem:meal-before-greeting";

const MannerView = forwardRef<MannerTutorialHandle, MannerViewProps>(function MannerView(
  {
    spotName,
    locationPermissionState = "idle",
    isUsingMockLocation = false,
    preferredTab = null,
    onPreferredTabApplied,
    onTutorialAction,
    helpfulFavoriteKeys = [],
    onToggleHelpfulFavorite,
  },
  ref
) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTabParam = searchParams.get("guideTab");
  const legacyMannerParam = searchParams.get("manner");
  const selectedDetailParam = searchParams.get("guideDetail") || (legacyMannerParam ? `manner:${legacyMannerParam}` : null);

  const [activeTab, setActiveTab] = useState<HelpfulTabId>(() => tabParamToHelpfulTabId(selectedTabParam));
  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [helperMessages, setHelperMessages] = useState<HelperMessage[]>([]);
  const [helperLoading, setHelperLoading] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const visibleDetailRef = useRef<HelpfulDetail | null>(null);
  const isClosingDetailRef = useRef(false);
  const [visibleDetail, setVisibleDetail] = useState<HelpfulDetail | null>(() => {
    const d = getHelpfulDetail(selectedDetailParam);
    if (d?.kind === "manner" || d?.kind === "mannerItem") return d;
    if (isTopicStepGuideDetail(d)) return d;
    return null;
  });
  const [isClosingDetail, setIsClosingDetail] = useState(false);
  const selectedDetail = visibleDetail ?? getHelpfulDetail(selectedDetailParam);
  const expandedTipsTopicId =
    selectedDetail?.kind === "topic" && !selectedDetail.topic.guideSteps?.length ? selectedDetail.topic.id : null;
  const blocksMainScroll =
    selectedDetail?.kind === "manner" || selectedDetail?.kind === "mannerItem" || isTopicStepGuideDetail(selectedDetail);
  const activeCards = useMemo(
    () =>
      getHelpfulCards(activeTab).map((card) => ({
        ...card,
        ...localizeHelpfulCard(card.key, t, language),
      })),
    [activeTab, t, language]
  );

  const accordionTopics = useMemo(
    () =>
      activeTab === "trivia" || activeTab === "guide"
        ? TIPS_TOPICS.filter((topic) => topic.tabId === activeTab)
        : [],
    [activeTab]
  );

  useEffect(() => {
    setHelperMessages([{ role: "assistant", text: t.manner.aiStubDisclaimer }]);
  }, [t.manner.aiStubDisclaimer]);

  useEffect(() => {
    setActiveTab(tabParamToHelpfulTabId(selectedTabParam));
  }, [selectedTabParam]);

  useEffect(() => {
    const detail = getHelpfulDetail(selectedDetailParam);
    if (detail?.kind === "topic") {
      setActiveTab(detail.topic.tabId);
    } else if (detail?.kind === "manner" || detail?.kind === "mannerItem") {
      setActiveTab("manner");
    }
  }, [selectedDetailParam]);

  useEffect(() => {
    if (isClosingDetail) return;
    const d = getHelpfulDetail(selectedDetailParam);
    if (!d) return;
    if (d.kind === "manner" || d.kind === "mannerItem") {
      setVisibleDetail(d);
      setIsClosingDetail(false);
      return;
    }
    if (d.kind === "topic" && d.topic.guideSteps && d.topic.guideSteps.length > 0) {
      setVisibleDetail(d);
      setIsClosingDetail(false);
      return;
    }
    if (d.kind === "topic") {
      setVisibleDetail(null);
    }
  }, [selectedDetailParam, isClosingDetail]);

  useEffect(() => {
    if (!preferredTab) return;

    setActiveTab(preferredTab);
    setVisibleDetail(null);
    setIsClosingDetail(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("guideTab", preferredTab);
    params.delete("guideDetail");
    params.delete("manner");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
    onPreferredTabApplied?.();
  }, [onPreferredTabApplied, pathname, preferredTab, router, searchParams]);

  useEffect(() => {
    visibleDetailRef.current = visibleDetail;
    isClosingDetailRef.current = isClosingDetail;
  }, [visibleDetail, isClosingDetail]);

  useEffect(() => () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const nextTabParam = params.get("guideTab");
      setActiveTab(tabParamToHelpfulTabId(nextTabParam));

      const nextDetailParam = params.get("guideDetail") || (params.get("manner") ? `manner:${params.get("manner")}` : null);
      const nextDetail = getHelpfulDetail(nextDetailParam);

      if (!nextDetail && visibleDetailRef.current && !isClosingDetailRef.current) {
        setIsClosingDetail(true);
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
        }
        closeTimerRef.current = window.setTimeout(() => {
          setVisibleDetail(null);
          setIsClosingDetail(false);
          closeTimerRef.current = null;
        }, DETAIL_ANIMATION_MS);
        return;
      }

      if (nextDetail) {
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        if (nextDetail.kind === "manner" || nextDetail.kind === "mannerItem" || isTopicStepGuideDetail(nextDetail)) {
          setVisibleDetail(nextDetail);
        } else {
          setVisibleDetail(null);
        }
        setIsClosingDetail(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleChangeTab = (nextTab: HelpfulTabId) => {
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("guideTab", nextTab);
    params.delete("guideDetail");
    params.delete("manner");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const openDetailPage = (detailKey: string) => {
    const normalizedKey = normalizeGuideDetailKey(detailKey);
    const nextDetail = getHelpfulDetail(normalizedKey);
    if (!nextDetail) return;

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (nextDetail.kind === "topic") {
      const topicTab = nextDetail.topic.tabId;
      setActiveTab(topicTab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("guideTab", topicTab);
      params.set("guideDetail", normalizedKey);
      params.delete("manner");
      const nextUrl = `${pathname}?${params.toString()}`;
      if (nextDetail.topic.guideSteps?.length) {
        setVisibleDetail(nextDetail);
        setIsClosingDetail(false);
        router.push(nextUrl, { scroll: false });
      } else {
        setVisibleDetail(null);
        setIsClosingDetail(false);
        router.replace(nextUrl, { scroll: false });
      }
      return;
    }

    setActiveTab("manner");
    setVisibleDetail(nextDetail);
    setIsClosingDetail(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("guideTab", "manner");
    params.set("guideDetail", normalizedKey);
    params.delete("manner");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const setTipsExpandedInUrl = (topicId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    const topicTab: HelpfulTabId =
      topicId != null
        ? (TIPS_TOPICS.find((x) => x.id === topicId)?.tabId ?? "trivia")
        : activeTab === "trivia" || activeTab === "guide"
          ? activeTab
          : "trivia";
    params.set("guideTab", topicTab);
    if (topicId) params.set("guideDetail", `tips:${topicId}`);
    else params.delete("guideDetail");
    params.delete("manner");
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, { scroll: false });
  };

  const closeDetailPage = () => {
    setIsClosingDetail(true);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("guideDetail");
      params.delete("manner");
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      setVisibleDetail(null);
      setIsClosingDetail(false);
      router.replace(nextUrl, { scroll: false });
      closeTimerRef.current = null;
    }, DETAIL_ANIMATION_MS);
  };

  useImperativeHandle(
    ref,
    () => ({
      applyTutorialAutomation(targetId: string) {
        switch (targetId) {
          case "nav.manner":
            return;
          case "manner.tab.manner":
            handleChangeTab("manner");
            return;
          case "manner.open-first-category": {
            const first = getHelpfulCards("manner")[0];
            if (first) openDetailPage(first.key);
            return;
          }
          case "manner.item-see-more":
            openDetailPage(TUTORIAL_FIRST_MANNER_ITEM_KEY);
            return;
          case "manner.item-favorite":
            onToggleHelpfulFavorite?.(TUTORIAL_FIRST_MANNER_ITEM_KEY);
            return;
          case "manner.category-back":
            closeDetailPage();
            return;
          case "manner.tab.trivia":
            handleChangeTab("trivia");
            return;
          case "manner.tab.guide":
            handleChangeTab("guide");
            return;
          case "manner.ai-button":
            setIsHelperOpen(true);
            return;
          default:
            return;
        }
      },
    }),
    [closeDetailPage, handleChangeTab, onToggleHelpfulFavorite, openDetailPage]
  );

  const handleAskHelper = async (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (!trimmed || helperLoading) return;

    const userMessage: HelperMessage = { role: "user", text: trimmed };
    const historyForRequest = [...helperMessages, userMessage];

    setHelperLoading(true);
    setHelperMessages(historyForRequest);
    setQuery("");
    setIsHelperOpen(true);

    if (process.env.NODE_ENV === "development") {
      console.info("[Helpful AI]", t.manner.aiReplying, trimmed.slice(0, 120));
    }

    try {
      const res = await fetch("/api/helpful-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForRequest.map((m) => ({ role: m.role, content: m.text })),
          language,
          spotName: spotName ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };

      if (!res.ok) {
        const errText =
          res.status === 503 && data.error === "missing_key" ? t.manner.aiErrorNoKey : t.manner.aiErrorGeneric;
        setHelperMessages((prev) => [...prev, { role: "assistant", text: errText }]);
        return;
      }

      setHelperMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply?.trim() || t.manner.aiErrorGeneric },
      ]);
    } catch {
      setHelperMessages((prev) => [...prev, { role: "assistant", text: t.manner.aiErrorNetwork }]);
    } finally {
      setHelperLoading(false);
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#f8fafc", overflow: "hidden" }}>
      <style jsx>{`
        @keyframes mannerSlideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes mannerSlideOutToRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }

        @keyframes aiReplyingPulse {
          0%,
          100% {
            opacity: 0.45;
          }
          50% {
            opacity: 1;
          }
        }

        .ai-replying-hint {
          animation: aiReplyingPulse 1.1s ease-in-out infinite;
        }

        .helpful-ai-md :global(p:last-child) {
          margin-bottom: 0;
        }
      `}</style>

      <div
        style={{
          height: "100%",
          overflowY: "auto",
          paddingBottom: "120px",
          pointerEvents: blocksMainScroll ? "none" : "auto",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
            minHeight: "92px",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "white", textAlign: "center" }}>
            {t.manner.pageTitle}
          </h1>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {(locationPermissionState === "granted" || spotName) && (
            <div
              style={{
                backgroundColor: "#fdf3f5",
                borderRadius: "18px",
                padding: "14px",
                border: "1px solid #f3d1da",
              }}
            >
              {locationPermissionState === "granted" && (
                <>
                  <p style={{ fontSize: "13px", color: "#b85f74", lineHeight: "1.7" }}>{t.manner.lead}</p>
                  <p style={{ fontSize: "12px", color: "#166534", lineHeight: "1.6", marginTop: "8px", fontWeight: 700 }}>
                    {isUsingMockLocation ? t.manner.mockLocationNote : t.manner.grantedLocationNote}
                  </p>
                </>
              )}
              {spotName && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#7c3aed",
                    fontWeight: 700,
                    marginTop: locationPermissionState === "granted" ? "6px" : 0,
                  }}
                >
                  {t.manner.spotLinked.replace("{name}", spotName)}
                </p>
              )}
            </div>
          )}

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "22px",
              padding: "8px",
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "8px",
              border: "1px solid #f7dfe5",
              boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
            }}
          >
            {HELPFUL_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const tabLabel =
                tab.id === "manner"
                  ? t.manner.badgeManner
                  : tab.id === "guide"
                    ? t.manner.badgeGuide
                    : t.manner.badgeTrivia;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onTutorialAction?.(`manner.tab.${tab.id}`);
                    handleChangeTab(tab.id);
                  }}
                  data-tutorial-id={`manner.tab.${tab.id}`}
                  style={{
                    borderRadius: "16px",
                    padding: "10px 6px",
                    backgroundColor: isActive ? "#e88fa3" : "#fdf3f5",
                    color: isActive ? "white" : "#b85f74",
                    fontSize: "12px",
                    fontWeight: 700,
                    boxShadow: isActive ? "0 8px 18px rgba(236,72,153,0.2)" : "none",
                  }}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeTab === "manner" ? (
              activeCards.map((card, cardIndex) => (
                <button
                  key={card.key}
                  type="button"
                  data-tutorial-id={cardIndex === 0 ? "manner.open-first-category" : undefined}
                  onClick={() => {
                    if (cardIndex === 0) {
                      onTutorialAction?.("manner.open-first-category");
                    }
                    openDetailPage(card.key);
                  }}
                  style={{
                    textAlign: "left",
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "22px",
                    boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
                    padding: "16px 12px 16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
                    cursor: "pointer",
                    minWidth: 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
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
                      {card.emoji}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "#e88fa3" }}>{card.subtitle}</p>
                      <p style={{ fontSize: "16px", fontWeight: 800, color: "#111827", marginTop: "2px" }}>{card.title}</p>
                      <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.6", marginTop: "4px" }}>
                        {card.description}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "18px", color: "#e88fa3", flexShrink: 0 }}>&gt;</span>
                </button>
              ))
            ) : (
              <HelpfulTipsAccordionList
                topics={accordionTopics}
                expandedTopicId={expandedTipsTopicId}
                onTopicUrlChange={setTipsExpandedInUrl}
                onOpenFullGuide={(topicId) => openDetailPage(`tips:${topicId}`)}
                helpfulFavoriteKeys={helpfulFavoriteKeys}
                favoriteKeyPrefix="tips:"
                onToggleHelpfulFavorite={onToggleHelpfulFavorite}
              />
            )}
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "16px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
            }}
          >
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#e88fa3" }}>{t.manner.aiHowTitle}</p>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>{t.manner.aiHowHeadline}</h3>
            <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.8", marginTop: "8px" }}>{t.manner.aiHowDescription}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
              {MANNER_QUICK_QUESTIONS.map((canonical, i) => {
                const label = t.manner.quickQuestions[i] ?? canonical;
                return (
                  <button
                    key={`manner-quick-${i}`}
                    type="button"
                    disabled={helperLoading}
                    onClick={() => void handleAskHelper(label)}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid #f3d1da",
                      backgroundColor: "#fdf3f5",
                      color: "#b85f74",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      opacity: helperLoading ? 0.55 : 1,
                      cursor: helperLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {(selectedDetail?.kind === "manner" || selectedDetail?.kind === "mannerItem") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#f8fafc",
            overflowY: "auto",
            paddingBottom: "120px",
            animation: isClosingDetail
              ? "mannerSlideOutToRight 0.28s ease forwards"
              : "mannerSlideInFromRight 0.28s ease forwards",
            zIndex: 40,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
              minHeight: "92px",
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "white", textAlign: "center" }}>
              {getLocalizedHelpfulDetailTitle(selectedDetail, t, { language })}
            </h1>
          </div>

          <MannerCategoryPage
            key={selectedDetail.key}
            categoryId={selectedDetail.categoryId}
            initialExpandedItemId={selectedDetail.kind === "mannerItem" ? selectedDetail.itemId : null}
            helpfulFavoriteKeys={helpfulFavoriteKeys}
            onToggleHelpfulFavorite={onToggleHelpfulFavorite}
            onBack={closeDetailPage}
            onAskAi={handleAskHelper}
            onTutorialAction={onTutorialAction}
          />
        </div>
      )}

      {isTopicStepGuideDetail(selectedDetail) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#f8fafc",
            overflowY: "auto",
            paddingBottom: "120px",
            animation: isClosingDetail
              ? "mannerSlideOutToRight 0.28s ease forwards"
              : "mannerSlideInFromRight 0.28s ease forwards",
            zIndex: 40,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
              minHeight: "92px",
              padding: "0 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "white", textAlign: "center" }}>
              {getLocalizedHelpfulDetailTitle(selectedDetail, t, { language })}
            </h1>
          </div>

          <HelpfulGuideStepPage
            key={selectedDetail.key}
            topicId={selectedDetail.topic.id}
            emoji={selectedDetail.emoji}
            onBack={closeDetailPage}
          />
        </div>
      )}

      <button
        onClick={() => {
          onTutorialAction?.("manner.ai-button");
          setIsHelperOpen(true);
        }}
        data-tutorial-id="manner.ai-button"
        style={{
          position: "absolute",
          right: "20px",
          bottom: "96px",
          width: "64px",
          height: "64px",
          borderRadius: "999px",
          background: "linear-gradient(135deg, #e88fa3 0%, #cc8ab2 100%)",
          color: "white",
          boxShadow: "0 16px 36px rgba(236,72,153,0.32)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          zIndex: blocksMainScroll ? 15 : 20,
          pointerEvents: blocksMainScroll ? "none" : "auto",
        }}
      >
        <span style={{ fontSize: "20px", lineHeight: 1 }}>AI</span>
        <span style={{ fontSize: "10px", fontWeight: 700 }}>{t.manner.helpFab}</span>
      </button>

      {isHelperOpen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 55,
            backgroundColor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
              padding: "14px 16px 16px",
              paddingTop: "max(14px, env(safe-area-inset-top))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: 0 }}>
                {t.manner.aiSheetTitle}
              </p>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "white",
                  margin: "4px 0 0",
                  lineHeight: 1.35,
                }}
              >
                {t.manner.aiSheetSubtitle}
              </h2>
            </div>
            <button
              type="button"
              aria-label={t.common.close}
              onClick={() => setIsHelperOpen(false)}
              style={{
                flexShrink: 0,
                border: "none",
                background: "rgba(255,255,255,0.25)",
                borderRadius: "12px",
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloseIcon size={22} color="white" />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              display: "flex",
              flexDirection: "column",
              gap: 0,
              paddingBottom: "12px",
            }}
          >
            <div
              style={{
                flexShrink: 0,
                padding: "12px 16px 16px",
                backgroundColor: "white",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <p style={{ fontSize: "11px", fontWeight: 800, color: "#b85f74", margin: "0 0 8px 2px", letterSpacing: "0.02em" }}>
                {t.manner.aiKeywordSectionTitle}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {getAiKeywordChips(language).map((chip, i) => (
                  <button
                    key={`kw-${i}-${chip.label}`}
                    type="button"
                    disabled={helperLoading}
                    onClick={() => void handleAskHelper(chip.query)}
                    style={{
                      borderRadius: "999px",
                      border: "1px solid #f3d1da",
                      backgroundColor: "#fdf3f5",
                      color: "#9f4060",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      opacity: helperLoading ? 0.55 : 1,
                      cursor: helperLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#b85f74",
                  margin: "16px 0 8px 2px",
                  letterSpacing: "0.02em",
                }}
              >
                {t.manner.aiQuickSectionTitle}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {MANNER_QUICK_QUESTIONS.map((canonical, i) => {
                  const label = t.manner.quickQuestions[i] ?? canonical;
                  return (
                    <button
                      key={`sheet-quick-${i}`}
                      type="button"
                      disabled={helperLoading}
                      onClick={() => void handleAskHelper(label)}
                      style={{
                        borderRadius: "999px",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#f8fafc",
                        color: "#374151",
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        opacity: helperLoading ? 0.55 : 1,
                        cursor: helperLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                padding: "16px 16px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#b85f74",
                  margin: "0 0 2px 2px",
                  letterSpacing: "0.02em",
                }}
              >
                {t.manner.aiConversationSectionTitle}
              </p>
              {helperMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    alignSelf: message.role === "user" ? "flex-end" : "stretch",
                    backgroundColor: message.role === "user" ? "#e88fa3" : "#f3f4f6",
                    color: message.role === "user" ? "white" : "#374151",
                    borderRadius: "18px",
                    padding: "12px 14px",
                    fontSize: "14px",
                    lineHeight: "1.7",
                    whiteSpace: message.role === "user" ? "pre-line" : "normal",
                    maxWidth: message.role === "user" ? "88%" : "100%",
                  }}
                >
                  {message.role === "user" ? (
                    message.text
                  ) : (
                    <div className="helpful-ai-md">
                      <HelpfulAiMarkdown text={message.text} />
                    </div>
                  )}
                </div>
              ))}
              {helperLoading ? (
                <div
                  className="ai-replying-hint"
                  role="status"
                  aria-live="polite"
                  style={{
                    alignSelf: "stretch",
                    borderRadius: "14px",
                    border: "1px dashed #d1d5db",
                    backgroundColor: "#fafafa",
                    padding: "12px 14px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#6b7280",
                  }}
                >
                  {t.manner.aiReplying}
                </div>
              ) : null}
            </div>
          </div>

          <div
            style={{
              flexShrink: 0,
              padding: "10px 16px 16px",
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              backgroundColor: "white",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: "1px solid #e5e7eb",
                borderRadius: "18px",
                padding: "10px 12px",
              }}
            >
              <SearchIcon size={18} color="#9ca3af" />
              <input
                value={query}
                disabled={helperLoading}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleAskHelper(query);
                  }
                }}
                placeholder={t.manner.aiInputPlaceholder}
                style={{
                  flex: 1,
                  outline: "none",
                  border: "none",
                  fontSize: "14px",
                  color: "#111827",
                  opacity: helperLoading ? 0.7 : 1,
                }}
              />
              <button
                type="button"
                disabled={helperLoading}
                onClick={() => void handleAskHelper(query)}
                style={{
                  borderRadius: "999px",
                  backgroundColor: "#e88fa3",
                  color: "white",
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  opacity: helperLoading ? 0.75 : 1,
                  cursor: helperLoading ? "not-allowed" : "pointer",
                }}
              >
                {helperLoading ? t.common.loading : t.manner.send}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default MannerView;
