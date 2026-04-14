import type { TutorialTabId } from "./tutorial";

export const GUEST_PLAYER_PROGRESS_KEY = "trad-trav-guest-player-progress-v1";

export type PlayerEvent =
  | { type: "spot_view" }
  | { type: "favorite_add" }
  | { type: "diagnosis_complete" }
  | { type: "tutorial_complete"; screen: TutorialTabId };

export type PlayerStats = {
  spotViews: number;
  favoritesAdded: number;
  diagnosisComplete: boolean;
  tutorials: Partial<Record<TutorialTabId, boolean>>;
};

export type PlayerProgress = {
  xp: number;
  badgeIds: string[];
  stats: PlayerStats;
};

export const BADGE_META: Record<
  string,
  { emoji: string; labelJa: string; labelEn: string }
> = {
  explorer_1: { emoji: "👀", labelJa: "はじめの一歩", labelEn: "First look" },
  explorer_5: { emoji: "🗺️", labelJa: "探索者", labelEn: "Explorer" },
  collector_1: { emoji: "❤️", labelJa: "お気に入りデビュー", labelEn: "First favorite" },
  diagnose_done: { emoji: "✨", labelJa: "旅タイプ診断", labelEn: "Travel style quiz" },
  guide_all: { emoji: "📘", labelJa: "ガイド制覇", labelEn: "All tab guides" },
};

const TUTORIAL_KEYS: TutorialTabId[] = ["map", "now", "manner", "mypage"];

export function defaultPlayerProgress(): PlayerProgress {
  return {
    xp: 0,
    badgeIds: [],
    stats: {
      spotViews: 0,
      favoritesAdded: 0,
      diagnosisComplete: false,
      tutorials: {},
    },
  };
}

export function normalizePlayerProgress(raw: unknown): PlayerProgress {
  const base = defaultPlayerProgress();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const xp = typeof o.xp === "number" && Number.isFinite(o.xp) ? Math.max(0, Math.floor(o.xp)) : base.xp;
  const badgeIds = Array.isArray(o.badgeIds)
    ? o.badgeIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : base.badgeIds;
  const s = o.stats && typeof o.stats === "object" ? (o.stats as Record<string, unknown>) : {};
  const spotViews =
    typeof s.spotViews === "number" && Number.isFinite(s.spotViews)
      ? Math.max(0, Math.floor(s.spotViews))
      : base.stats.spotViews;
  const favoritesAdded =
    typeof s.favoritesAdded === "number" && Number.isFinite(s.favoritesAdded)
      ? Math.max(0, Math.floor(s.favoritesAdded))
      : base.stats.favoritesAdded;
  const diagnosisComplete = Boolean(s.diagnosisComplete);
  const tutorials: Partial<Record<TutorialTabId, boolean>> = {};
  if (s.tutorials && typeof s.tutorials === "object") {
    for (const k of TUTORIAL_KEYS) {
      if ((s.tutorials as Record<string, unknown>)[k] === true) tutorials[k] = true;
    }
  }
  return {
    xp,
    badgeIds: [...new Set(badgeIds)],
    stats: { spotViews, favoritesAdded, diagnosisComplete, tutorials },
  };
}

function badgesUnlockedByStats(stats: PlayerStats): string[] {
  const out: string[] = [];
  if (stats.spotViews >= 1) out.push("explorer_1");
  if (stats.spotViews >= 5) out.push("explorer_5");
  if (stats.favoritesAdded >= 1) out.push("collector_1");
  if (stats.diagnosisComplete) out.push("diagnose_done");
  const allTutorials = TUTORIAL_KEYS.every((k) => stats.tutorials[k] === true);
  if (allTutorials) out.push("guide_all");
  return out;
}

function recomputeBadges(prev: PlayerProgress): PlayerProgress {
  const auto = badgesUnlockedByStats(prev.stats);
  const badgeIds = [...new Set([...prev.badgeIds, ...auto])];
  return { ...prev, badgeIds };
}

export function applyPlayerEvent(prev: PlayerProgress, event: PlayerEvent): PlayerProgress {
  let next: PlayerProgress = { ...prev, stats: { ...prev.stats, tutorials: { ...prev.stats.tutorials } } };

  switch (event.type) {
    case "spot_view": {
      next.stats.spotViews = prev.stats.spotViews + 1;
      next.xp = prev.xp + 5;
      break;
    }
    case "favorite_add": {
      next.stats.favoritesAdded = prev.stats.favoritesAdded + 1;
      next.xp = prev.xp + 10;
      break;
    }
    case "diagnosis_complete": {
      if (prev.stats.diagnosisComplete) return prev;
      next.stats.diagnosisComplete = true;
      next.xp = prev.xp + 25;
      break;
    }
    case "tutorial_complete": {
      if (prev.stats.tutorials[event.screen]) return prev;
      next.stats.tutorials[event.screen] = true;
      next.xp = prev.xp + 10;
      break;
    }
    default:
      return prev;
  }

  next = recomputeBadges(next);
  return next;
}

/** レベルは 1 始まり。次レベルまでの区間を単純な階段式にする */
export function levelFromXp(xp: number): number {
  const x = Math.max(0, xp);
  let level = 1;
  let need = 50;
  let sum = 0;
  while (sum + need <= x) {
    sum += need;
    level += 1;
    need = Math.min(need + 25, 300);
  }
  return level;
}

export function xpIntoCurrentLevel(xp: number): { level: number; current: number; need: number } {
  const x = Math.max(0, xp);
  let level = 1;
  let need = 50;
  let sum = 0;
  while (sum + need <= x) {
    sum += need;
    level += 1;
    need = Math.min(need + 25, 300);
  }
  return { level, current: x - sum, need };
}

export function mergePlayerProgress(remote: PlayerProgress, local: PlayerProgress): PlayerProgress {
  const xp = Math.max(remote.xp, local.xp);
  const stats: PlayerStats = {
    spotViews: Math.max(remote.stats.spotViews, local.stats.spotViews),
    favoritesAdded: Math.max(remote.stats.favoritesAdded, local.stats.favoritesAdded),
    diagnosisComplete: remote.stats.diagnosisComplete || local.stats.diagnosisComplete,
    tutorials: { ...remote.stats.tutorials },
  };
  for (const k of TUTORIAL_KEYS) {
    if (local.stats.tutorials[k]) stats.tutorials[k] = true;
  }
  const badgeIds = [...new Set([...remote.badgeIds, ...local.badgeIds])];
  let merged: PlayerProgress = { xp, badgeIds, stats };
  merged = recomputeBadges(merged);
  return merged;
}

export function loadGuestPlayerProgress(): PlayerProgress {
  if (typeof window === "undefined") return defaultPlayerProgress();
  try {
    const raw = window.localStorage.getItem(GUEST_PLAYER_PROGRESS_KEY);
    if (!raw) return defaultPlayerProgress();
    return normalizePlayerProgress(JSON.parse(raw) as unknown);
  } catch {
    return defaultPlayerProgress();
  }
}

export function saveGuestPlayerProgress(progress: PlayerProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUEST_PLAYER_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* ignore */
  }
}

export function clearGuestPlayerProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(GUEST_PLAYER_PROGRESS_KEY);
  } catch {
    /* ignore */
  }
}
