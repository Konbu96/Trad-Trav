"use client";

import { useState } from "react";

interface DiagnosisViewProps {
  onComplete: (result: DiagnosisResult) => void;
}

export interface DiagnosisResult {
  interests: string[];
  duration: string;
  companion: string;
  budget: string;
  travelStyle: string;
  recommendedPlan: RecommendedPlan;
}

interface RecommendedPlan {
  title: string;
  description: string;
  spots: string[];
  tips: string[];
}

type Step = "interests" | "duration" | "companion" | "budget" | "result";

const interestOptions = [
  { id: "gourmet", label: "グルメ", emoji: "🍜" },
  { id: "sightseeing", label: "観光スポット", emoji: "🏛️" },
  { id: "nature", label: "自然・絶景", emoji: "🏔️" },
  { id: "onsen", label: "温泉", emoji: "♨️" },
  { id: "history", label: "歴史・文化", emoji: "⛩️" },
  { id: "outdoor", label: "アウトドア", emoji: "🎿" },
  { id: "shopping", label: "ショッピング", emoji: "🛍️" },
  { id: "animals", label: "動物", emoji: "🐻" },
];

const durationOptions = [
  { id: "day", label: "日帰り", description: "サクッと楽しむ" },
  { id: "1night", label: "1泊2日", description: "週末旅行に" },
  { id: "2nights", label: "2泊3日", description: "ゆったり満喫" },
  { id: "3nights", label: "3泊以上", description: "じっくり堪能" },
];

const companionOptions = [
  { id: "solo", label: "一人旅", emoji: "🚶" },
  { id: "couple", label: "カップル", emoji: "💑" },
  { id: "family", label: "家族", emoji: "👨‍👩‍👧‍👦" },
  { id: "friends", label: "友人", emoji: "👫" },
];

const budgetOptions = [
  { id: "budget", label: "リーズナブル", description: "〜3万円", emoji: "💰" },
  { id: "standard", label: "スタンダード", description: "3〜5万円", emoji: "💰💰" },
  { id: "luxury", label: "ちょっと贅沢", description: "5〜10万円", emoji: "💰💰💰" },
  { id: "premium", label: "プレミアム", description: "10万円〜", emoji: "👑" },
];

// 診断結果からおすすめプランを生成
function generatePlan(
  interests: string[],
  duration: string,
  companion: string,
  budget: string
): { travelStyle: string; plan: RecommendedPlan } {
  // 旅行スタイルを判定
  let travelStyle = "バランス派";
  if (interests.includes("gourmet") && interests.length <= 2) {
    travelStyle = "グルメ探求派";
  } else if (interests.includes("nature") || interests.includes("outdoor")) {
    travelStyle = "アクティブ派";
  } else if (interests.includes("onsen") && interests.includes("gourmet")) {
    travelStyle = "癒し＆グルメ派";
  } else if (interests.includes("history") || interests.includes("sightseeing")) {
    travelStyle = "観光満喫派";
  }

  // プランを生成
  let plan: RecommendedPlan = {
    title: "札幌満喫プラン",
    description: "北海道の魅力をギュッと詰め込んだプラン",
    spots: ["札幌時計台", "赤レンガ庁舎", "サッポロビール園"],
    tips: ["地下鉄を活用すると便利です", "海鮮は朝市がおすすめ"],
  };

  // 興味に基づいてカスタマイズ
  if (interests.includes("gourmet")) {
    plan.spots.push("二条市場");
    plan.tips.push("ジンギスカンは予約がおすすめ");
  }
  if (interests.includes("nature")) {
    plan.spots = ["大通公園", "藻岩山", "支笏湖", ...plan.spots.slice(0, 2)];
    plan.title = "札幌＆自然満喫プラン";
  }
  if (interests.includes("history")) {
    plan.spots.push("五稜郭");
    plan.title = "歴史と観光プラン";
  }
  if (interests.includes("onsen")) {
    plan.spots.push("定山渓温泉");
    plan.tips.push("温泉は日帰り入浴も可能");
  }
  if (interests.includes("animals")) {
    plan.spots.unshift("円山動物園");
    plan.tips.push("動物園は午前中がおすすめ");
  }

  // 期間に応じて調整
  if (duration === "day") {
    plan.spots = plan.spots.slice(0, 3);
    plan.description = "日帰りで効率よく回れるプラン";
  } else if (duration === "3nights") {
    plan.spots.push("小樽運河");
    plan.description = "じっくり北海道を堪能するプラン";
  }

  // 同行者に応じて調整
  if (companion === "family") {
    plan.tips.push("お子様向けの施設も充実しています");
  } else if (companion === "couple") {
    plan.tips.push("夜景スポットもおすすめです");
  }

  return { travelStyle, plan };
}

export default function DiagnosisView({ onComplete }: DiagnosisViewProps) {
  const [step, setStep] = useState<Step>("interests");
  const [interests, setInterests] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>("");
  const [companion, setCompanion] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [result, setResult] = useState<{ travelStyle: string; plan: RecommendedPlan } | null>(null);

  const handleInterestToggle = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === "interests" && interests.length > 0) {
      setStep("duration");
    } else if (step === "duration" && duration) {
      setStep("companion");
    } else if (step === "companion" && companion) {
      setStep("budget");
    } else if (step === "budget" && budget) {
      const generated = generatePlan(interests, duration, companion, budget);
      setResult(generated);
      setStep("result");
    }
  };

  const handleComplete = () => {
    if (result) {
      onComplete({
        interests,
        duration,
        companion,
        budget,
        travelStyle: result.travelStyle,
        recommendedPlan: result.plan,
      });
    }
  };

  const progress = {
    interests: 25,
    duration: 50,
    companion: 75,
    budget: 90,
    result: 100,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#fff5f7",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          padding: "48px 24px 24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>
          {step === "result" ? "診断結果" : "旅の好み診断"}
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>
          {step === "result" ? "あなたにぴったりのプラン" : "あなたにぴったりの旅をご提案"}
        </p>
        
        {/* プログレスバー */}
        {step !== "result" && (
          <div
            style={{
              marginTop: "20px",
              height: "4px",
              backgroundColor: "#fce7f3",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress[step]}%`,
                height: "100%",
                backgroundColor: "#ec4899",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 24px 120px",
        }}
      >
        {/* 興味・関心 */}
        {step === "interests" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>
              興味のあるジャンルは？
            </h2>
            <p style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "20px" }}>
              複数選択できます
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {interestOptions.map((option) => {
                const isSelected = interests.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleInterestToggle(option.id)}
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      border: isSelected ? "2px solid #ec4899" : "2px solid #e5e7eb",
                      backgroundColor: isSelected ? "#fdf2f8" : "white",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>
                      {option.emoji}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 旅行期間 */}
        {step === "duration" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "20px" }}>
              何日間の旅行？
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {durationOptions.map((option) => {
                const isSelected = duration === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setDuration(option.id)}
                    style={{
                      padding: "20px",
                      borderRadius: "16px",
                      border: isSelected ? "2px solid #ec4899" : "2px solid #e5e7eb",
                      backgroundColor: isSelected ? "#fdf2f8" : "white",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "16px", fontWeight: "600", color: "#374151", display: "block" }}>
                      {option.label}
                    </span>
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 同行者 */}
        {step === "companion" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "20px" }}>
              誰と行く？
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {companionOptions.map((option) => {
                const isSelected = companion === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setCompanion(option.id)}
                    style={{
                      padding: "20px",
                      borderRadius: "16px",
                      border: isSelected ? "2px solid #ec4899" : "2px solid #e5e7eb",
                      backgroundColor: isSelected ? "#fdf2f8" : "white",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>
                      {option.emoji}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 予算 */}
        {step === "budget" && (
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "20px" }}>
              旅行の予算は？
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {budgetOptions.map((option) => {
                const isSelected = budget === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setBudget(option.id)}
                    style={{
                      padding: "20px",
                      borderRadius: "16px",
                      border: isSelected ? "2px solid #ec4899" : "2px solid #e5e7eb",
                      backgroundColor: isSelected ? "#fdf2f8" : "white",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "16px", fontWeight: "600", color: "#374151", display: "block" }}>
                        {option.label}
                      </span>
                      <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                        {option.description}
                      </span>
                    </div>
                    <span style={{ fontSize: "20px" }}>{option.emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 結果 */}
        {step === "result" && result && (
          <div>
            {/* タイプ表示 */}
            <div
              style={{
                backgroundColor: "#fdf2f8",
                borderRadius: "20px",
                padding: "24px",
                textAlign: "center",
                marginBottom: "24px",
              }}
            >
              <p style={{ fontSize: "14px", color: "#ec4899", marginBottom: "8px" }}>
                あなたの旅行タイプは...
              </p>
              <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#be185d" }}>
                {result.travelStyle}
              </h2>
            </div>

            {/* おすすめプラン */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                📍 {result.plan.title}
              </h3>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
                {result.plan.description}
              </p>

              <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
                おすすめスポット
              </h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                {result.plan.spots.map((spot, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: "#fce7f3",
                      color: "#be185d",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                    }}
                  >
                    {spot}
                  </span>
                ))}
              </div>

              <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
                💡 旅のヒント
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {result.plan.tips.map((tip, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: "14px",
                      color: "#6b7280",
                      paddingLeft: "16px",
                      position: "relative",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ position: "absolute", left: 0 }}>•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ボタン */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "20px 24px",
          paddingBottom: "36px",
          backgroundColor: "white",
          borderTop: "1px solid #f3f4f6",
        }}
      >
        {step !== "result" ? (
          <button
            onClick={handleNext}
            disabled={
              (step === "interests" && interests.length === 0) ||
              (step === "duration" && !duration) ||
              (step === "companion" && !companion) ||
              (step === "budget" && !budget)
            }
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              backgroundColor:
                (step === "interests" && interests.length === 0) ||
                (step === "duration" && !duration) ||
                (step === "companion" && !companion) ||
                (step === "budget" && !budget)
                  ? "#e5e7eb"
                  : "#ec4899",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor:
                (step === "interests" && interests.length === 0) ||
                (step === "duration" && !duration) ||
                (step === "companion" && !companion) ||
                (step === "budget" && !budget)
                  ? "default"
                  : "pointer",
            }}
          >
            次へ
          </button>
        ) : (
          <button
            onClick={handleComplete}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#ec4899",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            旅を始める 🌸
          </button>
        )}
      </div>
    </div>
  );
}

