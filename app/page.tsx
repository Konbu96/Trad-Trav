"use client";

import { useState } from "react";
import BottomNavigation from "./components/BottomNavigation";
import SplashScreen from "./components/SplashScreen";
import TranslationView from "./components/TranslationView";
import DiagnosisView, { type DiagnosisResult } from "./components/DiagnosisView";
import MyPageView from "./components/MyPageView";
import AuthView from "./components/AuthView";
import PlanView from "./components/PlanView";
import MapTabView from "./components/MapTabView";
import { LanguageProvider } from "./i18n/LanguageContext";
import { saveDiagnosisResult, getDiagnosisResult, getViewHistory, addViewHistory, getFavorites, toggleFavorite, type ViewHistoryItem, auth } from "./lib/firebase";
import { getRecommendedSpotIds } from "./data/spots";
import { signOut } from "firebase/auth";

// 画面の種類
export type ScreenType = "plan" | "map" | "chat" | "mypage";

// ユーザー情報
export interface User {
  id: string;
  name: string;
  email: string;
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
  const [languageHelperSpot, setLanguageHelperSpot] = useState<string | null>(null);

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
    setCurrentScreen("plan");

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
    if (screen !== "chat") setLanguageHelperSpot(null);
  };

  // 言語ヘルパーをスポット連携で開く
  const handleOpenLanguageHelper = (spotName: string) => {
    setLanguageHelperSpot(spotName);
    setCurrentScreen("chat");
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
          {/* プラン */}
          {currentScreen === "plan" && (
            <PlanView
              diagnosisResult={diagnosisResult}
              onJumpToSpot={handleJumpToSpot}
              favoriteSpotIds={favoriteSpotIds}
              onToggleFavorite={handleToggleFavorite}
              onSpotView={handleSpotView}
              onStartDiagnosis={() => setShowDiagnosis(true)}
              onOpenLanguageHelper={handleOpenLanguageHelper}
            />
          )}

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

          {/* 言語ヘルパー */}
          {currentScreen === "chat" && (
            <TranslationView
              spotName={languageHelperSpot}
              initialCategory={languageHelperSpot ? "reservation" : "general"}
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
              onStartDiagnosis={() => { setShowDiagnosis(true); setCurrentScreen("plan"); }}
              onLoginRequest={() => setShowAuth(true)}
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
