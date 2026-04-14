"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CloseIcon, SearchIcon } from "./icons";
import HelpfulTopicPage from "./HelpfulTopicPage";
import MannerCategoryPage from "./MannerCategoryPage";
import type { LocationPermissionState } from "../page";
import { MANNER_QUICK_QUESTIONS, searchMannerItems } from "../data/manners";
import {
  HELPFUL_TABS,
  TRAVEL_GUIDE_TOPICS,
  TRIVIA_TOPICS,
  getHelpfulCards,
  getHelpfulDetail,
  type HelpfulDetail,
  type HelpfulTabId,
} from "../data/helpfulInfo";

interface MannerViewProps {
  spotName?: string | null;
  locationPermissionState?: LocationPermissionState;
  isUsingMockLocation?: boolean;
  onOpenLocationSettings?: () => void;
  preferredTab?: HelpfulTabId | null;
  onPreferredTabApplied?: () => void;
  onTutorialAction?: (actionId: string) => void;
}

type HelperMessage = {
  role: "assistant" | "user";
  text: string;
};

type HelperResult = {
  title: string;
  description: string;
  badge: string;
};

const DETAIL_ANIMATION_MS = 280;

function isHelpfulTabId(value: string | null): value is HelpfulTabId {
  return value === "manner" || value === "trivia" || value === "travel";
}

function searchHelpfulTopics(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return [...TRIVIA_TOPICS, ...TRAVEL_GUIDE_TOPICS].filter((topic) => {
    const haystacks = [
      topic.title,
      topic.subtitle,
      topic.description,
      ...topic.details,
      ...topic.keywords,
    ].map((value) => value.toLowerCase());

    return haystacks.some((value) => value.includes(normalized));
  });
}

function getHelperReply(query: string, spotName?: string | null) {
  const matchedItems = searchMannerItems(query).slice(0, 3);
  const matchedTopics = searchHelpfulTopics(query).slice(0, 2);
  const intro = spotName
    ? `「${spotName}」に行く前提で、いま役立ちそうな情報をまとめます。`
    : "いまの質問に近いお役立ち情報をまとめます。";

  const helperResults: HelperResult[] = [
    ...matchedItems.map((item) => ({
      title: item.title,
      description: item.shortDescription,
      badge: "マナー",
    })),
    ...matchedTopics.map((topic) => ({
      title: topic.title,
      description: topic.description,
      badge: topic.tabId === "trivia" ? "豆知識" : "旅ガイド",
    })),
  ];

  if (helperResults.length === 0) {
    return {
      text: `${intro} 仮実装のため、まずは「写真」「電車」「体験」「祭り」「豆知識」などで聞いてみてください。`,
      items: [],
    };
  }

  const summary = helperResults
    .map((item) => `・${item.badge} | ${item.title}: ${item.description}`)
    .join("\n");

  return {
    text: `${intro}\n${summary}`,
    items: helperResults,
  };
}

export default function MannerView({
  spotName,
  locationPermissionState = "idle",
  isUsingMockLocation = false,
  onOpenLocationSettings,
  preferredTab = null,
  onPreferredTabApplied,
  onTutorialAction,
}: MannerViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTabParam = searchParams.get("guideTab");
  const legacyMannerParam = searchParams.get("manner");
  const selectedDetailParam = searchParams.get("guideDetail") || (legacyMannerParam ? `manner:${legacyMannerParam}` : null);

  const [activeTab, setActiveTab] = useState<HelpfulTabId>(isHelpfulTabId(selectedTabParam) ? selectedTabParam : "manner");
  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [helperMessages, setHelperMessages] = useState<HelperMessage[]>([
    {
      role: "assistant",
      text: "お役立ちAIは仮実装です。いまはマナー、豆知識、旅ガイドの内容を中心に案内できます。",
    },
  ]);
  const [helperResults, setHelperResults] = useState<HelperResult[]>([]);
  const closeTimerRef = useRef<number | null>(null);
  const visibleDetailRef = useRef<HelpfulDetail | null>(null);
  const isClosingDetailRef = useRef(false);
  const [visibleDetail, setVisibleDetail] = useState<HelpfulDetail | null>(getHelpfulDetail(selectedDetailParam));
  const [isClosingDetail, setIsClosingDetail] = useState(false);
  const selectedDetail = visibleDetail ?? getHelpfulDetail(selectedDetailParam);
  const activeCards = useMemo(() => getHelpfulCards(activeTab), [activeTab]);

  useEffect(() => {
    if (isHelpfulTabId(selectedTabParam)) {
      setActiveTab(selectedTabParam);
    }
  }, [selectedTabParam]);

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
      if (isHelpfulTabId(nextTabParam)) {
        setActiveTab(nextTabParam);
      }

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
        setVisibleDetail(nextDetail);
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
    const nextDetail = getHelpfulDetail(detailKey);
    if (!nextDetail) return;

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const nextTab = detailKey.startsWith("trivia:") ? "trivia" : detailKey.startsWith("travel:") ? "travel" : "manner";
    setActiveTab(nextTab);
    setVisibleDetail(nextDetail);
    setIsClosingDetail(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("guideTab", nextTab);
    params.set("guideDetail", detailKey);
    params.delete("manner");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
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

  const handleAskHelper = (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;

    const reply = getHelperReply(trimmed, spotName);
    setHelperMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply.text },
    ]);
    setHelperResults(reply.items);
    setQuery("");
    setIsHelperOpen(true);
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
      `}</style>

      <div style={{ height: "100%", overflowY: "auto", paddingBottom: "120px" }}>
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
            お役立ち情報
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
                  <p style={{ fontSize: "13px", color: "#b85f74", lineHeight: "1.7" }}>
                    状況に合わせたマナーやガイド情報を表示しています。
                  </p>
                  <p style={{ fontSize: "12px", color: "#166534", lineHeight: "1.6", marginTop: "8px", fontWeight: 700 }}>
                    {isUsingMockLocation ? "現在は仙台市の仮位置を使用しています。" : "現在地の利用が許可されています。"}
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
                  スポット連携中: {spotName}
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
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTutorialAction?.(`manner.tab.${tab.id}`);
                    handleChangeTab(tab.id);
                  }}
                  data-tutorial-id={`manner.tab.${tab.id}`}
                  style={{
                    borderRadius: "16px",
                    padding: "11px 8px",
                    backgroundColor: isActive ? "#e88fa3" : "#fdf3f5",
                    color: isActive ? "white" : "#b85f74",
                    fontSize: "13px",
                    fontWeight: 700,
                    boxShadow: isActive ? "0 8px 18px rgba(236,72,153,0.2)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeCards.map((card) => (
              <button
                key={card.key}
                onClick={() => openDetailPage(card.key)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "22px",
                  padding: "16px 18px",
                  boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "14px",
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
            ))}
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
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#e88fa3" }}>AIヘルプの使い方</p>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>
              気になることはAIに質問
            </h3>
            <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.8", marginTop: "8px" }}>
              右下のボタンから開けます。仮実装では、入力内容に近いマナーや豆知識、旅のヒントを返します。
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
              {MANNER_QUICK_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleAskHelper(question)}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid #f3d1da",
                    backgroundColor: "#fdf3f5",
                    color: "#b85f74",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedDetail && (
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
            zIndex: 10,
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
              {selectedDetail.title}
            </h1>
          </div>

          {selectedDetail.kind === "manner" ? (
            <MannerCategoryPage
              categoryId={selectedDetail.categoryId}
              onBack={closeDetailPage}
              onAskAi={handleAskHelper}
            />
          ) : (
            <HelpfulTopicPage
              topic={selectedDetail.topic}
              onBack={closeDetailPage}
              onAskAi={handleAskHelper}
            />
          )}
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
        }}
      >
        <span style={{ fontSize: "20px", lineHeight: 1 }}>AI</span>
        <span style={{ fontSize: "10px", fontWeight: 700 }}>ヘルプ</span>
      </button>

      {isHelperOpen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.28)",
            display: "flex",
            alignItems: "flex-end",
          }}
          onClick={() => setIsHelperOpen(false)}
        >
          <div
            style={{
              width: "100%",
              backgroundColor: "white",
              borderTopLeftRadius: "28px",
              borderTopRightRadius: "28px",
              padding: "18px 16px 20px",
              maxHeight: "72vh",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#e88fa3" }}>お役立ちAI</p>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>
                  質問しながら情報検索
                </h3>
              </div>
              <button onClick={() => setIsHelperOpen(false)} style={{ color: "#6b7280" }}>
                <CloseIcon size={24} color="#6b7280" />
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {MANNER_QUICK_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleAskHelper(question)}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f8fafc",
                    color: "#374151",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {question}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "2px" }}>
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
                    whiteSpace: "pre-line",
                    maxWidth: message.role === "user" ? "80%" : "100%",
                  }}
                >
                  {message.text}
                </div>
              ))}

              {helperResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {helperResults.map((item) => (
                    <div
                      key={`${item.badge}-${item.title}`}
                      style={{
                        borderRadius: "18px",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "white",
                        padding: "14px",
                      }}
                    >
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "#e88fa3" }}>{item.badge}</p>
                      <p style={{ fontSize: "14px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>{item.title}</p>
                      <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px", lineHeight: "1.7" }}>
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAskHelper(query);
                  }
                }}
                placeholder="例: 写真は撮っていい？"
                style={{
                  flex: 1,
                  outline: "none",
                  border: "none",
                  fontSize: "14px",
                  color: "#111827",
                }}
              />
              <button
                onClick={() => handleAskHelper(query)}
                style={{
                  borderRadius: "999px",
                  backgroundColor: "#e88fa3",
                  color: "white",
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                送信
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
