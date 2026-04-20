"use client";

import type { Translations } from "../i18n/translations";

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
  } = {},
  copy: Translations["tutorial"]
): TutorialStep[] {
  switch (screen) {
    case "map":
      return [
        {
          id: "map-nav-tab",
          targetId: "nav.map",
          title: copy.mapNavMapTitle,
          description: copy.mapNavMapDesc,
        },
        {
          id: "map-performing-more",
          targetId: "map.genre.performing-load-more",
          title: copy.mapPerformingMoreTitle,
          description: copy.mapPerformingMoreDesc,
        },
        {
          id: "map-pick-spot",
          targetId: "map.genre.pick-spot",
          title: copy.mapPickSpotTitle,
          description: copy.mapPickSpotDesc,
        },
        {
          id: "map-close-detail",
          targetId: "map.spot-detail.close",
          title: copy.mapCloseDetailTitle,
          description: copy.mapCloseDetailDesc,
        },
        {
          id: "map-back-to-list",
          targetId: "map.genre.back-to-list",
          title: copy.mapBackListTitle,
          description: copy.mapBackListDesc,
        },
        {
          id: "map-search-input",
          targetId: "map.search-input",
          title: copy.mapSearchTitle,
          description: copy.mapSearchDesc,
        },
      ];
    case "now":
      return [
        {
          id: "now-nav-tab",
          targetId: "nav.now",
          title: copy.nowNavTitle,
          description: copy.nowNavDesc,
        },
        ...(options.hasNowLocation
          ? [
              {
                id: "now-location-refresh",
                targetId: "now.location-update-button",
                title: copy.nowRefreshTitle,
                description: copy.nowRefreshDesc,
              } satisfies TutorialStep,
            ]
          : [
              {
                id: "now-location-settings",
                targetId: "now.location-settings-button",
                title: copy.nowSetupTitle,
                description: copy.nowSetupDesc,
              } satisfies TutorialStep,
            ]),
      ];
    case "manner":
      return [
        {
          id: "manner-nav-tab",
          targetId: "nav.manner",
          title: copy.mannerNavTitle,
          description: copy.mannerNavDesc,
        },
        {
          id: "manner-tab-manner",
          targetId: "manner.tab.manner",
          title: copy.mannerTabMannerTitle,
          description: copy.mannerTabMannerDesc,
        },
        {
          id: "manner-open-category",
          targetId: "manner.open-first-category",
          title: copy.mannerOpenCategoryTitle,
          description: copy.mannerOpenCategoryDesc,
        },
        {
          id: "manner-item-see-more",
          targetId: "manner.item-see-more",
          title: copy.mannerItemSeeMoreTitle,
          description: copy.mannerItemSeeMoreDesc,
        },
        {
          id: "manner-item-favorite",
          targetId: "manner.item-favorite",
          title: copy.mannerItemFavoriteTitle,
          description: copy.mannerItemFavoriteDesc,
        },
        {
          id: "manner-category-back",
          targetId: "manner.category-back",
          title: copy.mannerCategoryBackTitle,
          description: copy.mannerCategoryBackDesc,
        },
        {
          id: "manner-tab-trivia",
          targetId: "manner.tab.trivia",
          title: copy.mannerTabTriviaTitle,
          description: copy.mannerTabTriviaDesc,
        },
        {
          id: "manner-tab-guide",
          targetId: "manner.tab.guide",
          title: copy.mannerTabGuideTitle,
          description: copy.mannerTabGuideDesc,
        },
        {
          id: "manner-ai-button",
          targetId: "manner.ai-button",
          title: copy.mannerAiTitle,
          description: copy.mannerAiDesc,
        },
      ];
    case "mypage":
      return [
        {
          id: "mypage-nav-tab",
          targetId: "nav.mypage",
          title: copy.mypageNavTitle,
          description: copy.mypageNavDesc,
        },
        {
          id: "mypage-settings-open",
          targetId: "mypage.settings-entry",
          title: copy.mypageSettingsTitle,
          description: copy.mypageSettingsDesc,
        },
        {
          id: "mypage-location-share",
          targetId: "mypage.location-share-button",
          title: copy.mypageLocationTitle,
          description: copy.mypageLocationDesc,
        },
        {
          id: "mypage-language",
          targetId: "mypage.language-button",
          title: copy.mypageLanguageTitle,
          description: copy.mypageLanguageDesc,
        },
        {
          id: "mypage-settings-back",
          targetId: "mypage.settings-back",
          title: copy.mypageSettingsBackTitle,
          description: copy.mypageSettingsBackDesc,
        },
        {
          id: "mypage-quests",
          targetId: "mypage.quest-section",
          title: copy.mypageQuestTitle,
          description: copy.mypageQuestDesc,
        },
        {
          id: "mypage-cosmetics",
          targetId: "mypage.cosmetics-entry",
          title: copy.mypageCosmeticsTitle,
          description: copy.mypageCosmeticsDesc,
        },
        {
          id: "mypage-login",
          targetId: "mypage.login-cta",
          title: copy.mypageLoginTitle,
          description: copy.mypageLoginDesc,
        },
      ];
    default:
      return [];
  }
}
