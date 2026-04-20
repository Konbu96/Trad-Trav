"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNavigation from "./components/BottomNavigation";
import SplashScreen from "./components/SplashScreen";
import PostSplashLanguageOverlay from "./components/PostSplashLanguageOverlay";
import DiagnosisView, { type DiagnosisResult } from "./components/DiagnosisView";
import MyPageView, { type MyPageTutorialHandle } from "./components/MyPageView";
import AuthView from "./components/AuthView";
import MapTabView, { type MapTabTutorialHandle } from "./components/MapTabView";
import MannerView, { type MannerTutorialHandle } from "./components/MannerView";
import NowInfoView from "./components/NowInfoView";
import TutorialOverlay from "./components/TutorialOverlay";
import AppOnboardingWalkthrough from "./components/AppOnboardingWalkthrough";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";
import type { LocationIssueCode } from "./lib/locationIssue";
import {
  saveDiagnosisResult,
  getDiagnosisResult,
  getViewHistory,
  addViewHistory,
  getFavorites,
  toggleFavorite,
  getHelpfulFavorites,
  saveHelpfulFavorites,
  toggleHelpfulFavorite,
  getTravelerDisplayName,
  saveTravelerDisplayName,
  getPlayerProgress,
  mergeAndSavePlayerProgress,
  recordPlayerEvent,
  savePlayerProgress,
  type ViewHistoryItem,
  auth,
} from "./lib/firebase";
import { loadGuestHelpfulFavorites, saveGuestHelpfulFavorites } from "./lib/helpfulFavoritesGuest";
import { makeLocationKey } from "./lib/location";
import {
  DEFAULT_TUTORIAL_PROGRESS,
  getTutorialSteps,
  loadTutorialProgress,
  resetTutorialProgress,
  saveTutorialProgress,
  type TutorialProgress,
  type TutorialTabId,
} from "./lib/tutorial";
import {
  applyPlayerEvent,
  clearGuestPlayerProgress,
  defaultPlayerProgress,
  loadGuestPlayerProgress,
  getQuestUnclaimedBadgeCounts,
  recomputePlayerXp,
  saveGuestPlayerProgress,
  type PlayerEvent,
  type PlayerProgress,
} from "./lib/playerProgress";
import { recommendedSpots } from "./data/spots";
import {
  EXPERIENCE_RESERVATION_GUIDE_DETAIL_KEY,
  TIPS_TOPICS,
  normalizeHelpfulFavoriteKey,
  type HelpfulTabId,
} from "./data/helpfulInfo";
import { signOut } from "firebase/auth";
import {
  readFirstAppWalkthroughDone,
  readPostSplashLanguageSeen,
  writeFirstAppWalkthroughDone,
  writePostSplashLanguageSeen,
} from "./lib/firstLaunchFlow";
import { buildGoogleMapsUrl, openGoogleMapsUrl } from "./lib/googleMapsUrl";

const FIRST_APP_ONBOARDING_SLIDE_COUNT = 3;

// 画面の種類
export type ScreenType = "map" | "now" | "manner" | "mypage";

// ユーザー情報
export interface User {
  id: string;
  name: string;
  email: string;
}

export type LocationPermissionState =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

export interface CurrentAddress {
  prefecture: string;
  city: string;
  town: string;
  formattedAddress: string;
}

/** PC 相当の環境・開発者ツールで使う仮現在地（栗原市役所付近） */
const ASSUMED_FALLBACK_POSITION = {
  latitude: 38.72977,
  longitude: 141.02098,
};

const ASSUMED_FALLBACK_ADDRESS: CurrentAddress = {
  prefecture: "宮城県",
  city: "栗原市",
  town: "築館",
  formattedAddress: "宮城県栗原市築館薬師1丁目7-1付近",
};

const GUEST_DISPLAY_NAME_KEY = "trad-trav-guest-display-name";

function AppContent() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);
  const [showPostSplashLanguage, setShowPostSplashLanguage] = useState(false);
  const [showFirstAppWalkthrough, setShowFirstAppWalkthrough] = useState(false);
  const [firstAppWalkthroughStepIndex, setFirstAppWalkthroughStepIndex] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [viewHistory, setViewHistory] = useState<ViewHistoryItem[]>([]);
  const [favoriteSpotIds, setFavoriteSpotIds] = useState<number[]>([]);
  const [helpfulFavoriteKeys, setHelpfulFavoriteKeys] = useState<string[]>([]);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("map");
  /** 一度開いたタブはアンマウントしない（戻ったときの再フェッチを防ぐ） */
  const [tabsEverMounted, setTabsEverMounted] = useState<Record<ScreenType, boolean>>({
    map: true,
    now: false,
    manner: false,
    mypage: false,
  });
  const [mannerHelperSpot, setMannerHelperSpot] = useState<string | null>(null);
  const [preferredHelpfulTab, setPreferredHelpfulTab] = useState<HelpfulTabId | null>(null);
  const [locationPermissionState, setLocationPermissionState] = useState<LocationPermissionState>("idle");
  const [locationIssueCode, setLocationIssueCode] = useState<LocationIssueCode>("");
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<CurrentAddress | null>(null);
  const [isUsingMockLocation, setIsUsingMockLocation] = useState(false);
  const [settingsOpenKey, setSettingsOpenKey] = useState(0);
  const [tutorialProgress, setTutorialProgress] = useState<TutorialProgress | null>(null);
  const [activeTutorialScreen, setActiveTutorialScreen] = useState<TutorialTabId | null>(null);
  const [activeTutorialStepIndex, setActiveTutorialStepIndex] = useState(0);
  const mapTabTutorialRef = useRef<MapTabTutorialHandle | null>(null);
  const mannerTutorialRef = useRef<MannerTutorialHandle | null>(null);
  const mypageTutorialRef = useRef<MyPageTutorialHandle | null>(null);
  const [guestDisplayName, setGuestDisplayName] = useState("");
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(() => defaultPlayerProgress());
  const locationWatchIdRef = useRef<number | null>(null);
  const lastReverseGeocodeKeyRef = useRef<string>("");
  const currentPositionRef = useRef(currentPosition);
  currentPositionRef.current = currentPosition;
  const hasLocation = Boolean(currentPosition);

  // 診断結果からおすすめスポットIDを計算
  const activeTutorialSteps = useMemo(
    () =>
      activeTutorialScreen ? getTutorialSteps(activeTutorialScreen, { hasNowLocation: hasLocation }, t.tutorial) : [],
    [activeTutorialScreen, hasLocation, t.tutorial]
  );
  const activeTutorialStep = activeTutorialSteps[activeTutorialStepIndex] ?? null;

  const questUnclaimedNavBadge = useMemo(
    () => getQuestUnclaimedBadgeCounts(playerProgress).totalUnclaimed > 0,
    [playerProgress]
  );

  const handleSplashFinish = () => {
    setShowSplash(false);
    if (typeof window === "undefined") return;
    try {
      if (!readPostSplashLanguageSeen()) {
        setShowPostSplashLanguage(true);
      } else if (!readFirstAppWalkthroughDone()) {
        setFirstAppWalkthroughStepIndex(0);
        setShowFirstAppWalkthrough(true);
      }
    } catch {
      setShowPostSplashLanguage(true);
    }
  };

  const handlePostSplashLanguageDismiss = useCallback(() => {
    writePostSplashLanguageSeen();
    setShowPostSplashLanguage(false);
    if (!readFirstAppWalkthroughDone()) {
      setFirstAppWalkthroughStepIndex(0);
      setShowFirstAppWalkthrough(true);
    }
  }, []);

  const handleFirstWalkthroughSkip = useCallback(() => {
    writeFirstAppWalkthroughDone();
    setShowFirstAppWalkthrough(false);
    setFirstAppWalkthroughStepIndex(0);
  }, []);

  const handleFirstWalkthroughNext = useCallback(() => {
    setFirstAppWalkthroughStepIndex((idx) => {
      const nextIdx = idx + 1;
      if (nextIdx >= FIRST_APP_ONBOARDING_SLIDE_COUNT) {
        queueMicrotask(() => {
          writeFirstAppWalkthroughDone();
          setShowFirstAppWalkthrough(false);
        });
        return 0;
      }
      return nextIdx;
    });
  }, []);

  const handleFirstWalkthroughBack = useCallback(() => {
    setFirstAppWalkthroughStepIndex((idx) => Math.max(0, idx - 1));
  }, []);

  useEffect(() => {
    setTutorialProgress(loadTutorialProgress());
  }, []);

  useEffect(() => {
    setHelpfulFavoriteKeys(loadGuestHelpfulFavorites());
  }, []);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(GUEST_DISPLAY_NAME_KEY);
      if (v != null) setGuestDisplayName(v);
    } catch {
      /* ignore */
    }
  }, []);

  const handleSaveDisplayName = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (user?.id) {
        await saveTravelerDisplayName(user.id, trimmed);
        setUser((u) => (u ? { ...u, name: trimmed } : u));
      } else {
        try {
          window.localStorage.setItem(GUEST_DISPLAY_NAME_KEY, trimmed);
        } catch {
          /* ignore */
        }
        setGuestDisplayName(trimmed);
      }
    },
    [user?.id]
  );

  const handleLogin = async (loggedInUser: User, isNewUser: boolean = false) => {
    setUser(loggedInUser);
    setShowAuth(false);

    if (isNewUser) {
      try {
        const guestProg = loadGuestPlayerProgress();
        const merged = await mergeAndSavePlayerProgress(loggedInUser.id, defaultPlayerProgress(), guestProg);
        clearGuestPlayerProgress();
        setPlayerProgress(merged);
        const guestHelpful = loadGuestHelpfulFavorites();
        setHelpfulFavoriteKeys(guestHelpful);
        saveGuestHelpfulFavorites(guestHelpful);
        if (guestHelpful.length > 0) {
          await saveHelpfulFavorites(loggedInUser.id, guestHelpful);
        }
      } catch (error) {
        console.error("進捗の同期に失敗:", error);
        setPlayerProgress(defaultPlayerProgress());
      }
      setShowDiagnosis(true);
    } else {
      try {
        const guestProg = loadGuestPlayerProgress();
        const [savedResult, savedHistory, savedFavorites, savedHelpfulFavorites, travelerName, serverProg] =
          await Promise.all([
            getDiagnosisResult(loggedInUser.id),
            getViewHistory(loggedInUser.id),
            getFavorites(loggedInUser.id),
            getHelpfulFavorites(loggedInUser.id),
            getTravelerDisplayName(loggedInUser.id),
            getPlayerProgress(loggedInUser.id),
          ]);
        if (savedResult) setDiagnosisResult(savedResult);
        if (savedHistory.length > 0) setViewHistory(savedHistory);
        if (savedFavorites.length > 0) setFavoriteSpotIds(savedFavorites);
        setUser((prev) =>
          prev && prev.id === loggedInUser.id
            ? { ...prev, name: travelerName !== null ? travelerName : loggedInUser.name }
            : prev
        );
        const merged = await mergeAndSavePlayerProgress(loggedInUser.id, serverProg, guestProg);
        clearGuestPlayerProgress();
        setPlayerProgress(merged);
        const guestHelpful = loadGuestHelpfulFavorites();
        const mergedHelpful = Array.from(new Set([...savedHelpfulFavorites, ...guestHelpful])).sort((a, b) =>
          a.localeCompare(b, "ja")
        );
        setHelpfulFavoriteKeys(mergedHelpful);
        saveGuestHelpfulFavorites(mergedHelpful);
        await saveHelpfulFavorites(loggedInUser.id, mergedHelpful);
      } catch (error) {
        console.error("ユーザーデータの取得に失敗:", error);
      }
    }
  };

  const bumpPlayerProgress = useCallback(
    async (event: PlayerEvent) => {
      const uid = user?.id;
      if (uid) {
        try {
          const next = await recordPlayerEvent(uid, event);
          setPlayerProgress(next);
        } catch (error) {
          console.error("プレイヤー進捗の保存に失敗:", error);
        }
        return;
      }
      setPlayerProgress((prev) => {
        const next = applyPlayerEvent(prev, event);
        saveGuestPlayerProgress(next);
        return next;
      });
    },
    [user?.id]
  );

  const handleResetPlayerProgressDev = useCallback(async () => {
    const fresh = recomputePlayerXp(defaultPlayerProgress());
    const uid = user?.id;
    if (uid) {
      try {
        await savePlayerProgress(uid, defaultPlayerProgress());
        setPlayerProgress(fresh);
      } catch (error) {
        console.error("プレイヤー進捗のリセットに失敗:", error);
      }
      return;
    }
    clearGuestPlayerProgress();
    saveGuestPlayerProgress(fresh);
    setPlayerProgress(fresh);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setPlayerProgress(loadGuestPlayerProgress());
    }
  }, [user]);

  const handleDiagnosisComplete = async (result: DiagnosisResult) => {
    setDiagnosisResult(result);
    setShowDiagnosis(false);
    setCurrentScreen("map");

    if (user?.id) {
      try {
        await saveDiagnosisResult(user.id, result);
      } catch (error) {
        console.error("診断結果の保存に失敗:", error);
      }
    }
    void bumpPlayerProgress({ type: "diagnosis_complete" });
  };

  const handleScreenChange = (screen: ScreenType) => {
    setCurrentScreen(screen);
    if (screen !== "manner") {
      setMannerHelperSpot(null);
      setPreferredHelpfulTab(null);
    }
  };

  useEffect(() => {
    setTabsEverMounted((prev) => (prev[currentScreen] ? prev : { ...prev, [currentScreen]: true }));
  }, [currentScreen]);

  const completeTutorial = useCallback(
    (screen: TutorialTabId) => {
      setTutorialProgress((prev) => {
        const next = { ...(prev ?? DEFAULT_TUTORIAL_PROGRESS), [screen]: true };
        saveTutorialProgress(next);
        return next;
      });
      setActiveTutorialScreen(null);
      setActiveTutorialStepIndex(0);
      void bumpPlayerProgress({ type: "tutorial_complete", screen });
    },
    [bumpPlayerProgress]
  );

  const handleSkipTutorial = useCallback(() => {
    if (!activeTutorialScreen) return;
    completeTutorial(activeTutorialScreen);
  }, [activeTutorialScreen, completeTutorial]);

  const handleTutorialBack = useCallback(() => {
    setActiveTutorialStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleTutorialAction = useCallback((actionId: string) => {
    if (!activeTutorialScreen || !activeTutorialStep) return;
    if (actionId !== activeTutorialStep.targetId) return;

    const isLastStep = activeTutorialStepIndex >= activeTutorialSteps.length - 1;
    if (isLastStep) {
      completeTutorial(activeTutorialScreen);
      return;
    }

    setActiveTutorialStepIndex((prev) => prev + 1);
  }, [activeTutorialScreen, activeTutorialStep, activeTutorialStepIndex, activeTutorialSteps.length, completeTutorial]);

  const handleReplayTutorials = useCallback(() => {
    resetTutorialProgress();
    setTutorialProgress(DEFAULT_TUTORIAL_PROGRESS);
    setActiveTutorialStepIndex(0);
    setCurrentScreen("map");
    setActiveTutorialScreen("map");
  }, []);

  useEffect(() => {
    if (
      !tutorialProgress ||
      showSplash ||
      showDiagnosis ||
      showAuth ||
      showPostSplashLanguage ||
      showFirstAppWalkthrough
    ) {
      return;
    }

    if (activeTutorialScreen && activeTutorialScreen !== currentScreen) {
      setActiveTutorialScreen(null);
      setActiveTutorialStepIndex(0);
      return;
    }

    if (activeTutorialScreen) {
      return;
    }

    const nextScreen = currentScreen as TutorialTabId;
    if (!tutorialProgress[nextScreen]) {
      setActiveTutorialScreen(nextScreen);
      setActiveTutorialStepIndex(0);
    }
  }, [
    activeTutorialScreen,
    currentScreen,
    showAuth,
    showDiagnosis,
    showFirstAppWalkthrough,
    showPostSplashLanguage,
    showSplash,
    tutorialProgress,
  ]);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `/api/google-places/reverse-geocode?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}&lang=${encodeURIComponent(language)}`
      );
      const data = await res.json() as {
        prefecture?: string;
        city?: string;
        town?: string;
        formattedAddress?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "reverse geocode failed");
      }

      setCurrentAddress({
        prefecture: data.prefecture || "",
        city: data.city || "",
        town: data.town || "",
        formattedAddress: data.formattedAddress || "",
      });
    } catch (error) {
      console.warn("位置情報の住所変換に失敗:", error);
      setCurrentAddress(null);
    }
  }, [language]);

  useEffect(() => {
    const pos = currentPositionRef.current;
    if (!pos) return;
    void reverseGeocode(pos.latitude, pos.longitude);
  }, [language, reverseGeocode]);

  const applyAssumedFallbackLocation = useCallback(() => {
    setCurrentPosition(ASSUMED_FALLBACK_POSITION);
    setCurrentAddress(ASSUMED_FALLBACK_ADDRESS);
    setLocationPermissionState("granted");
    setLocationIssueCode("");
    setIsUsingMockLocation(true);
  }, []);

  /** なう情報の開発者ツール: GPS を止め、栗原市の固定座標を現在地にする */
  const handleUseDeveloperKuriharaLocation = useCallback(() => {
    if (locationWatchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }
    applyAssumedFallbackLocation();
    lastReverseGeocodeKeyRef.current = "";
    void reverseGeocode(ASSUMED_FALLBACK_POSITION.latitude, ASSUMED_FALLBACK_POSITION.longitude);
  }, [applyAssumedFallbackLocation, reverseGeocode]);

  const isDesktopLikeDevice = useCallback(() => {
    if (typeof navigator === "undefined") return false;
    return /Macintosh|Windows|Linux/i.test(navigator.userAgent) && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);

  const startLocationTracking = useCallback(() => {
    if (isDesktopLikeDevice()) {
      applyAssumedFallbackLocation();
      lastReverseGeocodeKeyRef.current = "";
      void reverseGeocode(ASSUMED_FALLBACK_POSITION.latitude, ASSUMED_FALLBACK_POSITION.longitude);
      return;
    }

    if (!navigator.geolocation) {
      setLocationPermissionState("unsupported");
      setLocationIssueCode("device_unsupported");
      setCurrentPosition(null);
      setCurrentAddress(null);
      setIsUsingMockLocation(false);
      return;
    }

    if (!window.isSecureContext) {
      setLocationPermissionState("error");
      setLocationIssueCode("insecure_context");
      setCurrentPosition(null);
      setCurrentAddress(null);
      setIsUsingMockLocation(false);
      return;
    }

    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }

    setLocationPermissionState("requesting");
    setLocationIssueCode("");
    setIsUsingMockLocation(false);

    // watchPosition でアプリ表示中は現在地を継続監視する
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setCurrentPosition({ latitude, longitude });
        setLocationPermissionState("granted");
        setLocationIssueCode("");
        setIsUsingMockLocation(false);

        const nextKey = makeLocationKey(latitude, longitude);
        if (lastReverseGeocodeKeyRef.current !== nextKey) {
          lastReverseGeocodeKeyRef.current = nextKey;
          void reverseGeocode(latitude, longitude);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermissionState("denied");
          setLocationIssueCode("permission_denied");
          setCurrentPosition(null);
          setCurrentAddress(null);
          setIsUsingMockLocation(false);
          if (locationWatchIdRef.current !== null) {
            navigator.geolocation.clearWatch(locationWatchIdRef.current);
            locationWatchIdRef.current = null;
          }
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationPermissionState("error");
          setLocationIssueCode("position_unavailable");
          setCurrentPosition(null);
          setCurrentAddress(null);
          setIsUsingMockLocation(false);
          return;
        }

        if (error.code === error.TIMEOUT) {
          setLocationPermissionState("error");
          setLocationIssueCode("timeout");
          setCurrentPosition(null);
          setCurrentAddress(null);
          setIsUsingMockLocation(false);
          return;
        }

        setLocationPermissionState("error");
        setLocationIssueCode("generic");
        setCurrentPosition(null);
        setCurrentAddress(null);
        setIsUsingMockLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [applyAssumedFallbackLocation, isDesktopLikeDevice, reverseGeocode]);

  const handleRequestLocationPermission = useCallback(() => {
    startLocationTracking();
  }, [startLocationTracking]);

  const handleTutorialNext = useCallback(() => {
    if (!activeTutorialScreen || !activeTutorialStep) return;
    const isLast = activeTutorialStepIndex >= activeTutorialSteps.length - 1;
    if (isLast) {
      completeTutorial(activeTutorialScreen);
      return;
    }
    const tid = activeTutorialStep.targetId;
    if (activeTutorialScreen === "now") {
      if (tid === "now.location-update-button") {
        handleRequestLocationPermission();
      }
    } else if (activeTutorialScreen === "map") {
      mapTabTutorialRef.current?.applyTutorialAutomation(tid);
    } else if (activeTutorialScreen === "manner") {
      mannerTutorialRef.current?.applyTutorialAutomation(tid);
    } else if (activeTutorialScreen === "mypage") {
      mypageTutorialRef.current?.applyTutorialAutomation(tid);
    }
    setActiveTutorialStepIndex((prev) => prev + 1);
  }, [
    activeTutorialScreen,
    activeTutorialStep,
    activeTutorialStepIndex,
    activeTutorialSteps.length,
    completeTutorial,
    handleRequestLocationPermission,
  ]);

  // 画面を離れたら watchPosition を必ず停止する
  useEffect(() => () => {
    if (locationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }
  }, []);

  const handleOpenLocationSettings = () => {
    setCurrentScreen("mypage");
    setSettingsOpenKey((prev) => prev + 1);
  };

  // マナーAIをスポット連携で開く
  const handleOpenLanguageHelper = (spotName: string) => {
    setMannerHelperSpot(spotName);
    setPreferredHelpfulTab(null);
    setCurrentScreen("manner");
  };

  const handleOpenReservationGuide = useCallback(() => {
    const params = new URLSearchParams();
        params.set("guideTab", "guide");
    params.set("guideDetail", EXPERIENCE_RESERVATION_GUIDE_DETAIL_KEY);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setCurrentScreen("manner");
  }, [pathname, router]);

  const handleOpenHelpfulFavorite = useCallback(
    (favoriteKey: string) => {
      const normalized = normalizeHelpfulFavoriteKey(favoriteKey);
      const [kind, id] = normalized.split(":");
      let guideTab: HelpfulTabId = "manner";
      if (kind === "tips" && id) {
        const topic = TIPS_TOPICS.find((t) => t.id === id);
        guideTab = topic?.tabId === "guide" ? "guide" : "trivia";
      }
      const params = new URLSearchParams();
      params.set("guideTab", guideTab);
      params.set("guideDetail", normalized);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      setMannerHelperSpot(null);
      setPreferredHelpfulTab(null);
      setCurrentScreen("manner");
    },
    [pathname, router]
  );

  const handleToggleHelpfulFavoriteKey = useCallback(
    async (key: string) => {
      const normalized = normalizeHelpfulFavoriteKey(key);
      const wasFavorite = helpfulFavoriteKeys.includes(normalized);
      if (user?.id) {
        try {
          const next = await toggleHelpfulFavorite(user.id, normalized);
          setHelpfulFavoriteKeys(next);
          saveGuestHelpfulFavorites(next);
          if (!wasFavorite) void bumpPlayerProgress({ type: "favorite_add" });
        } catch (error) {
          console.error("お役立ちお気に入りの更新に失敗:", error);
        }
        return;
      }
      setHelpfulFavoriteKeys((prev) => {
        const next = prev.includes(normalized) ? prev.filter((k) => k !== normalized) : [...prev, normalized];
        saveGuestHelpfulFavorites(next);
        return next;
      });
      if (!wasFavorite) void bumpPlayerProgress({ type: "favorite_add" });
    },
    [user?.id, helpfulFavoriteKeys, bumpPlayerProgress]
  );

  const handleJumpToSpot = useCallback((spotId: number, spotNameHint?: string) => {
    const spot = recommendedSpots.find((s) => s.id === spotId);
    const url = spot
      ? buildGoogleMapsUrl({ lat: spot.lat, lng: spot.lng, label: spot.name })
      : buildGoogleMapsUrl({
          query: spotNameHint?.trim() ? `${spotNameHint.trim()} 宮城県` : undefined,
        });
    openGoogleMapsUrl(url);
  }, []);

  const handleToggleFavorite = async (spotId: number) => {
    const wasFavorite = favoriteSpotIds.includes(spotId);
    const updated = wasFavorite
      ? favoriteSpotIds.filter(id => id !== spotId)
      : [...favoriteSpotIds, spotId];
    setFavoriteSpotIds(updated);
    if (user?.id) {
      try {
        await toggleFavorite(user.id, spotId);
      } catch (error) {
        console.error("お気に入りの更新に失敗:", error);
        setFavoriteSpotIds(favoriteSpotIds);
        return;
      }
    }
    if (!wasFavorite) {
      void bumpPlayerProgress({ type: "favorite_add" });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setDiagnosisResult(null);
      setViewHistory([]);
      setFavoriteSpotIds([]);
      setPlayerProgress(loadGuestPlayerProgress());
    } catch (error) {
      console.error("ログアウトに失敗:", error);
    }
  };

  const handleSpotView = async (spot: { id: number; name: string; category: string }) => {
    const historyItem: ViewHistoryItem = {
      id: spot.id,
      name: spot.name,
      date: new Date().toISOString().split("T")[0],
      category: spot.category,
    };

    setViewHistory(prev => {
      const filtered = prev.filter(h => h.id !== spot.id);
      return [historyItem, ...filtered].slice(0, 10);
    });

    if (user?.id) {
      try {
        await addViewHistory(user.id, historyItem);
      } catch (error) {
        console.error("閲覧履歴の保存に失敗:", error);
      }
    }
    void bumpPlayerProgress({ type: "spot_view" });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* スプラッシュ画面 */}
      {showSplash && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {!showSplash && showPostSplashLanguage && (
        <PostSplashLanguageOverlay onDismiss={handlePostSplashLanguageDismiss} />
      )}

      {!showSplash && showFirstAppWalkthrough && (
        <AppOnboardingWalkthrough
          slideIndex={firstAppWalkthroughStepIndex}
          onPrimary={handleFirstWalkthroughNext}
          onBack={handleFirstWalkthroughBack}
          onSkip={handleFirstWalkthroughSkip}
        />
      )}

      {/* 診断画面 */}
      {showDiagnosis && (
        <DiagnosisView
          onComplete={handleDiagnosisComplete}
          onCancel={() => setShowDiagnosis(false)}
        />
      )}

      {/* メインコンテンツ */}
      {!showSplash && !showDiagnosis && (
        <div className="flex h-full min-h-0 flex-col">
          <div className="relative min-h-0 flex-1">
            {tabsEverMounted.map && (
              <div
                className={currentScreen === "map" ? "absolute inset-0 min-h-0 overflow-hidden" : "hidden"}
                aria-hidden={currentScreen !== "map"}
              >
                <MapTabView
                  ref={mapTabTutorialRef}
                  onSpotView={handleSpotView}
                  favoriteSpotIds={favoriteSpotIds}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenLanguageHelper={handleOpenLanguageHelper}
                  onOpenReservationGuide={handleOpenReservationGuide}
                  onTutorialAction={handleTutorialAction}
                />
              </div>
            )}

            {tabsEverMounted.manner && (
              <div
                className={currentScreen === "manner" ? "absolute inset-0 min-h-0 overflow-hidden" : "hidden"}
                aria-hidden={currentScreen !== "manner"}
              >
                <MannerView
                  ref={mannerTutorialRef}
                  spotName={mannerHelperSpot}
                  locationPermissionState={locationPermissionState}
                  isUsingMockLocation={isUsingMockLocation}
                  preferredTab={preferredHelpfulTab}
                  onPreferredTabApplied={() => setPreferredHelpfulTab(null)}
                  onTutorialAction={handleTutorialAction}
                  helpfulFavoriteKeys={helpfulFavoriteKeys}
                  onToggleHelpfulFavorite={handleToggleHelpfulFavoriteKey}
                />
              </div>
            )}

            {tabsEverMounted.now && (
              <div
                className={currentScreen === "now" ? "absolute inset-0 min-h-0 overflow-hidden" : "hidden"}
                aria-hidden={currentScreen !== "now"}
              >
                <NowInfoView
                  locationPermissionState={locationPermissionState}
                  locationIssueCode={locationIssueCode}
                  currentPosition={currentPosition}
                  currentAddress={currentAddress}
                  isUsingMockLocation={isUsingMockLocation}
                  onRequestLocationPermission={handleRequestLocationPermission}
                  onOpenLocationSettings={handleOpenLocationSettings}
                  onTutorialAction={handleTutorialAction}
                  onUseDeveloperKuriharaLocation={
                    process.env.NODE_ENV === "development" ? handleUseDeveloperKuriharaLocation : undefined
                  }
                />
              </div>
            )}

            {tabsEverMounted.mypage && (
              <div
                className={currentScreen === "mypage" ? "absolute inset-0 min-h-0 overflow-hidden" : "hidden"}
                aria-hidden={currentScreen !== "mypage"}
              >
                <MyPageView
                  ref={mypageTutorialRef}
                  user={user}
                  guestDisplayName={guestDisplayName}
                  onSaveDisplayName={handleSaveDisplayName}
                  viewHistory={viewHistory}
                  onLogout={handleLogout}
                  onJumpToSpot={handleJumpToSpot}
                  onStartDiagnosis={() => setShowDiagnosis(true)}
                  onLoginRequest={() => setShowAuth(true)}
                  locationPermissionState={locationPermissionState}
                  locationIssueCode={locationIssueCode}
                  currentPosition={currentPosition}
                  currentAddress={currentAddress}
                  isUsingMockLocation={isUsingMockLocation}
                  onRequestLocationPermission={handleRequestLocationPermission}
                  settingsOpenKey={settingsOpenKey}
                  onTutorialAction={handleTutorialAction}
                  onReplayTutorials={handleReplayTutorials}
                  favoriteSpotIds={favoriteSpotIds}
                  onToggleFavorite={handleToggleFavorite}
                  helpfulFavoriteKeys={helpfulFavoriteKeys}
                  onToggleHelpfulFavorite={handleToggleHelpfulFavoriteKey}
                  onOpenHelpfulFavorite={handleOpenHelpfulFavorite}
                  playerProgress={playerProgress}
                  onClaimQuest={(questId) => void bumpPlayerProgress({ type: "quest_claim", questId })}
                  onResetPlayerProgressDev={
                    process.env.NODE_ENV === "development" ? handleResetPlayerProgressDev : undefined
                  }
                />
              </div>
            )}
          </div>

          {/* ボトムナビゲーション */}
          <BottomNavigation
            currentScreen={currentScreen}
            onScreenChange={handleScreenChange}
            onTutorialAction={handleTutorialAction}
            showMypageQuestUnclaimedBadge={questUnclaimedNavBadge}
          />
          {activeTutorialScreen === currentScreen && activeTutorialStep && !showFirstAppWalkthrough && (
            <TutorialOverlay
              targetId={activeTutorialStep.targetId}
              title={activeTutorialStep.title}
              description={activeTutorialStep.description}
              stepIndex={activeTutorialStepIndex}
              totalSteps={activeTutorialSteps.length}
              onBack={handleTutorialBack}
              onSkip={handleSkipTutorial}
              onNext={handleTutorialNext}
            />
          )}
        </div>
      )}

      {/* 認証画面（マイページからのオーバーレイ） */}
      {showAuth && (
        <div className="absolute inset-0 z-50">
          <AuthView onLogin={handleLogin} onSkip={() => setShowAuth(false)} />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
