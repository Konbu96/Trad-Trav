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

type Step = "interests" | "duration" | "companion" | "result";

type TravelTypeKey = "performing_arts" | "crafts" | "allround";

// Q1 興味（複数選択）
const interestOptions = [
  { id: "performing_arts", label: "伝統芸能・踊り・祭りに参加したい", emoji: "🎭" },
  { id: "crafts",          label: "伝統工芸・ものづくりを体験したい", emoji: "🏺" },
];

// Q2 旅行期間
const durationOptions = [
  { id: "short",    label: "1〜2泊",   description: "短期滞在" },
  { id: "medium",   label: "3〜4泊",   description: "ゆっくり主要スポットを回る" },
  { id: "long",     label: "5〜6泊",   description: "じっくり東北を満喫" },
  { id: "extended", label: "1週間以上", description: "深く探訪・体験重視" },
];

// Q3 同行者
const companionOptions = [
  { id: "solo",    label: "一人旅",      emoji: "🚶" },
  { id: "couple",  label: "恋人・夫婦",  emoji: "💑" },
  { id: "family",  label: "家族（子連れ）", emoji: "👨‍👩‍👧‍👦" },
  { id: "friends", label: "友人グループ", emoji: "👫" },
];

// スコアリングマトリクス（Q1選択 → タイプ別加算）
const SCORE_MATRIX: Record<string, Record<TravelTypeKey, number>> = {
  performing_arts: { performing_arts: 6, crafts: 0, allround: 1 },
  crafts:          { performing_arts: 0, crafts: 6, allround: 1 },
};

// Q2 期間補正（タイブレーカー程度）
const DURATION_BONUS: Record<string, Partial<Record<TravelTypeKey, number>>> = {
  short:    {},
  medium:   { crafts: 1 },
  long:     { allround: 1 },
  extended: { allround: 2 },
};

// Q3 同行者補正（タイブレーカー）
const COMPANION_BONUS: Record<string, Partial<Record<TravelTypeKey, number>>> = {
  solo:    { crafts: 1 },
  couple:  { performing_arts: 1 },
  family:  { allround: 1 },
  friends: { performing_arts: 1 },
};

// 結果タイプ定義
const TRAVEL_TYPE_DATA: Record<TravelTypeKey, {
  label: string;
  emoji: string;
  description: string;
  tips: string[];
  spotNames: string[];
  categories: { label: string; emoji: string }[];
  planTitle: string;
  planDescription: string;
}> = {
  performing_arts: {
    label: "伝統芸能参加者",
    emoji: "🎭",
    description: "踊り・祭り・芸能の中に飛び込みたいあなた。700年続く盆踊りの輪に加わり、鬼の面をつけて舞い、太鼓の音に体を委ねる。東北の伝統芸能は参加してこそ本物の感動があります。",
    tips: [
      "夏の祭り（7〜8月）は参加型イベントが多く、最もおすすめです",
      "跳ね人・踊り連への参加は事前申込が必要な場合があります",
      "竿燈や鬼剣舞などの体験コーナーは開場直後が混みにくいです",
      "衣装レンタルができる祭りも多いので気軽に参加してみましょう",
    ],
    spotNames: ["青森ねぶた祭（跳ね人参加）", "盛岡さんさ踊り（参加型）", "秋田竿燈まつり（竿燈体験）", "鬼剣舞（体験ワークショップ）", "西馬音内盆踊り（飛び入り参加）"],
    categories: [
      { label: "伝統芸能・踊り", emoji: "🎭" },
      { label: "祭り・行列", emoji: "🎪" },
      { label: "能・神楽", emoji: "🎑" },
    ],
    planTitle: "東北伝統芸能参加プラン",
    planDescription: "踊り・祭り・芸能の輪に自ら加わり、東北の生きた伝統を体全体で感じる旅。",
  },
  crafts: {
    label: "伝統工芸体験家",
    emoji: "🏺",
    description: "作ること・手を動かすことに喜びを感じるあなた。南部鉄器・曲げわっぱ・会津漆器など、東北の職人が何百年と守り続けてきた技に触れ、自分だけの一品を生み出しましょう。",
    tips: [
      "工芸体験はほとんどの場所で事前予約が必要です",
      "完成品の発送に対応している工房も多いのでお土産にもなります",
      "所要時間は1〜3時間が多いので、日程に余裕を持って計画を",
      "職人さんへの質問は積極的に。技術の背景を教えてもらえます",
    ],
    spotNames: ["南部鉄器体験（岩鋳鉄器館）", "曲げわっぱ体験（大館）", "樺細工体験（角館）", "会津本郷焼（陶芸体験）", "会津漆器（蒔絵体験）"],
    categories: [
      { label: "伝統工芸・体験", emoji: "🏺" },
      { label: "ものづくり・陶芸", emoji: "🎨" },
      { label: "染め・織り・漆器", emoji: "🧵" },
    ],
    planTitle: "東北伝統工芸体験プラン",
    planDescription: "鉄器・木工・漆器・陶芸など、東北の職人技を手と心で感じる創作の旅。",
  },
  allround: {
    label: "東北文化全体験者",
    emoji: "🌸",
    description: "踊りも工芸も両方体験したい欲張りなあなた。祭りの熱気に包まれながら職人の技にも触れる、東北の伝統文化を余すことなく楽しむ贅沢な旅をしましょう。",
    tips: [
      "夏（7〜8月）は祭りシーズン。工芸体験と組み合わせると最高です",
      "東北新幹線を使えば複数県のはしごも可能",
      "祭り参加と工芸体験の予約を事前にセットで入れておくと安心",
      "国重要無形民俗文化財に指定された本物の伝統を選びましょう",
    ],
    spotNames: ["青森ねぶた祭（跳ね人参加）", "南部鉄器体験（岩鋳鉄器館）", "黒川能（体験・鑑賞）", "こけし絵付け体験（鳴子温泉郷）", "西馬音内盆踊り（飛び入り参加）"],
    categories: [
      { label: "伝統芸能・踊り", emoji: "🎭" },
      { label: "伝統工芸・体験", emoji: "🏺" },
      { label: "祭り・能・民俗芸能", emoji: "🎑" },
    ],
    planTitle: "東北伝統文化フルコースプラン",
    planDescription: "芸能・工芸・祭り・能楽など、東北が誇る本物の伝統文化を全て体験する旅。",
  },
};

// スコアリング判定
function calcTravelType(
  interests: string[],
  duration: string,
  companion: string
): TravelTypeKey {
  const types: TravelTypeKey[] = ["performing_arts", "crafts", "allround"];
  const scores: Record<TravelTypeKey, number> = { performing_arts: 0, crafts: 0, allround: 0 };

  // Q1 ベーススコア（選択順を記録してタイブレーカーに使う）
  interests.forEach(interest => {
    const matrix = SCORE_MATRIX[interest];
    if (matrix) {
      types.forEach(t => { scores[t] += matrix[t]; });
    }
  });

  // Q2 期間補正
  const dBonus = DURATION_BONUS[duration] || {};
  types.forEach(t => { scores[t] += dBonus[t] ?? 0; });

  // Q3 同行者補正
  const cBonus = COMPANION_BONUS[companion] || {};
  types.forEach(t => { scores[t] += cBonus[t] ?? 0; });

  const maxScore = Math.max(...types.map(t => scores[t]));

  // Q1で複数の異なるジャンルを幅広く選んだ場合（上位2タイプの差が僅か かつ 3種以上選択）はオールラウンド
  const sortedScores = [...types].sort((a, b) => scores[b] - scores[a]);
  const topDiff = scores[sortedScores[0]] - scores[sortedScores[1]];
  if (interests.length >= 3 && topDiff <= 2 && sortedScores[0] !== "allround") {
    return "allround";
  }

  // 最高スコアのタイプを選ぶ（Q1スコアが圧倒的なため allround 以外が優先される）
  for (const t of types) {
    if (t !== "allround" && scores[t] === maxScore) return t;
  }
  if (scores["allround"] === maxScore) return "allround";
  return sortedScores[0] as TravelTypeKey;
}

function generatePlan(
  interests: string[],
  duration: string,
  companion: string
): { travelStyle: string; typeKey: TravelTypeKey; plan: RecommendedPlan } {
  const typeKey = calcTravelType(interests, duration, companion);
  const typeData = TRAVEL_TYPE_DATA[typeKey];

  const plan: RecommendedPlan = {
    title: typeData.planTitle,
    description: typeData.planDescription,
    spots: typeData.spotNames,
    tips: typeData.tips,
  };

  return { travelStyle: typeData.label, typeKey, plan };
}

export default function DiagnosisView({ onComplete }: DiagnosisViewProps) {
  const [step, setStep] = useState<Step>("interests");
  const [interests, setInterests] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>("");
  const [companion, setCompanion] = useState<string>("");
  const [result, setResult] = useState<{ travelStyle: string; typeKey: TravelTypeKey; plan: RecommendedPlan } | null>(null);

  const handleInterestToggle = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === "interests" && interests.length > 0) {
      setStep("duration");
    } else if (step === "duration" && duration) {
      setStep("companion");
    } else if (step === "companion" && companion) {
      const generated = generatePlan(interests, duration, companion);
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
        budget: "",
        travelStyle: result.travelStyle,
        recommendedPlan: result.plan,
      });
    }
  };

  const progress: Record<Step, number> = {
    interests: 30,
    duration: 60,
    companion: 85,
    result: 100,
  };

  const typeData = result ? TRAVEL_TYPE_DATA[result.typeKey] : null;

  const canNext =
    (step === "interests" && interests.length > 0) ||
    (step === "duration" && !!duration) ||
    (step === "companion" && !!companion);

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
      <div style={{ padding: "48px 24px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#1f2937", marginBottom: "4px" }}>
          {step === "result" ? "診断結果" : "旅の好み診断"}
        </h1>
        <p style={{ fontSize: "13px", color: "#6b7280" }}>
          {step === "result" ? "あなたにぴったりの旅スタイル" : "伝統文化の旅をご提案します"}
        </p>

        {step !== "result" && (
          <>
            <div
              style={{
                marginTop: "16px",
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
            <p style={{ fontSize: "12px", color: "#ec4899", marginTop: "6px" }}>
              {step === "interests" ? "Q1 / 3" : step === "duration" ? "Q2 / 3" : "Q3 / 3"}
            </p>
          </>
        )}
      </div>

      {/* コンテンツ */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 120px" }}>

        {/* Q1 興味 */}
        {step === "interests" && (
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
              伝統文化の旅でしたいことは？
            </h2>
            <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px" }}>複数選択できます</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {interestOptions.map(option => {
                const isSelected = interests.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleInterestToggle(option.id)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "16px",
                      border: isSelected ? "2px solid #ec4899" : "2px solid #e5e7eb",
                      backgroundColor: isSelected ? "#fdf2f8" : "white",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "26px", flexShrink: 0 }}>{option.emoji}</span>
                    <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151", lineHeight: "1.4" }}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <span style={{ marginLeft: "auto", color: "#ec4899", fontSize: "18px", flexShrink: 0 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Q2 旅行期間 */}
        {step === "duration" && (
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#374151", marginBottom: "20px" }}>
              何泊の旅行ですか？
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {durationOptions.map(option => {
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
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "16px", fontWeight: "600", color: "#374151", display: "block" }}>
                        {option.label}
                      </span>
                      <span style={{ fontSize: "13px", color: "#9ca3af" }}>{option.description}</span>
                    </div>
                    {isSelected && <span style={{ color: "#ec4899", fontSize: "20px" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Q3 同行者 */}
        {step === "companion" && (
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#374151", marginBottom: "20px" }}>
              誰と行きますか？
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {companionOptions.map(option => {
                const isSelected = companion === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setCompanion(option.id)}
                    style={{
                      padding: "20px 16px",
                      borderRadius: "16px",
                      border: isSelected ? "2px solid #ec4899" : "2px solid #e5e7eb",
                      backgroundColor: isSelected ? "#fdf2f8" : "white",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>{option.emoji}</span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 結果 */}
        {step === "result" && result && typeData && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* タイプカード */}
            <div
              style={{
                background: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
                borderRadius: "20px",
                padding: "28px 24px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>{typeData.emoji}</span>
              <p style={{ fontSize: "13px", color: "#ec4899", marginBottom: "6px" }}>あなたの旅行タイプは</p>
              <h2 style={{ fontSize: "26px", fontWeight: "bold", color: "#be185d", marginBottom: "12px" }}>
                {typeData.label}
              </h2>
              <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.7" }}>
                {typeData.description}
              </p>
            </div>

            {/* おすすめカテゴリ */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
                🗂 おすすめカテゴリ
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {typeData.categories.map((cat, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: "#fce7f3",
                      color: "#be185d",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                ))}
              </div>
            </div>

            {/* おすすめプラン */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                📍 {result.plan.title}
              </h3>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "14px", lineHeight: "1.6" }}>
                {result.plan.description}
              </p>
              <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
                おすすめスポット
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {result.plan.spots.map((spot, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      backgroundColor: "#fdf2f8",
                      borderRadius: "10px",
                      fontSize: "14px",
                      color: "#374151",
                    }}
                  >
                    <span style={{ color: "#ec4899", fontWeight: "600", fontSize: "13px" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {spot}
                  </div>
                ))}
              </div>
            </div>

            {/* 旅のヒント */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
                💡 旅のヒント
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {result.plan.tips.map((tip, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      paddingLeft: "18px",
                      position: "relative",
                      lineHeight: "1.6",
                    }}
                  >
                    <span style={{ position: "absolute", left: 0, color: "#ec4899" }}>•</span>
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
          padding: "16px 24px 36px",
          backgroundColor: "white",
          borderTop: "1px solid #f3f4f6",
        }}
      >
        {step !== "result" ? (
          <button
            onClick={handleNext}
            disabled={!canNext}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: canNext ? "#ec4899" : "#e5e7eb",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: canNext ? "pointer" : "default",
              transition: "background-color 0.2s",
            }}
          >
            次へ
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", margin: 0 }}>
              ✨ あなたのタイプに合わせたスポットを地図に表示します
            </p>
            <button
              onClick={handleComplete}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #ec4899, #be185d)",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(236, 72, 153, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>地図でスポットを見る</span>
              <span>🗺️</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
