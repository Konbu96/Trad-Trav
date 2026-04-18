import type { TutorialTabId } from "./tutorial";

export const GUEST_PLAYER_PROGRESS_KEY = "trad-trav-guest-player-progress-v1";

export type PlayerEvent =
  | { type: "spot_view" }
  | { type: "favorite_add" }
  | { type: "diagnosis_complete" }
  | { type: "tutorial_complete"; screen: TutorialTabId }
  /** 条件を満たしたクエストの報酬を受け取る（ノーマル・デイリー共通） */
  | { type: "quest_claim"; questId: string };

export type PlayerStats = {
  spotViews: number;
  favoritesAdded: number;
  diagnosisComplete: boolean;
  tutorials: Partial<Record<TutorialTabId, boolean>>;
};

export type QuestCategory = "daily" | "normal";

export type DailyQuestState = {
  /** ローカル日付 YYYY-MM-DD（変わったら当日カウントをリセット） */
  dateKey: string;
  /** 当日の体験スポット閲覧回数 */
  spotViews: number;
  /** 当日、達成ボーナス XP を付与済みのデイリークエスト ID */
  claimedIds: string[];
};

export type PlayerProgress = {
  xp: number;
  stats: PlayerStats;
  /** ユーザーが「達成」で受け取ったノーマルクエスト ID（`recomputePlayerXp` で未達成の ID は除去） */
  completedQuestIds: string[];
  dailyQuestState: DailyQuestState;
};

export type QuestKind =
  | { type: "spot_views"; target: number }
  | { type: "favorites"; target: number }
  | { type: "diagnosis" }
  | { type: "tutorials_all" }
  | { type: "daily_spot_views"; target: number };

export type QuestDefinition = {
  id: string;
  category: QuestCategory;
  /** 初回達成時に付与する経験値（行動 XP とは別に加算） */
  xpReward: number;
  labelJa: string;
  labelEn: string;
  kind: QuestKind;
};

const TUTORIAL_KEYS: TutorialTabId[] = ["map", "now", "manner", "mypage"];

/** マイページ等で表示するクエスト一覧（上から順。`category` でタブ分け） */
export const QUESTS: readonly QuestDefinition[] = [
  {
    id: "quest_daily_spot_1",
    category: "daily",
    xpReward: 8,
    labelJa: "今日、体験スポットを1件チェックする",
    labelEn: "Check 1 experience spot today",
    kind: { type: "daily_spot_views", target: 1 },
  },
  {
    id: "quest_daily_spot_3",
    category: "daily",
    xpReward: 15,
    labelJa: "今日、体験スポットを3件チェックする",
    labelEn: "Check 3 experience spots today",
    kind: { type: "daily_spot_views", target: 3 },
  },
  {
    id: "quest_spot_1",
    category: "normal",
    xpReward: 20,
    labelJa: "体験スポットを1件チェックする",
    labelEn: "Check 1 experience spot",
    kind: { type: "spot_views", target: 1 },
  },
  {
    id: "quest_spot_5",
    category: "normal",
    xpReward: 40,
    labelJa: "体験スポットを5件チェックする",
    labelEn: "Check 5 experience spots",
    kind: { type: "spot_views", target: 5 },
  },
  {
    id: "quest_favorite_1",
    category: "normal",
    xpReward: 25,
    labelJa: "お気に入りを1件追加する",
    labelEn: "Add 1 favorite",
    kind: { type: "favorites", target: 1 },
  },
  {
    id: "quest_diagnosis",
    category: "normal",
    xpReward: 35,
    labelJa: "旅タイプ診断を受ける",
    labelEn: "Take the travel style quiz",
    kind: { type: "diagnosis" },
  },
  {
    id: "quest_tutorials_all",
    category: "normal",
    xpReward: 30,
    labelJa: "各タブのチュートリアルをすべて完了する",
    labelEn: "Complete all tab tutorials",
    kind: { type: "tutorials_all" },
  },
] as const;

const QUEST_ID_SET: ReadonlySet<string> = new Set(QUESTS.map((q) => q.id));

export type QuestProgressView = {
  quest: QuestDefinition;
  done: boolean;
  /** ノーマル: `completedQuestIds` に反映済み。デイリー: 当日 `claimedIds` に反映済み */
  rewardClaimed: boolean;
  /** カウント系のみ意味あり。達成時は target/target */
  current: number;
  target: number;
};

export function isQuestSatisfiedByStats(stats: PlayerStats, quest: QuestDefinition): boolean {
  const k = quest.kind;
  if (k.type === "daily_spot_views") return false;
  if (k.type === "spot_views") return stats.spotViews >= k.target;
  if (k.type === "favorites") return stats.favoritesAdded >= k.target;
  if (k.type === "diagnosis") return stats.diagnosisComplete;
  return TUTORIAL_KEYS.every((key) => stats.tutorials[key] === true);
}

/** 保存済み `completedQuestIds` が無い旧データ向け: 統計から達成済みノーマルクエスト ID を推定（XP は増やさない） */
export function inferCompletedQuestIdsFromStats(stats: PlayerStats): string[] {
  return QUESTS.filter((q) => q.category === "normal" && isQuestSatisfiedByStats(stats, q)).map((q) => q.id);
}

function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultDailyQuestState(): DailyQuestState {
  return { dateKey: "", spotViews: 0, claimedIds: [] };
}

export function rolloverDailyQuestState(prev: DailyQuestState | undefined, today: string): DailyQuestState {
  if (prev && prev.dateKey === today) {
    return { dateKey: prev.dateKey, spotViews: prev.spotViews, claimedIds: [...prev.claimedIds] };
  }
  return { dateKey: today, spotViews: 0, claimedIds: [] };
}

/** 表示・進捗計算用（端末の「今日」に合わせて日付が変わっていれば当日分にロール） */
export function dailyQuestStateForUi(state: DailyQuestState | undefined): DailyQuestState {
  return rolloverDailyQuestState(state, localDateKey());
}

/** タブに応じたクエスト行（デイリーは `dailyQuestState` と端末の日付を使用） */
export function getQuestProgressViewsForCategory(
  stats: PlayerStats,
  daily: DailyQuestState,
  category: QuestCategory,
  completedQuestIds: readonly string[]
): QuestProgressView[] {
  const today = localDateKey();
  return QUESTS.filter((q) => q.category === category).map((quest) => {
    const k = quest.kind;
    if (k.type === "daily_spot_views") {
      const target = k.target;
      const sameDay = daily.dateKey === today;
      const rawCurrent = sameDay ? daily.spotViews : 0;
      const current = Math.min(rawCurrent, target);
      const done = sameDay && daily.spotViews >= target;
      const rewardClaimed = daily.claimedIds.includes(quest.id);
      return { quest, done, rewardClaimed, current, target };
    }
    const done = isQuestSatisfiedByStats(stats, quest);
    const rewardClaimed = completedQuestIds.includes(quest.id);
    if (k.type === "spot_views") {
      const target = k.target;
      const current = Math.min(stats.spotViews, target);
      return { quest, done, rewardClaimed, current, target };
    }
    if (k.type === "favorites") {
      const target = k.target;
      const current = Math.min(stats.favoritesAdded, target);
      return { quest, done, rewardClaimed, current, target };
    }
    if (k.type === "diagnosis") {
      return { quest, done, rewardClaimed, current: stats.diagnosisComplete ? 1 : 0, target: 1 };
    }
    const doneCount = TUTORIAL_KEYS.filter((key) => stats.tutorials[key] === true).length;
    return {
      quest,
      done,
      rewardClaimed,
      current: doneCount,
      target: TUTORIAL_KEYS.length,
    };
  });
}

/** 達成済みだが報酬未受取のクエスト件数（デイリー / ノーマル別と合計） */
export function getQuestUnclaimedBadgeCounts(progress: PlayerProgress): {
  dailyUnclaimed: number;
  normalUnclaimed: number;
  totalUnclaimed: number;
} {
  const dailyUi = dailyQuestStateForUi(progress.dailyQuestState);
  const dailyRows = getQuestProgressViewsForCategory(
    progress.stats,
    dailyUi,
    "daily",
    progress.completedQuestIds
  );
  const normalRows = getQuestProgressViewsForCategory(
    progress.stats,
    dailyUi,
    "normal",
    progress.completedQuestIds
  );
  const dailyUnclaimed = dailyRows.filter((r) => r.done && !r.rewardClaimed).length;
  const normalUnclaimed = normalRows.filter((r) => r.done && !r.rewardClaimed).length;
  return {
    dailyUnclaimed,
    normalUnclaimed,
    totalUnclaimed: dailyUnclaimed + normalUnclaimed,
  };
}

/** 行動・チュートリアル等から得た経験値（stats のみから再計算） */
export function computeActionXpFromStats(stats: PlayerStats): number {
  let x = stats.spotViews * 5 + stats.favoritesAdded * 10;
  if (stats.diagnosisComplete) x += 25;
  for (const key of TUTORIAL_KEYS) {
    if (stats.tutorials[key]) x += 10;
  }
  return x;
}

/**
 * stats・クエスト反映状態だけから合計 XP を決める（保存された `xp` 数値は信頼しない）。
 * 改ざん耐性のため normalize / merge / イベント適用後に必ず通す。
 */
export function recomputePlayerXp(progress: PlayerProgress): PlayerProgress {
  const stats = progress.stats;
  const completedQuestIds = [...new Set(progress.completedQuestIds ?? [])].filter((id) => {
    const q = QUESTS.find((x) => x.id === id);
    return q && q.category === "normal" && isQuestSatisfiedByStats(stats, q);
  });

  const dq = rolloverDailyQuestState(progress.dailyQuestState, localDateKey());
  const today = localDateKey();
  const claimedIds = [...new Set(dq.claimedIds)].filter((id) => {
    const q = QUESTS.find((x) => x.id === id);
    if (!q || q.category !== "daily" || q.kind.type !== "daily_spot_views") return false;
    return dq.dateKey === today && dq.spotViews >= q.kind.target;
  });

  let xp = computeActionXpFromStats(stats);
  for (const id of completedQuestIds) {
    const q = QUESTS.find((x) => x.id === id);
    if (q && q.category === "normal") xp += q.xpReward;
  }
  for (const id of claimedIds) {
    const q = QUESTS.find((x) => x.id === id);
    if (q && q.category === "daily") xp += q.xpReward;
  }

  return {
    ...progress,
    xp,
    completedQuestIds,
    dailyQuestState: { ...dq, claimedIds },
  };
}

function mergeDailyQuestState(remote: DailyQuestState, local: DailyQuestState): DailyQuestState {
  const uniq = (ids: string[]) =>
    [...new Set(ids.filter((id) => QUEST_ID_SET.has(id) && QUESTS.some((q) => q.id === id && q.category === "daily")))];

  const rEmpty = !remote.dateKey;
  const lEmpty = !local.dateKey;
  if (rEmpty && lEmpty) return defaultDailyQuestState();
  if (rEmpty) return { ...local, claimedIds: uniq(local.claimedIds) };
  if (lEmpty) return { ...remote, claimedIds: uniq(remote.claimedIds) };
  const cmp = remote.dateKey.localeCompare(local.dateKey);
  if (cmp === 0) {
    return {
      dateKey: remote.dateKey,
      spotViews: Math.max(remote.spotViews, local.spotViews),
      claimedIds: uniq([...remote.claimedIds, ...local.claimedIds]),
    };
  }
  return cmp > 0
    ? { ...remote, claimedIds: uniq(remote.claimedIds) }
    : { ...local, claimedIds: uniq(local.claimedIds) };
}

export function defaultPlayerProgress(): PlayerProgress {
  return {
    xp: 0,
    completedQuestIds: [],
    dailyQuestState: defaultDailyQuestState(),
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
    for (const key of TUTORIAL_KEYS) {
      if ((s.tutorials as Record<string, unknown>)[key] === true) tutorials[key] = true;
    }
  }
  const stats: PlayerStats = { spotViews, favoritesAdded, diagnosisComplete, tutorials };

  let completedQuestIds: string[];
  if (!("completedQuestIds" in o)) {
    completedQuestIds = inferCompletedQuestIdsFromStats(stats);
  } else if (Array.isArray(o.completedQuestIds)) {
    completedQuestIds = [
      ...new Set(
        o.completedQuestIds.filter(
          (id): id is string => typeof id === "string" && QUEST_ID_SET.has(id)
        )
      ),
    ].filter((id) => QUESTS.some((q) => q.id === id && q.category === "normal"));
  } else {
    completedQuestIds = [];
  }

  const dqRaw = o.dailyQuestState;
  let dailyQuestState: DailyQuestState;
  if (dqRaw && typeof dqRaw === "object") {
    const dq = dqRaw as Record<string, unknown>;
    const dateKey = typeof dq.dateKey === "string" ? dq.dateKey : "";
    const spotViews =
      typeof dq.spotViews === "number" && Number.isFinite(dq.spotViews)
        ? Math.max(0, Math.floor(dq.spotViews))
        : 0;
    const claimedRaw = dq.claimedIds;
    const claimedIds = Array.isArray(claimedRaw)
      ? [
          ...new Set(
            claimedRaw.filter(
              (id): id is string =>
                typeof id === "string" &&
                QUEST_ID_SET.has(id) &&
                QUESTS.some((q) => q.id === id && q.category === "daily")
            )
          ),
        ]
      : [];
    dailyQuestState = { dateKey, spotViews, claimedIds };
  } else {
    dailyQuestState = defaultDailyQuestState();
  }

  dailyQuestState = rolloverDailyQuestState(dailyQuestState, localDateKey());

  return recomputePlayerXp({
    xp: 0,
    completedQuestIds,
    dailyQuestState,
    stats,
  });
}

export function applyPlayerEvent(prev: PlayerProgress, event: PlayerEvent): PlayerProgress {
  const today = localDateKey();
  const dailyAfterRoll = rolloverDailyQuestState(prev.dailyQuestState, today);
  const next: PlayerProgress = {
    ...prev,
    dailyQuestState: dailyAfterRoll,
    stats: { ...prev.stats, tutorials: { ...prev.stats.tutorials } },
  };

  switch (event.type) {
    case "spot_view": {
      next.stats.spotViews = prev.stats.spotViews + 1;
      next.dailyQuestState = {
        ...dailyAfterRoll,
        spotViews: dailyAfterRoll.spotViews + 1,
      };
      break;
    }
    case "favorite_add": {
      next.stats.favoritesAdded = prev.stats.favoritesAdded + 1;
      break;
    }
    case "diagnosis_complete": {
      if (prev.stats.diagnosisComplete) return recomputePlayerXp(prev);
      next.stats.diagnosisComplete = true;
      break;
    }
    case "tutorial_complete": {
      if (prev.stats.tutorials[event.screen]) return recomputePlayerXp(prev);
      next.stats.tutorials[event.screen] = true;
      break;
    }
    case "quest_claim": {
      const q = QUESTS.find((x) => x.id === event.questId);
      if (!q) return recomputePlayerXp(prev);
      if (q.category === "normal") {
        if (!isQuestSatisfiedByStats(prev.stats, q)) return recomputePlayerXp(prev);
        const ids = [...(prev.completedQuestIds ?? [])];
        if (ids.includes(q.id)) return recomputePlayerXp(prev);
        return recomputePlayerXp({
          ...prev,
          completedQuestIds: [...ids, q.id],
          dailyQuestState: dailyAfterRoll,
        });
      }
      if (q.category === "daily" && q.kind.type === "daily_spot_views") {
        const dq = dailyAfterRoll;
        if (dq.dateKey !== today || dq.spotViews < q.kind.target) return recomputePlayerXp(prev);
        if (dq.claimedIds.includes(q.id)) return recomputePlayerXp(prev);
        return recomputePlayerXp({
          ...prev,
          dailyQuestState: { ...dq, claimedIds: [...dq.claimedIds, q.id] },
        });
      }
      return recomputePlayerXp(prev);
    }
    default:
      return prev;
  }

  return recomputePlayerXp(next);
}

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

/**
 * 累計 XP から現在レベルと「このレベル内の進み」を返す。
 * `current` が `need` に達する（バーが満杯）と次の 1 XP で `while` が進みレベルが 1 上がる。
 */
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
  const stats: PlayerStats = {
    spotViews: Math.max(remote.stats.spotViews, local.stats.spotViews),
    favoritesAdded: Math.max(remote.stats.favoritesAdded, local.stats.favoritesAdded),
    diagnosisComplete: remote.stats.diagnosisComplete || local.stats.diagnosisComplete,
    tutorials: { ...remote.stats.tutorials },
  };
  for (const k of TUTORIAL_KEYS) {
    if (local.stats.tutorials[k]) stats.tutorials[k] = true;
  }
  const mergedCompleted = [
    ...new Set([...(remote.completedQuestIds ?? []), ...(local.completedQuestIds ?? [])]),
  ];
  const mergedDaily = mergeDailyQuestState(
    remote.dailyQuestState ?? defaultDailyQuestState(),
    local.dailyQuestState ?? defaultDailyQuestState()
  );
  const dailyQuestState = rolloverDailyQuestState(mergedDaily, localDateKey());
  return recomputePlayerXp({ xp: 0, stats, completedQuestIds: mergedCompleted, dailyQuestState });
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
    window.localStorage.setItem(GUEST_PLAYER_PROGRESS_KEY, JSON.stringify(recomputePlayerXp(progress)));
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
