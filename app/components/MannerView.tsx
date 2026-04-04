"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CloseIcon, SearchIcon } from "./icons";
import MannerCategoryPage from "./MannerCategoryPage";
import type { LocationPermissionState } from "../page";
import {
  MANNER_CATEGORIES,
  MANNER_ITEMS,
  MANNER_QUICK_QUESTIONS,
  searchMannerItems,
  type MannerCategoryId,
} from "../data/manners";

interface MannerViewProps {
  spotName?: string | null;
  locationPermissionState?: LocationPermissionState;
  isUsingMockLocation?: boolean;
  onOpenLocationSettings?: () => void;
}

type HelperMessage = {
  role: "assistant" | "user";
  text: string;
};

function getHelperReply(query: string, spotName?: string | null) {
  const matchedItems = searchMannerItems(query).slice(0, 3);
  const intro = spotName
    ? `「${spotName}」に行く前提で、いま気を付けたいマナーをまとめます。`
    : "いまの質問に近いマナーをまとめます。";

  if (matchedItems.length === 0) {
    return {
      text: `${intro} 仮実装のため、まずは「写真」「電車」「体験」「祭り」などで聞いてみてください。`,
      items: [],
    };
  }

  const summary = matchedItems
    .map((item) => `・${item.title}: ${item.shortDescription}`)
    .join("\n");

  return {
    text: `${intro}\n${summary}`,
    items: matchedItems,
  };
}

export default function MannerView({
  spotName,
  locationPermissionState = "idle",
  isUsingMockLocation = false,
  onOpenLocationSettings,
}: MannerViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [helperMessages, setHelperMessages] = useState<HelperMessage[]>([
    {
      role: "assistant",
      text: "マナーAIは仮実装です。写真撮影、電車での通話、体験予約の注意などを気軽に聞けます。",
    },
  ]);
  const [helperResults, setHelperResults] = useState<typeof MANNER_ITEMS>([]);
  const closeTimerRef = useRef<number | null>(null);
  const visibleCategoryIdRef = useRef<MannerCategoryId | null>(null);
  const isClosingCategoryRef = useRef(false);

  const selectedCategoryParam = searchParams.get("manner");
  const selectedCategoryIdFromQuery = MANNER_CATEGORIES.some((category) => category.id === selectedCategoryParam)
    ? (selectedCategoryParam as MannerCategoryId)
    : null;
  const [visibleCategoryId, setVisibleCategoryId] = useState<MannerCategoryId | null>(selectedCategoryIdFromQuery);
  const [isClosingCategory, setIsClosingCategory] = useState(false);
  const activeCategoryId = visibleCategoryId ?? selectedCategoryIdFromQuery;

  const selectedCategory = useMemo(
    () => MANNER_CATEGORIES.find((category) => category.id === activeCategoryId) ?? null,
    [activeCategoryId]
  );

  useEffect(() => {
    visibleCategoryIdRef.current = visibleCategoryId;
    isClosingCategoryRef.current = isClosingCategory;
  }, [visibleCategoryId, isClosingCategory]);

  useEffect(() => () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const nextCategoryParam = params.get("manner");
      const nextCategoryId = MANNER_CATEGORIES.some((category) => category.id === nextCategoryParam)
        ? (nextCategoryParam as MannerCategoryId)
        : null;

      if (!nextCategoryId && visibleCategoryIdRef.current && !isClosingCategoryRef.current) {
        setIsClosingCategory(true);
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
        }
        closeTimerRef.current = window.setTimeout(() => {
          setVisibleCategoryId(null);
          setIsClosingCategory(false);
          closeTimerRef.current = null;
        }, 280);
        return;
      }

      if (nextCategoryId) {
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        setVisibleCategoryId(nextCategoryId);
        setIsClosingCategory(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openCategoryPage = (categoryId: MannerCategoryId) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setVisibleCategoryId(categoryId);
    setIsClosingCategory(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("manner", categoryId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const closeCategoryPage = () => {
    setIsClosingCategory(true);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("manner");
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      setVisibleCategoryId(null);
      setIsClosingCategory(false);
      router.replace(nextUrl, { scroll: false });
      closeTimerRef.current = null;
    }, 280);
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
            background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
            minHeight: "132px",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "white", textAlign: "center" }}>
            マナーガイド
          </h1>
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              backgroundColor: "#fff1f2",
              borderRadius: "16px",
              padding: "12px 14px",
              border: "1px solid #fbcfe8",
            }}
          >
            <p style={{ fontSize: "13px", color: "#be185d", lineHeight: "1.7" }}>
              位置情報取得を許可すると、状況に合わせたマナー情報をお届けできます。
            </p>
            {onOpenLocationSettings && (
              <button
                type="button"
                onClick={onOpenLocationSettings}
                style={{
                  marginTop: "10px",
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  border: "1px solid #f472b6",
                  backgroundColor: "#fdf2f8",
                  color: "#be185d",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                マイページで位置情報を設定
              </button>
            )}
            {locationPermissionState === "granted" && (
              <p style={{ fontSize: "12px", color: "#166534", lineHeight: "1.6", marginTop: "8px", fontWeight: 700 }}>
                {isUsingMockLocation ? "現在は仙台市の仮位置を使用しています。" : "現在地の利用が許可されています。"}
              </p>
            )}
            {spotName && (
              <p style={{ fontSize: "12px", color: "#7c3aed", fontWeight: 700, marginTop: "6px" }}>
                スポット連携中: {spotName}
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {MANNER_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => openCategoryPage(category.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "20px",
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
                      backgroundColor: "#fff1f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      flexShrink: 0,
                    }}
                  >
                    {category.emoji}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "16px", fontWeight: 800, color: "#111827" }}>{category.label}</p>
                    <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.6", marginTop: "4px" }}>
                      {category.description}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: "18px", color: "#ec4899", flexShrink: 0 }}>&gt;</span>
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
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#ec4899" }}>AIヘルプの使い方</p>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>
              気になるマナーは AI に質問
            </h3>
            <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.8", marginTop: "8px" }}>
              右下のボタンから開けます。仮実装では、入力内容に近いマナーを検索して返します。
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
              {MANNER_QUICK_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleAskHelper(question)}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid #fbcfe8",
                    backgroundColor: "#fff1f2",
                    color: "#be185d",
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

      {selectedCategory && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#f8fafc",
            overflowY: "auto",
            paddingBottom: "120px",
            animation: isClosingCategory
              ? "mannerSlideOutToRight 0.28s ease forwards"
              : "mannerSlideInFromRight 0.28s ease forwards",
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
              minHeight: "132px",
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "white", textAlign: "center" }}>
              {selectedCategory.label}
            </h1>
          </div>

          <MannerCategoryPage
            categoryId={selectedCategory.id}
            onBack={closeCategoryPage}
            onAskAi={handleAskHelper}
          />
        </div>
      )}

      <button
        onClick={() => setIsHelperOpen(true)}
        style={{
          position: "absolute",
          right: "20px",
          bottom: "96px",
          width: "64px",
          height: "64px",
          borderRadius: "999px",
          background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
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
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#ec4899" }}>マナーAI</p>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", marginTop: "4px" }}>
                  質問しながらマナー検索
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
                    backgroundColor: message.role === "user" ? "#ec4899" : "#f3f4f6",
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
                      key={item.id}
                      style={{
                        borderRadius: "18px",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "white",
                        padding: "14px",
                      }}
                    >
                      <p style={{ fontSize: "14px", fontWeight: 800, color: "#111827" }}>{item.title}</p>
                      <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px", lineHeight: "1.7" }}>
                        {item.shortDescription}
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
                  backgroundColor: "#ec4899",
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
