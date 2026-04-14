"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BottomNavigation from "./components/BottomNavigation";
import SplashScreen from "./components/SplashScreen";
import DiagnosisView, { type DiagnosisResult } from "./components/DiagnosisView";
import MyPageView from "./components/MyPageView";
import AuthView from "./components/AuthView";
import MapTabView from "./components/MapTabView";
import MannerView from "./components/MannerView";
import NowInfoView from "./components/NowInfoView";
import TutorialOverlay from "./components/TutorialOverlay";
import { LanguageProvider } from "./i18n/LanguageContext";
import {
  saveDiagnosisResult,
  getDiagnosisResult,
  getViewHistory,
  addViewHistory,
  getFavorites,
  toggleFavorite,
  getTravelerDisplayName,
  saveTravelerDisplayName,
  getPlayerProgress,
  mergeAndSavePlayerProgress,
  recordPlayerEvent,
  type ViewHistoryItem,
  auth,
} from "./lib/firebase";
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
  saveGuestPlayerProgress,
  type PlayerEvent,
  type PlayerProgress,
} from "./lib/playerProgress";
import { getRecommendedSpotIds } from "./data/spots";
import type { HelpfulTabId } from "./data/helpfulInfo";
import { signOut } from "firebase/auth";

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

const ASSUMED_SENDAI_POSITION = {
  latitude: 38.2682,
  longitude: 140.8694,
};

const ASSUMED_SENDAI_ADDRESS: CurrentAddress = {
  prefecture: "宮城県",
  city: "仙台市",
  town: "青葉区",
  formattedAddress: "宮城県仙台市青葉区",
};

const GUEST_DISPLAY_NAME_KEY = "trad-trav-guest-display-name";

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [viewHistory, setViewHistory] = useState<ViewHistoryItem[]>([]);
  const [favoriteSpotIds, setFavoriteSpotIds] = useState<number[]>([]);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("map");
  const [jumpToSpotId, setJumpToSpotId] = useState<number | null>(null);
  const [mapResetKey, setMapResetKey] = useState(0);
  const [mannerHelperSpot, setMannerHelperSpot] = useState<string | null>(null);
  const [preferredHelpfulTab, setPreferredHelpfulTab] = useState<HelpfulTabId | null>(null);
  const [locationPermissionState, setLocationPermissionState] = useState<LocationPermissionState>("idle");
  const [locationError, setLocationError] = useState("");
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<CurrentAddress | null>(null);
  const [isUsingMockLocation, setIsUsingMockLocation] = useState(false);
  const [settingsOpenKey, setSettingsOpenKey] = useState(0);
  const [tutorialProgress, setTutorialProgress] = useState<TutorialProgress | null>(null);
  const [activeTutorialScreen, setActiveTutorialScreen] = useState<TutorialTabId | null>(null);
  const [activeTutorialStepIndex, setActiveTutorialStepIndex] = useState(0);
  const [guestDisplayName, setGuestDisplayName] = useState("");
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>(() => defaultPlayerProgress());
  const locationWatchIdRef = useRef<number | null>(null);
  const lastReverseGeocodeKeyRef = useRef<string>("");
  const hasLocation = Boolean(currentPosition);

  // 診断結果からおすすめスポットIDを計算
  const recommendedSpotIds = diagnosisResult
    ? getRecommendedSpotIds(diagnosisResult.interests)
    : null;
  const activeTutorialSteps = useMemo(
    () => (activeTutorialScreen ? getTutorialSteps(activeTutorialScreen, { hasNowLocation: hasLocation }) : []),
    [activeTutorialScreen, hasLocation]
  );
  const activeTutorialStep = activeTutorialSteps[activeTutorialStepIndex] ?? null;

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    setTutorialProgress(loadTutorialProgress());
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
      } catch (error) {
        console.error("進捗の同期に失敗:", error);
        setPlayerProgress(defaultPlayerProgress());
      }
      setShowDiagnosis(true);
    } else {
      try {
        const guestProg = loadGuestPlayerProgress();
        const [savedResult, savedHistory, savedFavorites, travelerName, serverProg] = await Promise.all([
          getDiagnosisResult(loggedInUser.id),
          getViewHistory(loggedInUser.id),
          getFavorites(loggedInUser.id),
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
    setActiveTutorialScreen("mypage");
    setActiveTutorialStepIndex(0);
  }, []);

  useEffect(() => {
    if (!tutorialProgress || showSplash || showDiagnosis || showAuth) {
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
  }, [activeTutorialScreen, currentScreen, showAuth, showDiagnosis, showSplash, tutorialProgress]);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`/api/google-places/reverse-geocode?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`);
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
  }, []);

  const applyAssumedSendaiLocation = useCallback(() => {
    setCurrentPosition(ASSUMED_SENDAI_POSITION);
    setCurrentAddress(ASSUMED_SENDAI_ADDRESS);
    setLocationPermissionState("granted");
    setLocationError("");
    setIsUsingMockLocation(true);
  }, []);

  const isDesktopLikeDevice = useCallback(() => {
    if (typeof navigator === "undefined") return false;
    return /Macintosh|Windows|Linux/i.test(navigator.userAgent) && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }, []);

  const startLocationTracking = useCallback(() => {
    if (isDesktopLikeDevice()) {
      applyAssumedSendaiLocation();
      return;
    }

    if (!navigator.geolocation) {
      setLocationPermissionState("unsupported");
      setLocationError("この端末では位置情報を利用できません。");
      setCurrentPosition(null);
      setCurrentAddress(null);
      setIsUsingMockLocation(false);
      return;
    }

    if (!window.isSecureContext) {
      setLocationPermissionState("error");
      setLocationError("位置情報は安全な接続のページでのみ利用できます。");
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
    setLocationError("");
    setIsUsingMockLocation(false);

    // watchPosition でアプリ表示中は現在地を継続監視する
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setCurrentPosition({ latitude, longitude });
        setLocationPermissionState("granted");
        setLocationError("");
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
          setLocationError("位置情報の許可がオフになっています。");
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
          setLocationError("現在地を特定できませんでした。GPSや通信状況をご確認ください。");
          setCurrentPosition(null);
          setCurrentAddress(null);
          setIsUsingMockLocation(false);
          return;
        }

        if (error.code === error.TIMEOUT) {
          setLocationPermissionState("error");
          setLocationError("位置情報の取得がタイムアウトしました。少し待ってから再度お試しください。");
          setCurrentPosition(null);
          setCurrentAddress(null);
          setIsUsingMockLocation(false);
          return;
        }

        setLocationPermissionState("error");
        setLocationError("位置情報を取得できませんでした。");
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
  }, [applyAssumedSendaiLocation, isDesktopLikeDevice, reverseGeocode]);

  const handleRequestLocationPermission = useCallback(() => {
    startLocationTracking();
  }, [startLocationTracking]);

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

  const handleOpenHelpfulTab = (tabId: HelpfulTabId) => {
    setPreferredHelpfulTab(tabId);
    setMannerHelperSpot(null);
    setCurrentScreen("manner");
  };

  const handleOpenExperienceBooking = () => {
    setPreferredHelpfulTab(null);
    setMannerHelperSpot(null);
    setJumpToSpotId(null);
    setMapResetKey((prev) => prev + 1);
    setCurrentScreen("map");
  };

  // マップタブへジャンプ（プランビューや閲覧履歴から）
  const handleJumpToSpot = (spotId: number) => {
    setJumpToSpotId(spotId);
    setCurrentScreen("map");
  };

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

      {/* 診断画面 */}
      {showDiagnosis && (
        <DiagnosisView
          onComplete={handleDiagnosisComplete}
          onCancel={() => setShowDiagnosis(false)}
        />
      )}

      {/* メインコンテンツ */}
      {!showSplash && !showDiagnosis && (
        <>
          {/* マップ（サブタブ: マップ / 検索） */}
          {currentScreen === "map" && (
            <MapTabView
              onSpotView={handleSpotView}
              jumpToSpotId={jumpToSpotId}
              onJumpComplete={() => setJumpToSpotId(null)}
              favoriteSpotIds={favoriteSpotIds}
              onToggleFavorite={handleToggleFavorite}
              recommendedSpotIds={recommendedSpotIds}
              onOpenLanguageHelper={handleOpenLanguageHelper}
              onOpenTravelGuide={() => handleOpenHelpfulTab("travel")}
              resetToSearchKey={mapResetKey}
              onTutorialAction={handleTutorialAction}
            />
          )}

          {/* マナー */}
          {currentScreen === "manner" && (
            <MannerView
              spotName={mannerHelperSpot}
              locationPermissionState={locationPermissionState}
              isUsingMockLocation={isUsingMockLocation}
              onOpenLocationSettings={handleOpenLocationSettings}
              preferredTab={preferredHelpfulTab}
              onPreferredTabApplied={() => setPreferredHelpfulTab(null)}
              onTutorialAction={handleTutorialAction}
            />
          )}

          {/* なう情報 */}
          {currentScreen === "now" && (
            <NowInfoView
              locationPermissionState={locationPermissionState}
              locationError={locationError}
              currentPosition={currentPosition}
              currentAddress={currentAddress}
              isUsingMockLocation={isUsingMockLocation}
              onRequestLocationPermission={handleRequestLocationPermission}
              onOpenLocationSettings={handleOpenLocationSettings}
              onOpenHelpfulTab={handleOpenHelpfulTab}
              onOpenExperienceBooking={handleOpenExperienceBooking}
              onTutorialAction={handleTutorialAction}
            />
          )}

          {/* マイページ */}
          {currentScreen === "mypage" && (
            <MyPageView
              diagnosisResult={diagnosisResult}
              user={user}
              guestDisplayName={guestDisplayName}
              onSaveDisplayName={handleSaveDisplayName}
              viewHistory={viewHistory}
              onLogout={handleLogout}
              onJumpToSpot={handleJumpToSpot}
              onStartDiagnosis={() => setShowDiagnosis(true)}
              onLoginRequest={() => setShowAuth(true)}
              locationPermissionState={locationPermissionState}
              locationError={locationError}
              currentPosition={currentPosition}
              currentAddress={currentAddress}
              isUsingMockLocation={isUsingMockLocation}
              onRequestLocationPermission={handleRequestLocationPermission}
              settingsOpenKey={settingsOpenKey}
              onTutorialAction={handleTutorialAction}
              onReplayTutorials={handleReplayTutorials}
              favoriteSpotIds={favoriteSpotIds}
              onToggleFavorite={handleToggleFavorite}
              playerProgress={playerProgress}
            />
          )}

          {/* ボトムナビゲーション */}
          <BottomNavigation
            currentScreen={currentScreen}
            onScreenChange={handleScreenChange}
            onTutorialAction={handleTutorialAction}
          />
          {activeTutorialScreen === currentScreen && activeTutorialStep && (
            <TutorialOverlay
              targetId={activeTutorialStep.targetId}
              title={activeTutorialStep.title}
              description={activeTutorialStep.description}
              stepIndex={activeTutorialStepIndex}
              totalSteps={activeTutorialSteps.length}
              onSkip={handleSkipTutorial}
            />
          )}
        </>
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
