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
          id: "map-search-input",
          targetId: "map.search-input",
          title: copy.mapSearchTitle,
          description: copy.mapSearchDesc,
        },
        {
          id: "map-subtab",
          targetId: "map.subtab.map",
          title: copy.mapSubtabTitle,
          description: copy.mapSubtabDesc,
        },
      ];
    case "now":
      if (!options.hasNowLocation) {
        return [
          {
            id: "now-location-settings",
            targetId: "now.location-settings-button",
            title: copy.nowSetupTitle,
            description: copy.nowSetupDesc,
          },
        ];
      }

      return [
        {
          id: "now-location-refresh",
          targetId: "now.location-update-button",
          title: copy.nowRefreshTitle,
          description: copy.nowRefreshDesc,
        },
      ];
    case "manner":
      return [
        {
          id: "manner-travel-tab",
          targetId: "manner.tab.travel",
          title: copy.mannerTravelTitle,
          description: copy.mannerTravelDesc,
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
      ];
    default:
      return [];
  }
}
