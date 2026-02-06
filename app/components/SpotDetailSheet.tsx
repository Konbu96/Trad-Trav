"use client";

import { useEffect, useState, useRef } from "react";
import type { Spot } from "../data/spots";

interface SpotDetailSheetProps {
  spot: Spot | null;
  onClose: () => void;
}

// 星評価を表示
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={star <= rating ? "#FBBF24" : "none"}
          stroke={star <= rating ? "#FBBF24" : "#D1D5DB"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// カテゴリバッジ
function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    観光: "bg-blue-100 text-blue-700",
    グルメ: "bg-orange-100 text-orange-700",
    レジャー: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${colors[category] || "bg-gray-100 text-gray-700"}`}
    >
      {category}
    </span>
  );
}

// タブボタン
function TabButton({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
        isActive ? "text-blue-600" : "text-gray-500"
      }`}
    >
      {label}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
      )}
    </button>
  );
}

// 概要タブ
function OverviewTab({ spot }: { spot: Spot }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 説明文ボックス */}
      <div 
        style={{ 
          backgroundColor: "#f3f4f6", 
          borderRadius: "12px", 
          padding: "16px" 
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#374151", marginBottom: "12px" }}>
          スポット紹介
        </h3>
        <p style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.8" }}>
          {spot.description}
        </p>
        <div style={{ marginTop: "16px" }}>
          <CategoryBadge category={spot.category} />
        </div>
      </div>

      {/* 基本情報リスト（Google Map風） */}
      <div 
        style={{ 
          backgroundColor: "#f3f4f6", 
          borderRadius: "12px", 
          overflow: "hidden" 
        }}
      >
        {/* 営業時間 */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "14px", 
            padding: "14px 16px",
            borderBottom: "1px solid #e5e7eb"
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "15px", color: "#1f2937" }}>{spot.businessHours}</span>
          </div>
        </div>

        {/* 住所 */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "flex-start", 
            gap: "14px", 
            padding: "14px 16px",
            borderBottom: "1px solid #e5e7eb"
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6B7280"
            strokeWidth="2"
            style={{ flexShrink: 0, marginTop: "2px" }}
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "15px", color: "#1f2937", lineHeight: "1.5" }}>{spot.address}</span>
          </div>
        </div>

        {/* Webサイト */}
        {spot.website && (
          <a
            href={spot.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "14px", 
              padding: "14px 16px",
              borderBottom: "1px solid #e5e7eb",
              textDecoration: "none"
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="2"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span style={{ flex: 1, fontSize: "15px", color: "#1f2937" }}>
              {new URL(spot.website).hostname.replace("www.", "")}
            </span>
          </a>
        )}

        {/* 電話番号 */}
        {spot.phone && (
          <a
            href={`tel:${spot.phone}`}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "14px", 
              padding: "14px 16px",
              textDecoration: "none"
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="2"
              style={{ flexShrink: 0 }}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span style={{ flex: 1, fontSize: "15px", color: "#1f2937" }}>{spot.phone}</span>
          </a>
        )}
      </div>
    </div>
  );
}

// 口コミタブ
function ReviewsTab({ spot }: { spot: Spot }) {
  const avgRating =
    spot.reviews.length > 0
      ? spot.reviews.reduce((sum, r) => sum + r.rating, 0) / spot.reviews.length
      : 0;

  return (
    <div className="space-y-4">
      {/* 平均評価 */}
      <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
        <div className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
        <div>
          <StarRating rating={Math.round(avgRating)} />
          <span className="text-sm text-gray-500 mt-1 block">{spot.reviews.length}件の口コミ</span>
        </div>
      </div>

      {/* 口コミリスト */}
      <div className="space-y-4">
        {spot.reviews.map((review, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-800">{review.author}</span>
              <span className="text-xs text-gray-400">{review.date}</span>
            </div>
            <div className="mb-2">
              <StarRating rating={review.rating} />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 写真タブ
function PhotosTab({ spot }: { spot: Spot }) {
  // 仮の写真プレースホルダー
  const placeholderPhotos = [
    { id: 1, color: "#E8F4FD" },
    { id: 2, color: "#FDF2E8" },
    { id: 3, color: "#E8FDF0" },
    { id: 4, color: "#F8E8FD" },
    { id: 5, color: "#FDE8E8" },
    { id: 6, color: "#E8EFFD" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {placeholderPhotos.map((photo) => (
          <div
            key={photo.id}
            className="aspect-square rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: photo.color }}
          >
            <div className="text-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="1.5"
                className="mx-auto mb-1"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-xs text-gray-400">写真 {photo.id}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-gray-400 mt-4">
        {spot.name}の写真（準備中）
      </p>
    </div>
  );
}

export default function SpotDetailSheet({ spot, onClose }: SpotDetailSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "photos">("overview");
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spot) {
      setActiveTab("overview"); // スポットが変わったらタブをリセット
      setDragY(0);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [spot]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // ドラッグ開始
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  // ドラッグ中
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    // 下方向のみドラッグ可能（上には引っ張れない）
    if (diff > 0) {
      setDragY(diff);
    }
  };

  // ドラッグ終了
  const handleTouchEnd = () => {
    setIsDragging(false);
    // 100px以上下にドラッグしたら閉じる
    if (dragY > 100) {
      handleClose();
    }
    setDragY(0);
  };

  if (!spot) return null;

  const avgRating =
    spot.reviews.length > 0
      ? spot.reviews.reduce((sum, r) => sum + r.rating, 0) / spot.reviews.length
      : 0;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
          isVisible ? "opacity-30" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* シート */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl ${
          isDragging ? "" : "transition-transform duration-300 ease-out"
        } ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          maxHeight: "92vh",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.15)",
          transform: isVisible ? `translateY(${dragY}px)` : "translateY(100%)",
        }}
      >
        {/* ハンドル（ドラッグ可能エリア）とバツボタン */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center",
            justifyContent: "center", 
            paddingTop: "20px", 
            paddingBottom: "12px",
            position: "relative",
          }}
        >
          {/* ドラッグ可能エリア */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              cursor: "grab",
              touchAction: "none",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          {/* ハンドルバー */}
          <div style={{ width: "48px", height: "6px", backgroundColor: "#d1d5db", borderRadius: "9999px" }} />
          {/* バツボタン */}
          <button
            onClick={handleClose}
            style={{ 
              position: "absolute",
              right: "16px",
              padding: "8px", 
              borderRadius: "9999px", 
              background: "transparent", 
              border: "none", 
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#666"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ヘッダー（固定） */}
        <div 
          style={{ 
            paddingLeft: "24px",
            paddingRight: "24px",
            paddingBottom: "16px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", marginBottom: "10px" }}>{spot.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <StarRating rating={Math.round(avgRating)} />
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                {avgRating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* タブ */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginTop: "20px" }}>
            <TabButton 
              label="概要" 
              isActive={activeTab === "overview"} 
              onClick={() => setActiveTab("overview")} 
            />
            <TabButton 
              label="口コミ" 
              isActive={activeTab === "reviews"} 
              onClick={() => setActiveTab("reviews")} 
            />
            <TabButton 
              label="写真" 
              isActive={activeTab === "photos"} 
              onClick={() => setActiveTab("photos")} 
            />
          </div>
        </div>

        {/* タブコンテンツ（スクロール可能） */}
        <div 
          className="overflow-y-auto" 
          style={{ 
            maxHeight: "calc(92vh - 160px)",
            paddingLeft: "24px",
            paddingRight: "24px",
            paddingTop: "16px",
            paddingBottom: "100px",
          }}
        >
          {activeTab === "overview" && <OverviewTab spot={spot} />}
          {activeTab === "reviews" && <ReviewsTab spot={spot} />}
          {activeTab === "photos" && <PhotosTab spot={spot} />}
        </div>
      </div>
    </>
  );
}
