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
  isLoadingInfo?: boolean;
  onOpenLanguageHelper?: (spotName: string) => void;
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

function ExpandableReviewText({ text }: { text: string }) {
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const measureOverflow = () => {
      const computedStyle = window.getComputedStyle(element);
      const lineHeight = Number.parseFloat(computedStyle.lineHeight);

      if (!Number.isFinite(lineHeight)) {
        setIsOverflowing(false);
        return;
      }

      const maxHeight = lineHeight * 5;
      setIsOverflowing(element.scrollHeight - maxHeight > 1);
    };

    measureOverflow();
    window.addEventListener("resize", measureOverflow);
    return () => window.removeEventListener("resize", measureOverflow);
  }, [text]);

  return (
    <div>
      <p
        ref={textRef}
        style={{
          fontSize: "14px",
          color: "#4b5563",
          lineHeight: "1.7",
          whiteSpace: "pre-line",
          overflow: isExpanded ? "visible" : "hidden",
          display: isExpanded ? "block" : "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: isExpanded ? "unset" : 5,
        }}
      >
        {text}
      </p>
      {isOverflowing && (
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          style={{
            marginTop: "10px",
            fontSize: "13px",
            fontWeight: 700,
            color: "#ec4899",
          }}
        >
          {isExpanded ? "閉じる" : "もっと見る"}
        </button>
      )}
    </div>
  );
}

// カテゴリバッジ
function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    観光: "bg-blue-100 text-blue-700",
    グルメ: "bg-orange-100 text-orange-700",
    レジャー: "bg-green-100 text-green-700",
    体験: "bg-purple-100 text-purple-700",
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
function OverviewTab({ spot, isLoadingInfo }: { spot: Spot; isLoadingInfo?: boolean }) {
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
        {isLoadingInfo ? (
          <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "18px", height: "18px",
              border: "2px solid #ec4899",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "13px", color: "#9ca3af" }}>
              Google Places から情報を取得中...
            </span>
          </div>
        ) : infosWithoutReservation.length > 0 ? (
          infosWithoutReservation.map((info, index) => (
            <InfoListItem 
              key={`${info.type}-${index}`}
              icon={InfoIcons[info.type]}
              href={getHrefForInfo(info.type, info.value)}
              isLast={index === infosWithoutReservation.length - 1}
              alignTop={info.type === "address" || info.type === "access"}
            >
              {getDisplayText(info.type, info.value)}
            </InfoListItem>
          ))
        ) : (
          <div style={{ padding: "16px" }}>
            <span style={{ fontSize: "13px", color: "#9ca3af" }}>情報なし</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 予約タブ
function ReservationTab({ spot }: { spot: Spot }) {
  const reservationInfos = spot.infos.filter(info => info.type === "reservation");

  if (reservationInfos.length === 0) {
    return (
      <div style={{ backgroundColor: "#f3f4f6", borderRadius: "12px", padding: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#374151", marginBottom: "8px" }}>
          予約について
        </h3>
        <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: "1.8" }}>
          予約情報はありません
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {reservationInfos.map((info, i) => {
        const isPdf = info.value.endsWith(".pdf");
        const isUrl = info.value.startsWith("http") && !isPdf;
        const isText = !isPdf && !isUrl;

        return (
          <div key={i} style={{ backgroundColor: "#f3f4f6", borderRadius: "12px", padding: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#374151", marginBottom: "10px" }}>
              🎫 {info.label}
            </h3>

            {isText && (
              <p style={{ color: "#4b5563", fontSize: "14px", lineHeight: "1.9", whiteSpace: "pre-line" }}>
                {info.value}
              </p>
            )}

            {isUrl && (
              <a
                href={info.value}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  backgroundColor: "#ec4899",
                  color: "white",
                  textAlign: "center",
                  padding: "14px 20px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: "bold",
                  textDecoration: "none",
                }}
              >
                予約サイトへ →
              </a>
            )}

            {isPdf && (
              <div>
                <p style={{ color: "#4b5563", fontSize: "13px", lineHeight: "1.8", marginBottom: "12px" }}>
                  団体・体験学習の予約は予約シート（PDF）に記入のうえ、メールまたはFAXでお送りください。
                </p>
                <a
                  href={info.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    backgroundColor: "#f97316",
                    color: "white",
                    textAlign: "center",
                    padding: "14px 20px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  📄 予約シートをダウンロード（PDF）
                </a>
              </div>
            )}
          </div>
        );
      })}
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
            <ExpandableReviewText text={review.comment} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 写真タブ
function PhotosTab({ spot }: { spot: Spot }) {
  const hasPhotos = spot.photos && spot.photos.length > 0;
  const hasVideos = spot.videos && spot.videos.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* PR動画セクション */}
      {hasVideos && (
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#374151", marginBottom: "10px" }}>
            🎬 PR動画
          </h3>
          {spot.videos!.map((url, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                width: "100%",
                paddingTop: "56.25%", // 16:9
                borderRadius: "12px",
                overflow: "hidden",
                backgroundColor: "#000",
                marginBottom: "10px",
              }}
            >
              <iframe
                src={url}
                title={`${spot.name} PR動画 ${i + 1}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 写真グリッド */}
      {hasPhotos ? (
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#374151", marginBottom: "10px" }}>
            📷 写真
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {spot.photos!.map((url, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "#f3f4f6",
                }}
              >
                <img
                  src={url}
                  alt={`${spot.name} 写真${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : !hasVideos ? (
        <div style={{ textAlign: "center", paddingTop: "32px", paddingBottom: "32px" }}>
          <div className="mx-auto mb-3 flex justify-center">
            <PhotoIcon size={40} color="#D1D5DB" />
          </div>
          <p style={{ fontSize: "14px", color: "#9ca3af" }}>
            {spot.name}の写真（準備中）
          </p>
        </div>
      ) : null}
    </div>
  );
}

const MAP_TUTORIAL_KEY = "trad-trav-map-tutorial-done"; // MapView と同じキー
const TAB_TUTORIAL_KEY = "trad-trav-tab-tutorial-done";

export default function SpotDetailSheet({ spot, onClose, isFavorite = false, onToggleFavorite, isLoadingInfo = false, onOpenLanguageHelper }: SpotDetailSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "photos" | "reservation">("overview");
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showTabTutorial, setShowTabTutorial] = useState(false);
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // 初回シートオープン時のみチュートリアルを表示（spotが変化したときに判定）
  useEffect(() => {
    // チュートリアル1（マップピン）完了後にのみチュートリアル2（タブ）を表示
    if (
      spot &&
      typeof window !== "undefined" &&
      localStorage.getItem(MAP_TUTORIAL_KEY) &&   // チュートリアル1完了済み
      !localStorage.getItem(TAB_TUTORIAL_KEY)      // チュートリアル2はまだ
    ) {
      setShowTabTutorial(true);
    }
  }, [spot]);

  const handleCloseTutorial = () => {
    setShowTabTutorial(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(TAB_TUTORIAL_KEY, "1");
    }
  };

  const handleTabChange = (tab: "overview" | "reviews" | "photos" | "reservation") => {
    setActiveTab(tab);
    if (showTabTutorial) handleCloseTutorial();
  };

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
    setDragY(diff);
  };

  // ドラッグ終了
  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // 下に80px以上ドラッグ → 閉じる
    if (dragY > 80) {
      handleClose();
    }
    setDragY(0);
  };

  // シートの高さ（常に全面表示）
  const sheetHeight = "92vh";
  
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <StarRating rating={Math.round(avgRating)} />
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                {avgRating.toFixed(1)}
              </span>
              {onOpenLanguageHelper && (
                <button
                  onClick={() => onOpenLanguageHelper(spot.name)}
                  style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    backgroundColor: "#eff6ff", color: "#1d4ed8",
                    border: "1px solid #bfdbfe", borderRadius: "20px",
                    padding: "4px 12px", fontSize: "12px", fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🤖 マナーAI・相談
                </button>
              )}
            </div>
          </div>

          {/* タブ */}
          <div style={{ position: "relative", marginTop: "20px" }}>
            {/* タブチュートリアル吹き出し */}
            {showTabTutorial && (
              <div style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 20,
                pointerEvents: "auto",
                width: "240px",
              }}>
                <div style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                  border: "1.5px solid #fce7f3",
                  position: "relative",
                }}>
                  <button
                    onClick={handleCloseTutorial}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 8,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#9ca3af",
                      fontSize: "14px",
                      lineHeight: 1,
                      padding: "2px 4px",
                    }}
                  >
                    ✕
                  </button>
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "#ec4899", margin: "0 0 4px" }}>
                    👆 タブで情報を切り替え！
                  </p>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                    口コミ・写真・予約情報も確認できます
                  </p>
                </div>
                {/* 矢印 */}
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "10px solid white",
                  margin: "0 auto",
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.1))",
                }} />
              </div>
            )}
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
              <TabButton
                label="概要"
                isActive={activeTab === "overview"}
                onClick={() => handleTabChange("overview")}
              />
              <TabButton
                label="口コミ"
                isActive={activeTab === "reviews"}
                onClick={() => handleTabChange("reviews")}
              />
              <TabButton
                label="写真"
                isActive={activeTab === "photos"}
                onClick={() => handleTabChange("photos")}
              />
              <TabButton
                label="予約"
                isActive={activeTab === "reservation"}
                onClick={() => handleTabChange("reservation")}
              />
            </div>
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
          {activeTab === "overview" && <OverviewTab spot={spot} isLoadingInfo={isLoadingInfo} />}
          {activeTab === "reviews" && <ReviewsTab spot={spot} />}
          {activeTab === "photos" && <PhotosTab spot={spot} />}
          {activeTab === "reservation" && <ReservationTab spot={spot} />}
        </div>
      </div>
    </>
  );
}
