"use client";

import { useCallback, useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  getAllAchievementBadgeViews,
  type AchievementBadgeAxisId,
  type AchievementBadgeStats,
} from "../lib/achievementBadges";
import {
  getAchievementTitleForAxis,
  isAchievementAxisFullyComplete,
  loadSeenAchievementTitleAxes,
  markAchievementTitleAxisSeen,
  resolveAchievementTitleLabel,
} from "../lib/achievementTitles";

type AchievementBadgesSectionProps = AchievementBadgeStats;

const BADGE_GRID_COLUMNS = 2;
const BADGE_GRID_COLUMN_GAP_PX = 10;
const BADGE_GRID_ROW_GAP_PX = 12;

function badgeLabel(
  axisId: AchievementBadgeAxisId,
  m: {
    achievementBadgeSpotViews: string;
    achievementBadgeCoinsEarned: string;
    achievementBadgeLevel: string;
  }
): string {
  switch (axisId) {
    case "spot_views":
      return m.achievementBadgeSpotViews;
    case "coins_earned":
      return m.achievementBadgeCoinsEarned;
    case "level":
      return m.achievementBadgeLevel;
  }
}

function SegmentRing({
  tier,
  maxTier,
  activeColor,
  inactiveColor,
}: {
  tier: number;
  maxTier: number;
  activeColor: string;
  inactiveColor: string;
}) {
  const size = 76;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const gapDeg = maxTier <= 5 ? 10 : 8;
  const segDeg = (360 - gapDeg * maxTier) / maxTier;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ display: "block" }}>
      {Array.from({ length: maxTier }, (_, i) => {
        const start = -90 + i * (segDeg + gapDeg);
        const end = start + segDeg;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const x1 = cx + r * Math.cos(toRad(start));
        const y1 = cy + r * Math.sin(toRad(start));
        const x2 = cx + r * Math.cos(toRad(end));
        const y2 = cy + r * Math.sin(toRad(end));
        const largeArc = segDeg > 180 ? 1 : 0;
        const filled = i < tier;
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={filled ? activeColor : inactiveColor}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function AchievementBadgeTile({
  icon,
  tier,
  maxTier,
  progressPercent,
  nextThreshold,
  label,
  tierLabel,
  nextGoalTemplate,
  titleEarnedLabel,
  axisId,
  stats,
  showNotifyDot,
  onPress,
}: {
  icon: string;
  tier: number;
  maxTier: number;
  progressPercent: number;
  nextThreshold: number | null;
  label: string;
  tierLabel: string;
  nextGoalTemplate: string;
  titleEarnedLabel: string;
  axisId: AchievementBadgeAxisId;
  stats: AchievementBadgeStats;
  showNotifyDot: boolean;
  onPress: () => void;
}) {
  const titleUnlocked = isAchievementAxisFullyComplete(axisId, stats);
  const locked = tier === 0;
  const activeColor = locked ? "#e5e7eb" : "#e88fa3";
  const inactiveColor = "#f3f4f6";
  const nextGoalLabel =
    nextThreshold != null ? nextGoalTemplate.replace("{n}", nextThreshold.toLocaleString()) : null;
  const canOpenTitleCelebration = titleUnlocked && showNotifyDot;

  const ringBlock = (
    <div style={{ position: "relative", width: 76, height: 76 }} aria-hidden>
      
      
      <div style={{ position: "absolute", inset: 0 }}>
        <SegmentRing tier={tier} maxTier={maxTier} activeColor={activeColor} inactiveColor={inactiveColor} />
      </div>
      
      <div
        style={{
          position: "absolute",
          inset: 10,
          borderRadius: "50%",
          background: locked
            ? "linear-gradient(145deg, #f9fafb 0%, #f3f4f6 100%)"
            : "linear-gradient(145deg, #fff5f8 0%, #fce7f3 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: locked ? "inset 0 1px 2px rgba(0,0,0,0.04)" : "inset 0 1px 2px rgba(232,143,163,0.12)",
        }}
      >
        <span style={{ fontSize: "22px", lineHeight: 1, opacity: locked ? 0.45 : 1 }} aria-hidden>
          {icon}
        </span>
        <span
          style={{
            marginTop: "2px",
            fontSize: "11px",
            fontWeight: 900,
            color: locked ? "#9ca3af" : "#b85f74",
            lineHeight: 1,
          }}
        >
          {tierLabel}
        </span>
      </div>
      {showNotifyDot ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            width: "11px",
            height: "11px",
            borderRadius: "999px",
            backgroundColor: "#ef4444",
            border: "2px solid #ffffff",
            boxShadow: "0 0 0 1px rgba(239,68,68,0.35)",
          }}
        />
      ) : null}
    
    
    
    </div>
  );

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
      }}
    >
      {canOpenTitleCelebration ? (
        <button
          type="button"
          onClick={onPress}
          aria-label={`${label} ${titleEarnedLabel}`}
          style={{
            border: "none",
            background: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {ringBlock}
        </button>
      ) : (
        
        <div aria-label={`${label} ${tierLabel}`}>{ringBlock}</div>
        
      )}
      <p
        style={{
          margin: 0,
          fontSize: "10px",
          fontWeight: 800,
          color: "#374151",
          textAlign: "center",
          lineHeight: 1.35,
        }}
      >
        {label}
      </p>
      {titleUnlocked && !showNotifyDot ? (
        <p
          style={{
            margin: 0,
            fontSize: "9px",
            fontWeight: 800,
            color: "#b85f74",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {titleEarnedLabel}
        </p>
      ) : nextGoalLabel ? (
        <p style={{ margin: 0, fontSize: "9px", color: "#9ca3af", textAlign: "center", lineHeight: 1.3 }}>
          {nextGoalLabel}
        </p>
      ) : null}
      <div
        style={{
          width: "100%",
          height: "4px",
          borderRadius: "999px",
          backgroundColor: "#f3f4f6",
          overflow: "hidden",
        }}
        aria-hidden
      >
        
        <div
          style={{
            width: `${nextThreshold != null ? progressPercent : 100}%`,
            height: "100%",
            borderRadius: "999px",
            background:
              nextThreshold != null
                ? "linear-gradient(90deg, #fbcfe8, #e88fa3)"
                : "linear-gradient(90deg, #e88fa3, #f472b6)",
          }}
        />
        
      </div>
    </div>
  );
}

type TitleUnlockOverlayState = {
  axisId: AchievementBadgeAxisId;
  titleName: string;
};

export default function AchievementBadgesSection({
  spotViews,
  coinsEarnedTotal,
  playerLevel,
}: AchievementBadgesSectionProps) {
  const { language, t } = useLanguage();
  const m = t.mypage;
  const stats = useMemo(
    () => ({ spotViews, coinsEarnedTotal, playerLevel }),
    [spotViews, coinsEarnedTotal, playerLevel]
  );

  const [seenTitleAxes, setSeenTitleAxes] = useState<Set<AchievementBadgeAxisId>>(() =>
    typeof window === "undefined" ? new Set() : loadSeenAchievementTitleAxes()
  );
  const [titleOverlay, setTitleOverlay] = useState<TitleUnlockOverlayState | null>(null);

  const views = useMemo(() => getAllAchievementBadgeViews(stats), [stats]);

  const dismissTitleOverlay = useCallback(() => {
    setTitleOverlay((prev) => {
      if (prev) {
        markAchievementTitleAxisSeen(prev.axisId);
        setSeenTitleAxes((axes) => new Set([...axes, prev.axisId]));
      }
      return null;
    });
  }, []);

  const openTitleOverlay = useCallback(
    (axisId: AchievementBadgeAxisId) => {
      if (!isAchievementAxisFullyComplete(axisId, stats)) return;
      if (seenTitleAxes.has(axisId)) return;
      const titleDef = getAchievementTitleForAxis(axisId);
      if (!titleDef) return;
      const titleName = resolveAchievementTitleLabel(titleDef.id, m.achievementTitleById);
      if (!titleName) return;
      setTitleOverlay({ axisId, titleName });
    },
    [m.achievementTitleById, seenTitleAxes, stats]
  );

  return (
    <>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "14px 12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          border: "1px solid #f3f4f6",
        }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>
          {m.achievementBadgesTitle}
        </h2>
        <div
          style={{
            display: "grid",
            width: "100%",
            gridTemplateColumns: `repeat(${BADGE_GRID_COLUMNS}, minmax(0, 1fr))`,
            columnGap: `${BADGE_GRID_COLUMN_GAP_PX}px`,
            rowGap: `${BADGE_GRID_ROW_GAP_PX}px`,
          }}
        >
          {views.map((view) => {
            const fullyComplete = isAchievementAxisFullyComplete(view.axisId, stats);
            const showNotifyDot = fullyComplete && !seenTitleAxes.has(view.axisId);
            return (
              <AchievementBadgeTile
                key={view.axisId}
                icon={view.icon}
                tier={view.tier}
                maxTier={view.maxTier}
                progressPercent={view.progressPercent}
                nextThreshold={view.nextThreshold}
                label={badgeLabel(view.axisId, m)}
                tierLabel={m.achievementBadgeTierProgress
                  .replace("{tier}", String(view.tier))
                  .replace("{max}", String(view.maxTier))}
                nextGoalTemplate={m.achievementBadgeNextGoal}
                titleEarnedLabel={m.achievementTitleEarned}
                axisId={view.axisId}
                stats={stats}
                showNotifyDot={showNotifyDot}
                onPress={() => openTitleOverlay(view.axisId)}
              />
            );
          })}
        </div>
      
      </div>

      {titleOverlay != null ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={m.playerRewardTapToContinue}
          onClick={dismissTitleOverlay}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              dismissTitleOverlay();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(15, 23, 42, 0.18)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "min(320px, calc(100vw - 36px))",
              padding: "26px 22px 24px",
              borderRadius: "24px",
              background: "linear-gradient(165deg, #ffffff 0%, #fff8fa 40%, #fdf3f5 100%)",
              border: "2px solid #f3b6c3",
              boxShadow: "0 16px 48px rgba(232, 143, 163, 0.4)",
              textAlign: "center",
              transform: "translate(-50%, -50%)",
              animation: "trad-trav-level-up-card 0.75s cubic-bezier(0.34, 1.45, 0.64, 1) forwards",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: 900,
                letterSpacing: language === "en" ? "0.28em" : "0.12em",
                color: "#e88fa3",
                ...(language === "en" ? { textTransform: "uppercase" as const } : {}),
              }}
            >
              {m.achievementTitleUnlockTitle}
            </p>
            <p
              style={{
                margin: "16px 0 0",
                fontSize: "22px",
                fontWeight: 900,
                lineHeight: 1.35,
                color: "#111827",
                wordBreak: "break-word",
              }}
            >
              {titleOverlay.titleName}
            </p>
            <p style={{ margin: "12px 0 0", fontSize: "14px", fontWeight: 700, color: "#b85f74", lineHeight: 1.5 }}>
              {m.achievementTitleUnlockSubtitle}
            </p>
            <p
              style={{
                margin: "16px 0 0",
                paddingTop: "14px",
                borderTop: "1px dashed #f3b6c3",
                fontSize: "12px",
                fontWeight: 700,
                color: "#e88fa3",
                letterSpacing: "0.04em",
              }}
            >
              {m.playerRewardTapToContinue}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
