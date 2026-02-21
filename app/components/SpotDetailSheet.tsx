"use client";

import { useEffect, useState, useRef } from "react";
import type { Spot, SpotInfoType } from "../data/spots";
import {
  ClockIcon,
  LocationIcon,
  GlobeIcon,
  PhoneIcon,
  PriceIcon,
  ParkingIcon,
  AccessIcon,
  ClosedDaysIcon,
  ReservationIcon,
  InfoIcon,
  CloseIcon,
  StarIcon,
  PhotoIcon,
} from "./icons";

interface SpotDetailSheetProps {
  spot: Spot | null;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (spotId: number) => void;
}

// 星評価を表示
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} size={16} filled={star <= rating} />
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

// 情報リストアイテム（共通コンポーネント）
function InfoListItem({ 
  icon, 
  children, 
  href,
  isLast = false,
  alignTop = false
}: { 
  icon: React.ReactNode;
  children: React.ReactNode;
  href?: string;
  isLast?: boolean;
  alignTop?: boolean;
}) {
  const isLink = !!href && href.startsWith("http");
  
  const baseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: alignTop ? "flex-start" : "center",
    gap: "14px",
    padding: "14px 16px",
    borderBottom: isLast ? "none" : "1px solid #e5e7eb",
    textDecoration: "none",
  };

  const content = (
    <>
      <div style={{ flexShrink: 0, marginTop: alignTop ? "2px" : 0 }}>{icon}</div>
      <div style={{ 
        flex: 1, 
        fontSize: "15px", 
        color: isLink ? "#2563eb" : "#1f2937", 
        lineHeight: "1.5",
        textDecoration: isLink ? "underline" : "none"
      }}>
        {children}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} style={baseStyle}>
        {content}
      </a>
    );
  }

  return <div style={baseStyle}>{content}</div>;
}

// 情報タイプごとのアイコン定義（icons.tsxから取得）
const InfoIcons: Record<SpotInfoType, React.ReactNode> = {
  hours: <ClockIcon />,
  address: <LocationIcon />,
  website: <GlobeIcon />,
  phone: <PhoneIcon />,
  price: <PriceIcon />,
  parking: <ParkingIcon />,
  access: <AccessIcon />,
  closedDays: <ClosedDaysIcon />,
  reservation: <ReservationIcon />,
  other: <InfoIcon />,
};

// リンクになる情報タイプ
function getHrefForInfo(type: SpotInfoType, value: string): string | undefined {
  if (type === "website") return value;
  if (type === "phone") return `tel:${value}`;
  if (type === "reservation" && value.startsWith("http")) return value;
  return undefined;
}

// 表示用のテキストを取得
function getDisplayText(type: SpotInfoType, value: string): string {
  if (type === "website") {
    try {
      return new URL(value).hostname.replace("www.", "");
    } catch {
      return value;
    }
  }
  return value;
}

// 概要タブ（スポット紹介 + 基本情報）
function OverviewTab({ spot }: { spot: Spot }) {
  // 予約以外の情報をフィルタリング
  const infosWithoutReservation = spot.infos.filter(info => info.type !== "reservation");
  
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

      {/* 基本情報リスト（予約以外） */}
      <div 
        style={{ 
          backgroundColor: "#f3f4f6", 
          borderRadius: "12px", 
          overflow: "hidden" 
        }}
      >
        {infosWithoutReservation.map((info, index) => (
          <InfoListItem 
            key={`${info.type}-${index}`}
            icon={InfoIcons[info.type]}
            href={getHrefForInfo(info.type, info.value)}
            isLast={index === infosWithoutReservation.length - 1}
            alignTop={info.type === "address" || info.type === "access"}
          >
            {getDisplayText(info.type, info.value)}
          </InfoListItem>
        ))}
      </div>
    </div>
  );
}

// 予約タブ
function ReservationTab({ spot }: { spot: Spot }) {
  const reservationInfo = spot.infos.find(info => info.type === "reservation");
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div 
        style={{ 
          backgroundColor: "#f3f4f6", 
          borderRadius: "12px", 
          padding: "16px" 
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#374151", marginBottom: "12px" }}>
          予約について
        </h3>
        {reservationInfo ? (
          <p style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.8" }}>
            {reservationInfo.value}
          </p>
        ) : (
          <p style={{ color: "#9ca3af", fontSize: "15px", lineHeight: "1.8" }}>
            予約情報はありません
          </p>
        )}
      </div>
      
      {/* 予約ボタン（URLがある場合） */}
      {reservationInfo && reservationInfo.value.startsWith("http") && (
        <a
          href={reservationInfo.value}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            backgroundColor: "#3b82f6",
            color: "white",
            textAlign: "center",
            padding: "14px 20px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          予約サイトへ
        </a>
      )}
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 平均評価ボックス */}
      <div 
        style={{ 
          backgroundColor: "#f3f4f6", 
          borderRadius: "12px", 
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}
      >
        <div style={{ fontSize: "32px", fontWeight: "bold", color: "#111827" }}>{avgRating.toFixed(1)}</div>
        <div>
          <StarRating rating={Math.round(avgRating)} />
          <span style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px", display: "block" }}>
            {spot.reviews.length}件の口コミ
          </span>
        </div>
      </div>

      {/* コメントボックス（1つのボックスで区切り線あり） */}
      <div 
        style={{ 
          backgroundColor: "#f3f4f6", 
          borderRadius: "12px", 
          overflow: "hidden"
        }}
      >
        {spot.reviews.map((review, index) => (
          <div
            key={index}
            style={{ 
              padding: "16px",
              borderBottom: index < spot.reviews.length - 1 ? "1px solid #e5e7eb" : "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1f2937" }}>{review.author}</span>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>{review.date}</span>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <StarRating rating={review.rating} />
            </div>
            <p style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.7" }}>{review.comment}</p>
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
              <div className="mx-auto mb-1 flex justify-center">
                <PhotoIcon size={32} color="#9CA3AF" />
              </div>
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

export default function SpotDetailSheet({ spot, onClose, isFavorite = false, onToggleFavorite }: SpotDetailSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "photos" | "reservation">("overview");
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [sheetMode, setSheetMode] = useState<"half" | "full">("half");
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spot) {
      setActiveTab("overview"); // スポットが変わったらタブをリセット
      setDragY(0);
      setSheetMode("half"); // 最初は半分表示
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
    setDragY(diff);
  };

  // ドラッグ終了
  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (sheetMode === "half") {
      // 半分表示の時
      if (dragY < -50) {
        // 上に50px以上ドラッグ → 全体表示
        setSheetMode("full");
      } else if (dragY > 80) {
        // 下に80px以上ドラッグ → 閉じる
        handleClose();
      }
    } else {
      // 全体表示の時
      if (dragY > 80) {
        // 下に80px以上ドラッグ → 半分表示に戻す
        setSheetMode("half");
      }
    }
    setDragY(0);
  };

  // シートの高さを計算（ドラッグ中は動的に変更）
  const getSheetHeight = () => {
    if (sheetMode === "half") {
      if (dragY < 0) {
        // 上にドラッグ中は高さを増やす（最大92vh）
        return `min(calc(60vh + ${Math.abs(dragY)}px), 92vh)`;
      }
      return "60vh";
    }
    return "92vh";
  };
  const sheetHeight = getSheetHeight();
  
  // transformはシートを下に動かす場合のみ使用
  const getTransform = () => {
    if (!isVisible) return "translateY(100%)";
    if (dragY > 0) return `translateY(${dragY}px)`;
    return "translateY(0)";
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
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: "white",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          height: sheetHeight,
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.15)",
          transform: getTransform(),
          transition: isDragging ? "none" : "transform 0.3s ease-out, height 0.3s ease-out",
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
          {/* 右側ボタン群 */}
          <div style={{ position: "absolute", right: "16px", display: "flex", alignItems: "center", gap: "4px", zIndex: 10 }}>
            {/* ハートボタン */}
            {onToggleFavorite && spot && (
              <button
                onClick={() => onToggleFavorite(spot.id)}
                style={{
                  padding: "8px",
                  borderRadius: "9999px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s",
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill={isFavorite ? "#ef4444" : "none"} stroke={isFavorite ? "#ef4444" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            )}
            {/* バツボタン */}
            <button
              onClick={handleClose}
              style={{ 
                padding: "8px", 
                borderRadius: "9999px", 
                background: "transparent", 
                border: "none", 
                cursor: "pointer",
              }}
            >
              <CloseIcon size={24} color="#666" />
            </button>
          </div>
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
            <TabButton 
              label="予約" 
              isActive={activeTab === "reservation"} 
              onClick={() => setActiveTab("reservation")} 
            />
          </div>
        </div>

        {/* タブコンテンツ（スクロール可能） */}
        <div 
          className="overflow-y-auto" 
          style={{ 
            maxHeight: `calc(${sheetHeight} - 160px)`,
            paddingLeft: "24px",
            paddingRight: "24px",
            paddingTop: "16px",
            paddingBottom: "100px",
          }}
        >
          {activeTab === "overview" && <OverviewTab spot={spot} />}
          {activeTab === "reviews" && <ReviewsTab spot={spot} />}
          {activeTab === "photos" && <PhotosTab spot={spot} />}
          {activeTab === "reservation" && <ReservationTab spot={spot} />}
        </div>
      </div>
    </>
  );
}
