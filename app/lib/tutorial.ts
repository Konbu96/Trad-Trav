"use client";

export type TutorialTabId = "map" | "now" | "manner" | "mypage";

export type TutorialProgress = Record<TutorialTabId, boolean>;

export type TutorialStep = {
  id: string;
  targetId: string;
  title: string;
  description: string;
};

export const TUTORIAL_STORAGE_KEY = "trad-trav-tab-tutorials-v1";

export const DEFAULT_TUTORIAL_PROGRESS: TutorialProgress = {
  map: false,
  now: false,
  manner: false,
  mypage: false,
};

export function loadTutorialProgress(): TutorialProgress {
  if (typeof window === "undefined") {
    return DEFAULT_TUTORIAL_PROGRESS;
  }

  try {
    const raw = window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_TUTORIAL_PROGRESS;
    }

    const parsed = JSON.parse(raw) as Partial<TutorialProgress>;
    return {
      map: Boolean(parsed.map),
      now: Boolean(parsed.now),
      manner: Boolean(parsed.manner),
      mypage: Boolean(parsed.mypage),
    };
  } catch {
    return DEFAULT_TUTORIAL_PROGRESS;
  }
}

export function saveTutorialProgress(progress: TutorialProgress) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage errors so the app remains usable.
  }
}

export function resetTutorialProgress() {
  saveTutorialProgress(DEFAULT_TUTORIAL_PROGRESS);
}

export function getTutorialSteps(
  screen: TutorialTabId,
  options: {
    hasNowLocation?: boolean;
  } = {}
): TutorialStep[] {
  switch (screen) {
    case "map":
      return [
        {
          id: "map-search-input",
          targetId: "map.search-input",
          title: "体験を探す",
          description: "まずは検索欄を押して、気になるスポット名や体験名を入力してみましょう。",
        },
        {
          id: "map-subtab",
          targetId: "map.subtab.map",
          title: "地図でも確認",
          description: "次にマップへ切り替えると、見つけたスポットの場所を地図上で確認できます。",
        },
      ];
    case "now":
      if (!options.hasNowLocation) {
        return [
          {
            id: "now-location-settings",
            targetId: "now.location-settings-button",
            title: "まずは位置情報を設定",
            description: "現在地に合わせた情報を出すために、マイページの位置情報設定を開いてみましょう。",
          },
        ];
      }

      return [
        {
          id: "now-location-refresh",
          targetId: "now.location-update-button",
          title: "現在地を更新",
          description: "このボタンから、いまの位置をもう一度取得して近くの情報を更新できます。",
        },
        {
          id: "now-guide-jump",
          targetId: "now.guide-jump-button",
          title: "必要な情報へすぐ移動",
          description: "気になる項目を押すと、この画面の中ですぐ必要な情報までジャンプできます。",
        },
      ];
    case "manner":
      return [
        {
          id: "manner-travel-tab",
          targetId: "manner.tab.travel",
          title: "旅ガイドに切り替え",
          description: "上の切り替えから、マナーだけでなく旅ガイドや豆知識にもすぐ移れます。",
        },
        {
          id: "manner-ai-button",
          targetId: "manner.ai-button",
          title: "AIに相談",
          description: "迷ったときは右下の AI ボタンを押すと、その場で質問できます。",
        },
      ];
    case "mypage":
      return [
        {
          id: "mypage-settings-open",
          targetId: "mypage.settings-entry",
          title: "設定を開く",
          description: "まず設定を開き、位置情報や言語はここから変更できます。",
        },
        {
          id: "mypage-location-share",
          targetId: "mypage.location-share-button",
          title: "現在地の利用を設定",
          description: "「現在地を共有する」を押すと、ブラウザに許可を求めます。許可後、なう情報などが場所に合わせて変わります。",
        },
        {
          id: "mypage-language",
          targetId: "mypage.language-button",
          title: "表示言語を変更",
          description: "言語を押すと、日本語と英語の表示を切り替えられます。",
        },
      ];
    default:
      return [];
  }
}
