"use client";

import { useState } from "react";
import { recommendedSpots, getRecommendedSpotIds, type Spot } from "../data/spots";
import type { DiagnosisResult } from "./DiagnosisView";
import SpotDetailSheet from "./SpotDetailSheet";

interface PlanViewProps {
  diagnosisResult: DiagnosisResult | null;
  onJumpToSpot: (spotId: number) => void;
  favoriteSpotIds: number[];
  onToggleFavorite: (spotId: number) => void;
  onSpotView: (spot: { id: number; name: string; category: string }) => void;
  onStartDiagnosis?: () => void;
  onOpenLanguageHelper?: (spotName: string) => void;
}

type DayKey = "short" | "medium" | "long" | "extended";
type PaceKey = "slow" | "active";
type SeasonKey = "spring" | "summer" | "autumn" | "winter";

const DAY_COUNT: Record<DayKey, number> = {
  short: 2,
  medium: 4,
  long: 6,
  extended: 8,
};

const SPOTS_PER_DAY: Record<PaceKey, number> = {
  slow: 2,
  active: 3,
};

// 季節ごとに優先するスポットID
const SEASON_PRIORITY: Record<SeasonKey, number[]> = {
  spring: [2, 14, 5, 10, 6],   // 弘前城桜・角館桜・中尊寺・松島・毛越寺
  summer: [3, 13, 15, 21, 18], // ねぶた・七夕・竿燈・花笠・山寺
  autumn: [18, 14, 10, 5, 23], // 山寺紅葉・角館・松島・中尊寺・大内宿
  winter: [16, 19, 4, 22, 23], // 乳頭温泉・銀山温泉・恐山・会津城・大内宿雪
};

const interestOptions = [
  { id: "performing_arts", label: "伝統芸能・踊り・祭り", emoji: "🎭" },
  { id: "crafts",          label: "伝統工芸・ものづくり", emoji: "🏺" },
];

const dayOptions = [
  { id: "short",    label: "1〜2泊", desc: "週末旅行" },
  { id: "medium",   label: "3〜4泊", desc: "主要スポットを巡る" },
  { id: "long",     label: "5〜6泊", desc: "じっくり満喫" },
  { id: "extended", label: "1週間以上", desc: "深く探訪" },
];

const companionOptions = [
  { id: "solo",    label: "一人旅",       emoji: "🚶" },
  { id: "couple",  label: "恋人・夫婦",   emoji: "💑" },
  { id: "family",  label: "家族（子連れ）", emoji: "👨‍👩‍👧‍👦" },
  { id: "friends", label: "友人グループ", emoji: "👫" },
];

const paceOptions = [
  { id: "slow",   label: "のんびり",   desc: "1日2スポット・余裕たっぷり", emoji: "🌿" },
  { id: "active", label: "アクティブ", desc: "1日3スポット・充実満載",     emoji: "⚡" },
];

const seasonOptions = [
  { id: "spring", label: "春", emoji: "🌸" },
  { id: "summer", label: "夏", emoji: "☀️" },
  { id: "autumn", label: "秋", emoji: "🍂" },
  { id: "winter", label: "冬", emoji: "❄️" },
];

function generateDayPlan(
  interests: string[],
  days: string,
  pace: string,
  season: string
): { day: number; spots: Spot[] }[] {
  const dayCount = DAY_COUNT[days as DayKey] || 2;
  const spotsPerDay = SPOTS_PER_DAY[pace as PaceKey] || 2;
  const totalNeeded = dayCount * spotsPerDay;

  // 興味からベーススポットを取得
  let spotIds = getRecommendedSpotIds(interests);

  // 季節優先スポットを前に並べ替え
  const seasonPriority = SEASON_PRIORITY[season as SeasonKey] || [];
  const reordered = [
    ...seasonPriority.filter(id => spotIds.includes(id)),
    ...spotIds.filter(id => !seasonPriority.includes(id)),
    ...seasonPriority.filter(id => !spotIds.includes(id)), // 季節優先で足りない場合は追加
  ];
  spotIds = [...new Set(reordered)];

  // それでも足りない場合は全スポットから補完
  if (spotIds.length < totalNeeded) {
    const allIds = recommendedSpots.map(s => s.id);
    const extras = allIds.filter(id => !spotIds.includes(id));
    spotIds = [...spotIds, ...extras];
  }

  spotIds = spotIds.slice(0, totalNeeded);

  const spotMap = new Map(recommendedSpots.map(s => [s.id, s]));
  const spots = spotIds.map(id => spotMap.get(id)).filter(Boolean) as Spot[];

  const dayPlans: { day: number; spots: Spot[] }[] = [];
  for (let d = 0; d < dayCount; d++) {
    const daySpots = spots.slice(d * spotsPerDay, (d + 1) * spotsPerDay);
    if (daySpots.length > 0) {
      dayPlans.push({ day: d + 1, spots: daySpots });
    }
  }
  return dayPlans;
}

export default function PlanView({
  diagnosisResult,
  onJumpToSpot,
  favoriteSpotIds,
  onToggleFavorite,
  onSpotView,
  onStartDiagnosis,
  onOpenLanguageHelper,
}: PlanViewProps) {
  const [interests, setInterests] = useState<string[]>(diagnosisResult?.interests || []);
  const [days, setDays] = useState<string>(diagnosisResult?.duration || "");
  const [companion, setCompanion] = useState<string>(diagnosisResult?.companion || "");
  const [pace, setPace] = useState<string>("slow");
  const [season, setSeason] = useState<string>("summer");
  const [tripStartDate, setTripStartDate] = useState<string>("");
  const [dayPlan, setDayPlan] = useState<{ day: number; spots: Spot[] }[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);

  const getDateForDay = (day: number): string => {
    if (!tripStartDate) return "";
    const date = new Date(tripStartDate);
    date.setDate(date.getDate() + day - 1);
    return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
  };

  const canGenerate = interests.length > 0 && !!days && !!companion;

  const handleGenerate = () => {
    const plan = generateDayPlan(interests, days, pace, season);
    setDayPlan(plan);
    setShowResult(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setResultVisible(true));
    });
  };

  const handleCloseResult = () => {
    setResultVisible(false);
    setTimeout(() => setShowResult(false), 300);
  };

  const handleSpotTap = (spot: Spot) => {
    setSelectedSpot(spot);
    onSpotView({ id: spot.id, name: spot.name, category: spot.category });
  };

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const dayLabel = dayOptions.find(d => d.id === days)?.label ?? "";
  const paceLabel = paceOptions.find(p => p.id === pace)?.label ?? "";
  const seasonEmoji = seasonOptions.find(s => s.id === season)?.emoji ?? "";

  // ---- フォーム画面（常に表示） + 結果シート（重ねて表示） ----
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gray-50 overflow-y-auto" style={{ paddingBottom: "80px" }}>
        {/* ヘッダー */}
        <div className="text-white px-6 pt-14 pb-8" style={{ background: "linear-gradient(135deg, #e88fa3, #b85f74)" }}>
          <p className="text-xs mb-1 font-medium tracking-wide uppercase" style={{ color: "#f7dfe5" }}>Plan Generator</p>
          <h1 className="text-2xl font-bold mb-1">旅プランを作る</h1>
          <p className="text-sm" style={{ color: "#f7dfe5" }}>条件を選ぶと東北旅程を自動生成します</p>
        </div>

        <div className="px-4 py-5 space-y-6">

          {/* 診断バナー */}
          {onStartDiagnosis && (
            <button
              onClick={onStartDiagnosis}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left"
              style={{ background: "linear-gradient(135deg, #fdf3f5, #f7dfe5)", border: "1.5px solid #f3b6c3" }}
            >
              <span className="text-2xl">🧭</span>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "#b85f74" }}>
                  {diagnosisResult ? "診断をやり直す" : "旅タイプ診断を受ける"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#e88fa3" }}>
                  {diagnosisResult
                    ? `現在のタイプ：${diagnosisResult.travelStyle ?? "診断済み"} → 条件に自動反映されます`
                    : "3問の診断で条件が自動入力されます"}
                </p>
              </div>
              <span style={{ color: "#e88fa3" }}>›</span>
            </button>
          )}

          {/* 興味・目的 */}
          <section>
            <h2 className="font-bold text-gray-800 mb-1">興味・目的</h2>
            <p className="text-xs text-gray-500 mb-3">複数選択できます</p>
            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map(opt => {
                const sel = interests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleInterest(opt.id)}
                    className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium text-left transition-colors"
                    style={{
                      border: sel ? "2px solid #e88fa3" : "2px solid #e5e7eb",
                      backgroundColor: sel ? "#fdf3f5" : "white",
                      color: sel ? "#b85f74" : "#374151",
                    }}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="flex-1 leading-tight text-xs">{opt.label}</span>
                    {sel && <span style={{ color: "#e88fa3" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 旅行日数 */}
          <section>
            <h2 className="font-bold text-gray-800 mb-3">旅行日数</h2>
            <div className="grid grid-cols-2 gap-2">
              {dayOptions.map(opt => {
                const sel = days === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setDays(opt.id)}
                    className="p-3 rounded-xl text-left transition-colors"
                    style={{
                      border: sel ? "2px solid #e88fa3" : "2px solid #e5e7eb",
                      backgroundColor: sel ? "#fdf3f5" : "white",
                    }}
                  >
                    <div className="font-bold text-sm" style={{ color: sel ? "#b85f74" : "#1f2937" }}>{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 同行者 */}
          <section>
            <h2 className="font-bold text-gray-800 mb-3">同行者</h2>
            <div className="grid grid-cols-2 gap-2">
              {companionOptions.map(opt => {
                const sel = companion === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setCompanion(opt.id)}
                    className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      border: sel ? "2px solid #e88fa3" : "2px solid #e5e7eb",
                      backgroundColor: sel ? "#fdf3f5" : "white",
                      color: sel ? "#b85f74" : "#374151",
                    }}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ペース */}
          <section>
            <h2 className="font-bold text-gray-800 mb-3">旅のペース</h2>
            <div className="space-y-2">
              {paceOptions.map(opt => {
                const sel = pace === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPace(opt.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-colors"
                    style={{
                      border: sel ? "2px solid #e88fa3" : "2px solid #e5e7eb",
                      backgroundColor: sel ? "#fdf3f5" : "white",
                    }}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <div>
                      <div className="font-bold text-sm" style={{ color: sel ? "#b85f74" : "#1f2937" }}>{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 旅行季節 */}
          <section>
            <h2 className="font-bold text-gray-800 mb-3">旅行季節</h2>
            <div className="grid grid-cols-4 gap-2">
              {seasonOptions.map(opt => {
                const sel = season === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSeason(opt.id)}
                    className="p-3 rounded-xl text-center transition-colors"
                    style={{
                      border: sel ? "2px solid #e88fa3" : "2px solid #e5e7eb",
                      backgroundColor: sel ? "#fdf3f5" : "white",
                    }}
                  >
                    <div className="text-2xl">{opt.emoji}</div>
                    <div className="text-xs font-medium mt-1" style={{ color: sel ? "#b85f74" : "#374151" }}>
                      {opt.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 旅行開始日（任意） */}
          <section>
            <h2 className="font-bold text-gray-800 mb-1">旅行開始日 <span className="text-xs font-normal text-gray-400">（任意）</span></h2>
            <p className="text-xs text-gray-500 mb-3">入力するとプランに実際の日付が表示されます</p>
            <div
              className="flex items-center gap-3 bg-white rounded-xl p-4"
              style={{ border: tripStartDate ? "2px solid #e88fa3" : "2px solid #e5e7eb" }}
            >
              <span className="text-xl">📅</span>
              <input
                type="date"
                value={tripStartDate}
                onChange={e => setTripStartDate(e.target.value)}
                className="flex-1 outline-none text-sm font-medium"
                style={{ color: tripStartDate ? "#1f2937" : "#9ca3af", background: "transparent", border: "none" }}
              />
              {tripStartDate && (
                <button
                  onClick={() => setTripStartDate("")}
                  className="text-gray-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </section>

          {/* 生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
            style={{
              backgroundColor: canGenerate ? "#e88fa3" : "#e5e7eb",
              color: canGenerate ? "white" : "#9ca3af",
              boxShadow: canGenerate ? "0 4px 14px rgba(232,143,163,0.3)" : "none",
            }}
          >
            {canGenerate ? "✨ プランを生成する" : "興味・日数・同行者を選んでください"}
          </button>
        </div>
      </div>

      {/* ── 結果シート（下からスライドアップ） ── */}
      {showResult && (
        <div
          className="absolute inset-0 z-40"
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            opacity: resultVisible ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          onClick={handleCloseResult}
        />
      )}
      {showResult && (
        <div
          className="absolute left-0 right-0 bottom-0 z-50 bg-gray-50 overflow-y-auto rounded-t-3xl"
          style={{
            height: "92vh",
            paddingBottom: "80px",
            transform: resultVisible ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s ease-out",
          }}
        >
          {/* ヘッダー */}
          <div className="text-white px-6 pt-8 pb-8 rounded-t-3xl relative" style={{ background: "linear-gradient(135deg, #e88fa3, #b85f74)" }}>
            {/* 閉じるボタン */}
            <button
              onClick={handleCloseResult}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              ×
            </button>
            {/* ドラッグバー */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/40" />
            <p className="text-xs mb-1 font-medium tracking-wide uppercase" style={{ color: "#f7dfe5" }}>Your Travel Plan</p>
            <h1 className="text-2xl font-bold mb-2">東北旅プラン</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs rounded-full px-3 py-1" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>{seasonEmoji} {dayLabel}</span>
              <span className="text-xs rounded-full px-3 py-1" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>{paceLabel}</span>
              {companion && (
                <span className="text-xs rounded-full px-3 py-1" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  {companionOptions.find(c => c.id === companion)?.emoji} {companionOptions.find(c => c.id === companion)?.label}
                </span>
              )}
            </div>
          </div>

          {/* 日別プラン */}
          <div className="px-4 py-5 space-y-8">
            {dayPlan.map(({ day, spots }) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-white text-sm font-bold px-4 py-1.5 rounded-full" style={{ backgroundColor: "#e88fa3" }}>
                    DAY {day}
                  </div>
                  {getDateForDay(day) && (
                    <span className="text-sm font-medium text-gray-500">{getDateForDay(day)}</span>
                  )}
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="space-y-3">
                  {spots.map((spot, idx) => (
                    <div key={spot.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "#fdf3f5" }}>
                            <span className="font-bold text-sm" style={{ color: "#e88fa3" }}>{idx + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-gray-900 text-sm">{spot.name}</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#fdf3f5", color: "#b85f74" }}>{spot.category}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{spot.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleSpotTap(spot)}
                            className="flex-1 text-xs rounded-xl py-2 font-medium"
                            style={{ color: "#e88fa3", border: "1px solid #f3b6c3" }}
                          >
                            詳細
                          </button>
                          <button
                            onClick={() => onJumpToSpot(spot.id)}
                            className="flex-1 text-xs text-white rounded-xl py-2 font-medium flex items-center justify-center gap-1"
                            style={{ backgroundColor: "#e88fa3" }}
                          >
                            🗺️ 地図
                          </button>
                          {onOpenLanguageHelper && (
                            <button
                              onClick={() => onOpenLanguageHelper(spot.name)}
                              className="flex-1 text-xs rounded-xl py-2 font-medium flex items-center justify-center gap-1"
                              style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                            >
                              🌐 予約相談
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 作り直しボタン */}
          <div className="px-4 pb-6">
            <button
              onClick={handleCloseResult}
              className="w-full py-3.5 text-gray-600 border border-gray-200 rounded-2xl font-medium bg-white text-sm"
            >
              フォームに戻る
            </button>
          </div>
        </div>
      )}

      {/* スポット詳細シート */}
      {selectedSpot && (
        <SpotDetailSheet
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
          isFavorite={favoriteSpotIds.includes(selectedSpot.id)}
          onToggleFavorite={() => onToggleFavorite(selectedSpot.id)}
          onOpenLanguageHelper={onOpenLanguageHelper}
          reserveMainBottomNav={false}
        />
      )}
    </div>
  );
}
