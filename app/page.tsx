"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BottomNavigation from "./components/BottomNavigation";
import SplashScreen from "./components/SplashScreen";
import DiagnosisView, { type DiagnosisResult } from "./components/DiagnosisView";
import MyPageView from "./components/MyPageView";
import AuthView from "./components/AuthView";
import MapTabView from "./components/MapTabView";
import MannerView from "./components/MannerView";
import { LanguageProvider } from "./i18n/LanguageContext";
import { saveDiagnosisResult, getDiagnosisResult, getViewHistory, addViewHistory, getFavorites, toggleFavorite, type ViewHistoryItem, auth } from "./lib/firebase";
import { getRecommendedSpotIds } from "./data/spots";
import { signOut } from "firebase/auth";

// 画面の種類
export type ScreenType = "map" | "manner" | "mypage";

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
  const [mannerHelperSpot, setMannerHelperSpot] = useState<string | null>(null);
  const [locationPermissionState, setLocationPermissionState] = useState<LocationPermissionState>("idle");
  const [locationError, setLocationError] = useState("");
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<CurrentAddress | null>(null);
  const [locationSettingsFocusKey, setLocationSettingsFocusKey] = useState(0);
  const locationWatchIdRef = useRef<number | null>(null);
  const lastReverseGeocodeKeyRef = useRef<string>("");

  // 診断結果からおすすめスポットIDを計算
  const recommendedSpotIds = diagnosisResult
    ? getRecommendedSpotIds(diagnosisResult.interests)
    : null;

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleLogin = async (loggedInUser: User, isNewUser: boolean = false) => {
    setUser(loggedInUser);
    setShowAuth(false);

    if (isNewUser) {
      setShowDiagnosis(true);
    } else {
      try {
        const [savedResult, savedHistory, savedFavorites] = await Promise.all([
          getDiagnosisResult(loggedInUser.id),
          getViewHistory(loggedInUser.id),
          getFavorites(loggedInUser.id),
        ]);
        if (savedResult) setDiagnosisResult(savedResult);
        if (savedHistory.length > 0) setViewHistory(savedHistory);
        if (savedFavorites.length > 0) setFavoriteSpotIds(savedFavorites);
      } catch (error) {
        console.error("ユーザーデータの取得に失敗:", error);
      }
    }
  };

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
  };

  const handleScreenChange = (screen: ScreenType) => {
    setCurrentScreen(screen);
    if (screen !== "manner") setMannerHelperSpot(null);
  };

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

  const handleRequestLocationPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPermissionState("unsupported");
      setLocationError("この端末では位置情報を利用できません。");
      setCurrentPosition(null);
      setCurrentAddress(null);
      return;
    }

    if (!window.isSecureContext) {
      setLocationPermissionState("error");
      setLocationError("位置情報は安全な接続のページでのみ利用できます。");
      setCurrentPosition(null);
      setCurrentAddress(null);
      return;
    }

    if (locationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }

    setLocationPermissionState("requesting");
    setLocationError("");
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setCurrentPosition({ latitude, longitude });
        setLocationPermissionState("granted");
        setLocationError("");

        const nextKey = `${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
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
          return;
        }

        if (error.code === error.TIMEOUT) {
          setLocationPermissionState("error");
          setLocationError("位置情報の取得がタイムアウトしました。少し待ってから再度お試しください。");
          setCurrentPosition(null);
          setCurrentAddress(null);
          return;
        }

        setLocationPermissionState("error");
        setLocationError("位置情報を取得できませんでした。");
        setCurrentPosition(null);
        setCurrentAddress(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [reverseGeocode]);

  useEffect(() => () => {
    if (locationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(locationWatchIdRef.current);
      locationWatchIdRef.current = null;
    }
  }, []);

  const handleOpenLocationSettings = () => {
    setCurrentScreen("mypage");
    setLocationSettingsFocusKey((prev) => prev + 1);
  };

  // マナーAIをスポット連携で開く
  const handleOpenLanguageHelper = (spotName: string) => {
    setMannerHelperSpot(spotName);
    setCurrentScreen("manner");
  };

  // マップタブへジャンプ（プランビューや閲覧履歴から）
  const handleJumpToSpot = (spotId: number) => {
    setJumpToSpotId(spotId);
    setCurrentScreen("map");
  };

  const handleToggleFavorite = async (spotId: number) => {
    const updated = favoriteSpotIds.includes(spotId)
      ? favoriteSpotIds.filter(id => id !== spotId)
      : [...favoriteSpotIds, spotId];
    setFavoriteSpotIds(updated);
    if (user?.id) {
      try {
        await toggleFavorite(user.id, spotId);
      } catch (error) {
        console.error("お気に入りの更新に失敗:", error);
        setFavoriteSpotIds(favoriteSpotIds);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setDiagnosisResult(null);
      setViewHistory([]);
      setFavoriteSpotIds([]);
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
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* スプラッシュ画面 */}
      {showSplash && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {/* 診断画面 */}
      {showDiagnosis && (
        <DiagnosisView onComplete={handleDiagnosisComplete} />
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
            />
          )}

          {/* マナー */}
          {currentScreen === "manner" && (
            <MannerView
              spotName={mannerHelperSpot}
              locationPermissionState={locationPermissionState}
              onOpenLocationSettings={handleOpenLocationSettings}
            />
          )}

          {/* マイページ */}
          {currentScreen === "mypage" && (
            <MyPageView
              diagnosisResult={diagnosisResult}
              user={user}
              viewHistory={viewHistory}
              onLogout={handleLogout}
              onJumpToSpot={handleJumpToSpot}
              onStartDiagnosis={() => { setShowDiagnosis(true); setCurrentScreen("map"); }}
              onLoginRequest={() => setShowAuth(true)}
              locationPermissionState={locationPermissionState}
              locationError={locationError}
              currentPosition={currentPosition}
              currentAddress={currentAddress}
              onRequestLocationPermission={handleRequestLocationPermission}
              locationSettingsFocusKey={locationSettingsFocusKey}
            />
          )}

          {/* ボトムナビゲーション */}
          <BottomNavigation currentScreen={currentScreen} onScreenChange={handleScreenChange} />
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
