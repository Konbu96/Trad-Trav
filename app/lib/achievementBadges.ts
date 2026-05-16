export type AchievementBadgeAxisId = "spot_views" | "coins_earned" | "level";

export type AchievementBadgeAxis = {
  id: AchievementBadgeAxisId;
  thresholds: readonly number[];
  icon: string;
};

/** 体験スポット閲覧・累計コイン獲得・レベル到達の実績（段階は thresholds の件数） */
export const ACHIEVEMENT_BADGE_AXES: readonly AchievementBadgeAxis[] = [
  {
    id: "spot_views",
    thresholds: [50, 100, 300, 1000, 2000, 5000],
    icon: "🗺️",
  },
  {
    id: "coins_earned",
    thresholds: [1000, 5000, 7000, 100000, 150000],
    icon: "🪙",
  },
  {
    id: "level",
    thresholds: [10, 50, 100, 150, 200],
    icon: "⭐",
  },
] as const;

export type AchievementBadgeStats = {
  spotViews: number;
  coinsEarnedTotal: number;
  playerLevel: number;
};

export type AchievementBadgeView = {
  axisId: AchievementBadgeAxisId;
  icon: string;
  tier: number;
  maxTier: number;
  currentValue: number;
  nextThreshold: number | null;
  /** 現在の段階内での次の閾値までの進捗（0–100）。最高段階は 100 */
  progressPercent: number;
};

function valueForAxis(axisId: AchievementBadgeAxisId, stats: AchievementBadgeStats): number {
  switch (axisId) {
    case "spot_views":
      return stats.spotViews;
    case "coins_earned":
      return stats.coinsEarnedTotal;
    case "level":
      return stats.playerLevel;
  }
}

export function getAchievementBadgeView(
  axis: AchievementBadgeAxis,
  stats: AchievementBadgeStats
): AchievementBadgeView {
  const currentValue = valueForAxis(axis.id, stats);
  const maxTier = axis.thresholds.length;
  let tier = 0;
  for (const threshold of axis.thresholds) {
    if (currentValue >= threshold) tier += 1;
    else break;
  }

  const nextThreshold = tier < maxTier ? axis.thresholds[tier]! : null;
  const prevThreshold = tier > 0 ? axis.thresholds[tier - 1]! : 0;

  let progressPercent = 100;
  if (nextThreshold != null) {
    const span = nextThreshold - prevThreshold;
    progressPercent = span > 0 ? Math.min(100, Math.round(((currentValue - prevThreshold) / span) * 100)) : 0;
  }

  return {
    axisId: axis.id,
    icon: axis.icon,
    tier,
    maxTier,
    currentValue,
    nextThreshold,
    progressPercent,
  };
}

export function getAllAchievementBadgeViews(stats: AchievementBadgeStats): AchievementBadgeView[] {
  return ACHIEVEMENT_BADGE_AXES.map((axis) => getAchievementBadgeView(axis, stats));
}
