import {
  LOCAL_PERSISTENCE_ENABLED,
  readLocalItem,
  removeLocalItem,
  writeLocalItem,
} from "./localPersistence";
import {
  ACHIEVEMENT_BADGE_AXES,
  getAllAchievementBadgeViews,
  type AchievementBadgeAxisId,
  type AchievementBadgeStats,
} from "./achievementBadges";

export const NO_ACHIEVEMENT_TITLE_ID = "title-none";
export const SELECTED_ACHIEVEMENT_TITLE_STORAGE_KEY = "trad-trav-selected-achievement-title-v1";
const SEEN_TITLE_AXES_STORAGE_KEY = "trad-trav-achievement-title-seen-axes-v1";

let sessionSeenTitleAxes: AchievementBadgeAxisId[] = [];

export type AchievementTitleId =
  | typeof NO_ACHIEVEMENT_TITLE_ID
  | "title-spot-explorer"
  | "title-coin-collector"
  | "title-level-veteran";

export type AchievementTitleDefinition = {
  id: Exclude<AchievementTitleId, typeof NO_ACHIEVEMENT_TITLE_ID>;
  axisId: AchievementBadgeAxisId;
};

/** 実績バッジを最終段階まで達成すると解放される称号 */
export const ACHIEVEMENT_TITLES: readonly AchievementTitleDefinition[] = [
  { id: "title-spot-explorer", axisId: "spot_views" },
  { id: "title-coin-collector", axisId: "coins_earned" },
  { id: "title-level-veteran", axisId: "level" },
] as const;

const SEEN_AXIS_SET = new Set<string>(ACHIEVEMENT_TITLES.map((t) => t.axisId));

const TITLE_ID_SET = new Set<string>([
  NO_ACHIEVEMENT_TITLE_ID,
  ...ACHIEVEMENT_TITLES.map((t) => t.id),
]);

export function isAchievementAxisFullyComplete(axisId: AchievementBadgeAxisId, stats: AchievementBadgeStats): boolean {
  const axis = ACHIEVEMENT_BADGE_AXES.find((a) => a.id === axisId);
  if (!axis) return false;
  const view = getAllAchievementBadgeViews(stats).find((v) => v.axisId === axisId);
  return view != null && view.tier >= view.maxTier;
}

export function getUnlockedAchievementTitleIds(stats: AchievementBadgeStats): AchievementTitleId[] {
  return ACHIEVEMENT_TITLES.filter((title) => isAchievementAxisFullyComplete(title.axisId, stats)).map((t) => t.id);
}

export function getAchievementTitleForAxis(
  axisId: AchievementBadgeAxisId
): AchievementTitleDefinition | undefined {
  return ACHIEVEMENT_TITLES.find((t) => t.axisId === axisId);
}

function parseSeenAxes(raw: string | null): Set<AchievementBadgeAxisId> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((id): id is AchievementBadgeAxisId => typeof id === "string" && SEEN_AXIS_SET.has(id))
    );
  } catch {
    return new Set();
  }
}

/** 称号獲得演出を見た（タップ済み）実績軸 */
export function loadSeenAchievementTitleAxes(): Set<AchievementBadgeAxisId> {
  if (!LOCAL_PERSISTENCE_ENABLED) return new Set(sessionSeenTitleAxes);
  return parseSeenAxes(readLocalItem(SEEN_TITLE_AXES_STORAGE_KEY));
}

export function markAchievementTitleAxisSeen(axisId: AchievementBadgeAxisId): void {
  if (!SEEN_AXIS_SET.has(axisId)) return;
  const next = loadSeenAchievementTitleAxes();
  next.add(axisId);
  const list = [...next];
  sessionSeenTitleAxes = list;
  if (!LOCAL_PERSISTENCE_ENABLED) return;
  writeLocalItem(SEEN_TITLE_AXES_STORAGE_KEY, JSON.stringify(list));
}

export function clearSeenAchievementTitleAxesStorage(): void {
  sessionSeenTitleAxes = [];
  removeLocalItem(SEEN_TITLE_AXES_STORAGE_KEY);
}

export function loadSelectedAchievementTitleId(): AchievementTitleId {
  try {
    const raw = readLocalItem(SELECTED_ACHIEVEMENT_TITLE_STORAGE_KEY);
    if (raw && TITLE_ID_SET.has(raw)) return raw as AchievementTitleId;
  } catch {
    /* ignore */
  }
  return NO_ACHIEVEMENT_TITLE_ID;
}

export function saveSelectedAchievementTitleId(id: AchievementTitleId): void {
  if (!TITLE_ID_SET.has(id)) return;
  writeLocalItem(SELECTED_ACHIEVEMENT_TITLE_STORAGE_KEY, id);
}

export function clearSelectedAchievementTitleStorage(): void {
  removeLocalItem(SELECTED_ACHIEVEMENT_TITLE_STORAGE_KEY);
}

export function clearAchievementTitleStorage(): void {
  clearSelectedAchievementTitleStorage();
  clearSeenAchievementTitleAxesStorage();
}

export function resolveAchievementTitleLabel(
  titleId: AchievementTitleId,
  labels: Record<string, string>
): string | null {
  if (titleId === NO_ACHIEVEMENT_TITLE_ID) return null;
  const label = labels[titleId];
  return typeof label === "string" && label.trim() ? label : null;
}
