"use client";

import { useState } from "react";
import type { DiagnosisTravelTypeKey } from "../i18n/diagnosisQuizStrings";
import type { Translations } from "../i18n/translations";
import { useLanguage } from "../i18n/LanguageContext";
import { CloseIcon } from "./icons";

interface DiagnosisViewProps {
  onComplete: (result: DiagnosisResult) => void;
  /** 診断中止（バツ・質問中のみ表示）で前の画面へ */
  onCancel?: () => void;
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

type TravelTypeKey = DiagnosisTravelTypeKey;

const INTEREST_IDS = [
  { id: "performing_arts" as const, emoji: "🎭" },
  { id: "crafts" as const, emoji: "🏺" },
];

const DURATION_IDS = ["short", "medium", "long", "extended"] as const;

const COMPANION_IDS = [
  { id: "solo" as const, emoji: "🚶" },
  { id: "couple" as const, emoji: "💑" },
  { id: "family" as const, emoji: "👨‍👩‍👧‍👦" },
  { id: "friends" as const, emoji: "👫" },
] as const;

// スコアリングマトリクス（Q1選択 → タイプ別加算）
const SCORE_MATRIX: Record<string, Record<TravelTypeKey, number>> = {
  performing_arts: { performing_arts: 6, crafts: 0, allround: 1 },
  crafts: { performing_arts: 0, crafts: 6, allround: 1 },
};

// Q2 期間補正（タイブレーカー程度）
const DURATION_BONUS: Record<string, Partial<Record<TravelTypeKey, number>>> = {
  short: {},
  medium: { crafts: 1 },
  long: { allround: 1 },
  extended: { allround: 2 },
};

// Q3 同行者補正（タイブレーカー）
const COMPANION_BONUS: Record<string, Partial<Record<TravelTypeKey, number>>> = {
  solo: { crafts: 1 },
  couple: { performing_arts: 1 },
  family: { allround: 1 },
  friends: { performing_arts: 1 },
};

function buildRecommendedPlan(t: Translations, typeKey: TravelTypeKey): RecommendedPlan {
  const td = t.diagnosis.traditionalQuiz.types[typeKey];
  return {
    title: td.planTitle,
    description: td.planDescription,
    spots: [...td.spots],
    tips: [...td.tips],
  };
}

// スコアリング判定
function calcTravelType(interests: string[], duration: string, companion: string): TravelTypeKey {
  const types: TravelTypeKey[] = ["performing_arts", "crafts", "allround"];
  const scores: Record<TravelTypeKey, number> = { performing_arts: 0, crafts: 0, allround: 0 };

  interests.forEach(interest => {
    const matrix = SCORE_MATRIX[interest];
    if (matrix) {
      types.forEach(ty => {
        scores[ty] += matrix[ty];
      });
    }
  });

  const dBonus = DURATION_BONUS[duration] || {};
  types.forEach(ty => {
    scores[ty] += dBonus[ty] ?? 0;
  });

  const cBonus = COMPANION_BONUS[companion] || {};
  types.forEach(ty => {
    scores[ty] += cBonus[ty] ?? 0;
  });

  const maxScore = Math.max(...types.map(ty => scores[ty]));

  const sortedScores = [...types].sort((a, b) => scores[b] - scores[a]);
  const topDiff = scores[sortedScores[0]] - scores[sortedScores[1]];
  if (interests.length >= 3 && topDiff <= 2 && sortedScores[0] !== "allround") {
    return "allround";
  }

  for (const ty of types) {
    if (ty !== "allround" && scores[ty] === maxScore) return ty;
  }
  if (scores.allround === maxScore) return "allround";
  return sortedScores[0] as TravelTypeKey;
}

function generatePlan(
  interests: string[],
  duration: string,
  companion: string,
  t: Translations
): { travelStyle: string; typeKey: TravelTypeKey; plan: RecommendedPlan } {
  const typeKey = calcTravelType(interests, duration, companion);
  const td = t.diagnosis.traditionalQuiz.types[typeKey];
  return {
    travelStyle: td.travelTypeLabel,
    typeKey,
    plan: buildRecommendedPlan(t, typeKey),
  };
}

export default function DiagnosisView({ onComplete, onCancel }: DiagnosisViewProps) {
  const { t } = useLanguage();
  const q = t.diagnosis.traditionalQuiz;
  const [step, setStep] = useState<Step>("interests");
  const [interests, setInterests] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>("");
  const [companion, setCompanion] = useState<string>("");
  const [resultTypeKey, setResultTypeKey] = useState<TravelTypeKey | null>(null);

  const handleInterestToggle = (id: string) => {
    setInterests(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const handleNext = () => {
    if (step === "interests" && interests.length > 0) {
      setStep("duration");
    } else if (step === "duration" && duration) {
      setStep("companion");
    } else if (step === "companion" && companion) {
      setResultTypeKey(calcTravelType(interests, duration, companion));
      setStep("result");
    }
  };

  const typeBundle = resultTypeKey ? q.types[resultTypeKey] : null;
  const planPreview = resultTypeKey ? buildRecommendedPlan(t, resultTypeKey) : null;

  const handleComplete = () => {
    if (resultTypeKey && planPreview) {
      onComplete({
        interests,
        duration,
        companion,
        budget: "",
        travelStyle: q.types[resultTypeKey].travelTypeLabel,
        recommendedPlan: planPreview,
      });
    }
  };

  const progress: Record<Step, number> = {
    interests: 30,
    duration: 60,
    companion: 85,
    result: 100,
  };

  const canNext =
    (step === "interests" && interests.length > 0) ||
    (step === "duration" && !!duration) ||
    (step === "companion" && !!companion);

  const showCancelButton = Boolean(onCancel && step !== "result");

  const stepProgressLabel =
    step === "interests" ? q.progressQ1 : step === "duration" ? q.progressQ2 : q.progressQ3;

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
      {showCancelButton && (
        <button
          type="button"
          onClick={onCancel}
          aria-label={t.diagnosis.cancelDiagnosis}
          style={{
            position: "absolute",
            top: "max(12px, env(safe-area-inset-top, 0px))",
            right: "max(16px, env(safe-area-inset-right, 0px))",
            zIndex: 10,
            padding: "8px",
            borderRadius: "9999px",
            border: "none",
            background: "rgba(255,255,255,0.9)",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CloseIcon size={24} color="#666" />
        </button>
      )}

      <div
        style={{
          padding: showCancelButton ? "52px 24px 20px" : "48px 24px 20px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#1f2937", marginBottom: "4px" }}>
          {step === "result" ? t.diagnosis.resultTitle : t.diagnosis.title}
        </h1>
        <p style={{ fontSize: "13px", color: "#6b7280" }}>
          {step === "result" ? q.subtitleResult : q.subtitleDuring}
        </p>

        {step !== "result" && (
          <>
            <div
              style={{
                marginTop: "16px",
                height: "4px",
                backgroundColor: "#f7dfe5",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress[step]}%`,
                  height: "100%",
                  backgroundColor: "#e88fa3",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <p style={{ fontSize: "12px", color: "#e88fa3", marginTop: "6px" }}>{stepProgressLabel}</p>
          </>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 120px" }}>
        {step === "interests" && (
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>{q.q1Title}</h2>
            <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px" }}>{q.q1MultiHint}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {INTEREST_IDS.map(option => {
                const isSelected = interests.includes(option.id);
                const label = q.interests[option.id];
                return (
                  <button
                    key={option.id}
                    onClick={() => handleInterestToggle(option.id)}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "16px",
                      border: isSelected ? "2px solid #e88fa3" : "2px solid #e5e7eb",
                      backgroundColor: isSelected ? "#fdf3f5" : "white",
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
                      {label}
                    </span>
                    {isSelected && (
                      <span style={{ marginLeft: "auto", color: "#e88fa3", fontSize: "18px", flexShrink: 0 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "duration" && (
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#374151", marginBottom: "20px" }}>{q.q2Title}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {DURATION_IDS.map(did => {
                const option = q.durations[did];
                const isSelected = duration === did;
                return (
                  <button
                    key={did}
                    onClick={() => setDuration(did)}
                    style={{
                      padding: "20px",
                      borderRadius: "16px",
                      border: isSelected ? "2px solid #e88fa3" : "2px solid #e5e7eb",
                      backgroundColor: isSelected ? "#fdf3f5" : "white",
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
                    {isSelected && <span style={{ color: "#e88fa3", fontSize: "20px" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "companion" && (
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#374151", marginBottom: "20px" }}>{q.q3Title}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {COMPANION_IDS.map(option => {
                const isSelected = companion === option.id;
                const label = q.companions[option.id];
                return (
                  <button
                    key={option.id}
                    onClick={() => setCompanion(option.id)}
                    style={{
                      padding: "20px 16px",
                      borderRadius: "16px",
                      border: isSelected ? "2px solid #e88fa3" : "2px solid #e5e7eb",
                      backgroundColor: isSelected ? "#fdf3f5" : "white",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>{option.emoji}</span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#374151" }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "result" && resultTypeKey && typeBundle && planPreview && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #fdf3f5, #f7dfe5)",
                borderRadius: "20px",
                padding: "28px 24px",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "48px", display: "block", marginBottom: "12px" }}>{typeBundle.emoji}</span>
              <p style={{ fontSize: "13px", color: "#e88fa3", marginBottom: "6px" }}>{q.resultTypeIntro}</p>
              <h2 style={{ fontSize: "26px", fontWeight: "bold", color: "#b85f74", marginBottom: "12px" }}>
                {typeBundle.travelTypeLabel}
              </h2>
              <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.7" }}>{typeBundle.description}</p>
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
                {q.recommendedCategoriesTitle}
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {typeBundle.categories.map((cat, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: "#f7dfe5",
                      color: "#b85f74",
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

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                📍 {planPreview.title}
              </h3>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "14px", lineHeight: "1.6" }}>
                {planPreview.description}
              </p>
              <h4 style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
                {q.mapSpotsSectionTitle}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {planPreview.spots.map((spot, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      backgroundColor: "#fdf3f5",
                      borderRadius: "10px",
                      fontSize: "14px",
                      color: "#374151",
                    }}
                  >
                    <span style={{ color: "#e88fa3", fontWeight: "600", fontSize: "13px" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {spot}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
                {q.travelTipsTitle}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {planPreview.tips.map((tip, i) => (
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
                    <span style={{ position: "absolute", left: 0, color: "#e88fa3" }}>•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

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
              backgroundColor: canNext ? "#e88fa3" : "#e5e7eb",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              cursor: canNext ? "pointer" : "default",
              transition: "background-color 0.2s",
            }}
          >
            {t.common.next}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <p style={{ textAlign: "center", fontSize: "13px", color: "#9ca3af", margin: 0 }}>{q.completeNote}</p>
            <button
              onClick={handleComplete}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #e88fa3, #b85f74)",
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
              <span>{q.showOnMap}</span>
              <span>🗺️</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
