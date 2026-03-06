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

type TravelTypeKey = "history" | "food" | "experience" | "healing" | "allround";

// Q1 興味（複数選択）
const interestOptions = [
  { id: "sightseeing", label: "歴史的な場所・建物を見て回りたい", emoji: "🏯" },
  { id: "food",        label: "郷土料理・食文化を楽しみたい",       emoji: "🍱" },
  { id: "hands_on",   label: "伝統工芸・体験プログラムに参加したい", emoji: "🎨" },
  { id: "culture",    label: "アイヌなど先住民族文化を学びたい",    emoji: "🪶" },
  { id: "healing",    label: "温泉・神社・祭りでゆっくりしたい",    emoji: "♨️" },
];

// Q2 旅行期間
const durationOptions = [
  { id: "short",    label: "1〜2泊",   description: "短期滞在" },
  { id: "medium",   label: "3〜4泊",   description: "ゆっくり主要スポットを回る" },
  { id: "long",     label: "5〜6泊",   description: "じっくり北海道を満喫" },
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
// Q1の選択が結果に最も強く反映されるよう主要タイプに高いスコアを設定
const SCORE_MATRIX: Record<string, Record<TravelTypeKey, number>> = {
  sightseeing: { history: 6, food: 0, experience: 1, healing: 1, allround: 0 },
  food:        { history: 0, food: 6, experience: 1, healing: 1, allround: 0 },
  hands_on:    { history: 1, food: 0, experience: 6, healing: 0, allround: 0 },
  culture:     { history: 3, food: 0, experience: 3, healing: 1, allround: 0 },
  healing:     { history: 0, food: 1, experience: 0, healing: 6, allround: 0 },
};

// Q2 期間補正（タイブレーカー程度）
const DURATION_BONUS: Record<string, Partial<Record<TravelTypeKey, number>>> = {
  short:    {},
  medium:   { experience: 1 },
  long:     { experience: 1, history: 1 },
  extended: { allround: 2 },
};

// Q3 同行者補正（タイブレーカー）
const COMPANION_BONUS: Record<string, Partial<Record<TravelTypeKey, number>>> = {
  solo:    { history: 1 },
  couple:  { healing: 1 },
  family:  { experience: 1 },
  friends: { food: 1 },
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
  history: {
    label: "歴史・景観探訪者",
    emoji: "🏯",
    description: "歴史的な建物や景観に魅了されるあなた。北海道の開拓史から和の文化まで、時代を超えた物語を旅しましょう。",
    tips: [
      "城や洋館は午前中の光が美しくおすすめです",
      "ガイドツアーに参加すると歴史の深みが増します",
      "史跡は複数箇所をまとめて巡ると効率的です",
      "写真撮影は開館直後が空いていておすすめ",
    ],
    spotNames: ["五稜郭", "松前城", "旧道庁（赤レンガ）", "旧開拓使函館支庁書籍庫", "函館元町エリア"],
    categories: [
      { label: "史跡・城・文化財", emoji: "🏯" },
      { label: "博物館・資料館", emoji: "🏛️" },
      { label: "運河・町並み", emoji: "🌆" },
    ],
    planTitle: "北海道歴史・景観巡りプラン",
    planDescription: "開拓時代の面影が残る函館・小樽・札幌を中心に、歴史建築と文化財を巡る旅。",
  },
  food: {
    label: "食文化グルメ派",
    emoji: "🍱",
    description: "食を通じて文化を感じるあなた。アイヌの伝統食から開拓時代のグルメまで、北海道ならではの食体験が待っています。",
    tips: [
      "朝市は早朝が新鮮でおすすめです",
      "郷土料理は地元の小さな食堂が本場の味",
      "酒造・ワイナリー見学では試飲も楽しめます",
      "食材の旬を事前に調べておくとより楽しめます",
    ],
    spotNames: ["サッポロビール園", "函館朝市", "二条市場", "小樽運河倉庫群", "帯広・十勝グルメエリア"],
    categories: [
      { label: "郷土料理・食文化", emoji: "🍱" },
      { label: "市場・朝市", emoji: "🐟" },
      { label: "酒蔵・ワイナリー", emoji: "🍶" },
    ],
    planTitle: "北海道食文化探訪プラン",
    planDescription: "市場・朝市・地元食堂・酒造を巡り、北海道の食文化を舌で体感する旅。",
  },
  experience: {
    label: "伝統体験家",
    emoji: "🎨",
    description: "作ること・体験することが好きなあなた。アイヌ工芸から和の伝統技術まで、手と心で文化を感じましょう。",
    tips: [
      "体験プログラムは事前予約が必要なものが多いです",
      "作った作品は旅の思い出として持ち帰れます",
      "ウポポイは1日かけてじっくり回るのがおすすめ",
      "子ども向け体験も充実しているスポットが多いです",
    ],
    spotNames: ["ウポポイ（民族共生象徴空間）", "二風谷アイヌ文化博物館", "北海道開拓の村", "小樽芸術村", "江戸時代村（登別）"],
    categories: [
      { label: "伝統工芸・体験", emoji: "🎨" },
      { label: "アイヌ文化", emoji: "🪶" },
      { label: "ものづくり体験", emoji: "🏺" },
    ],
    planTitle: "伝統文化・体験プラン",
    planDescription: "アイヌ工芸や開拓文化の体験プログラムに参加し、北海道の文化を手で感じる旅。",
  },
  healing: {
    label: "癒し・信仰派",
    emoji: "♨️",
    description: "温泉や神社、自然の中で心を休めたいあなた。北海道の豊かな自然と信仰の場が、深い癒しをもたらします。",
    tips: [
      "温泉は夕方〜夜の入浴が疲れを癒してくれます",
      "神社は早朝参拝が静かで清々しいです",
      "祭りの時期に合わせて旅程を組むのがおすすめ",
      "日帰り入浴ができる施設も多いのでぜひ立ち寄りを",
    ],
    spotNames: ["北海道神宮", "阿寒湖温泉", "定山渓温泉", "洞爺湖温泉", "函館ハリストス正教会"],
    categories: [
      { label: "神社仏閣・教会", emoji: "⛩️" },
      { label: "温泉・湯治", emoji: "♨️" },
      { label: "パワースポット", emoji: "🌿" },
    ],
    planTitle: "北海道癒し・信仰の旅プラン",
    planDescription: "温泉地と神社・教会を組み合わせ、心と体を癒す静かな北海道の旅。",
  },
  allround: {
    label: "オールラウンド文化人",
    emoji: "🌸",
    description: "好奇心旺盛で幅広い文化に興味があるあなた。北海道の多彩な伝統文化を贅沢に楽しみましょう。",
    tips: [
      "エリアごとにテーマを決めると回りやすいです",
      "北海道は広いので移動手段の計画が重要です",
      "季節ごとに見どころが変わるので旅の時期も重要",
      "観光情報センターを活用すると穴場情報が手に入ります",
    ],
    spotNames: ["ウポポイ", "五稜郭", "北海道開拓の村", "北海道神宮", "小樽芸術村"],
    categories: [
      { label: "アイヌ文化", emoji: "🪶" },
      { label: "史跡・建造物", emoji: "🏯" },
      { label: "伝統工芸・体験", emoji: "🎨" },
      { label: "神社・温泉", emoji: "♨️" },
    ],
    planTitle: "北海道伝統文化オールラウンドプラン",
    planDescription: "アイヌ文化・歴史・食・体験・温泉をバランスよく取り入れた欲張りプラン。",
  },
};

// スコアリング判定
function calcTravelType(
  interests: string[],
  duration: string,
  companion: string
): TravelTypeKey {
  const types: TravelTypeKey[] = ["history", "food", "experience", "healing", "allround"];
  const scores: Record<TravelTypeKey, number> = { history: 0, food: 0, experience: 0, healing: 0, allround: 0 };

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
