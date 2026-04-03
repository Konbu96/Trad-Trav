"use client";

import {
  MANNER_CATEGORIES,
  MANNER_ITEMS,
  type MannerCategoryId,
} from "../data/manners";

interface MannerCategoryPageProps {
  categoryId: MannerCategoryId;
  onBack: () => void;
  onAskAi: (query: string) => void;
}

export default function MannerCategoryPage({
  categoryId,
  onBack,
  onAskAi,
}: MannerCategoryPageProps) {
  const category =
    MANNER_CATEGORIES.find((item) => item.id === categoryId) ?? MANNER_CATEGORIES[0];
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
        マナー一覧へ戻る
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
              backgroundColor: "#fff1f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            {category.emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6" }}>
              {category.description}
            </p>
          </div>
        </div>
      </div>

      {items.map((item) => (
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
                backgroundColor: "#fff1f2",
                color: "#ec4899",
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
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111827", lineHeight: "1.4" }}>
                {item.title}
              </h3>
            </div>
          </div>

          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#ec4899", marginBottom: "4px" }}>
              内容
            </p>
            <p style={{ fontSize: "14px", color: "#1f2937", lineHeight: "1.8" }}>
              {item.shortDescription}
            </p>
          </div>

          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#ec4899", marginBottom: "8px" }}>
              ポイント
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {item.details.map((detail, index) => (
                <div
                  key={detail}
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
                      backgroundColor: "#ec4899",
                      flexShrink: 0,
                      marginTop: "6px",
                    }}
                  />
                  <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.75" }}>
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </article>
      ))}

      <div
        style={{
          backgroundColor: "#fff1f2",
          borderRadius: "20px",
          padding: "16px",
          border: "1px solid #fbcfe8",
        }}
      >
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#ec4899" }}>迷ったときはAIへ</p>
        <p style={{ fontSize: "14px", color: "#374151", lineHeight: "1.8", marginTop: "6px" }}>
          右下のマナーAIから、このカテゴリに関する質問をそのままできます。
        </p>
        <button
          onClick={() => onAskAi(`${category.label}で気を付けることは？`)}
          style={{
            marginTop: "12px",
            borderRadius: "999px",
            backgroundColor: "#ec4899",
            color: "white",
            padding: "10px 14px",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          このカテゴリをAIに相談
        </button>
      </div>
    </div>
  );
}
