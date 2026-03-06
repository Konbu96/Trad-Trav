"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import BottomNavigation from "./components/BottomNavigation";
import SplashScreen from "./components/SplashScreen";
import AIChatView from "./components/AIChatView";
import DiagnosisView, { type DiagnosisResult } from "./components/DiagnosisView";
import MyPageView from "./components/MyPageView";
import AuthView from "./components/AuthView";
import { LanguageProvider } from "./i18n/LanguageContext";
import { saveDiagnosisResult, getDiagnosisResult, getViewHistory, addViewHistory, getFavorites, toggleFavorite, type ViewHistoryItem, auth } from "./lib/firebase";
import { getRecommendedSpotIds } from "./data/spots";
import { signOut } from "firebase/auth";

// 画面の種類
export type ScreenType = "map" | "mypage" | "reservations" | "traffic" | "posts" | "chat";

// ユーザー情報
export interface User {
  id: string;
  name: string;
  email: string;
}

// Leafletはクライアントサイドのみで動作するため、dynamic importを使用
const MapView = dynamic(() => import("./components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600 text-sm">マップを読み込み中...</span>
      </div>
    </div>
  ),
});

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

  // 診断結果からおすすめスポットIDを計算
  const recommendedSpotIds = diagnosisResult
    ? getRecommendedSpotIds(diagnosisResult.interests)
    : null;

  const handleSplashFinish = () => {
    setShowSplash(false);
    setShowDiagnosis(true);
  };

  const handleLogin = async (loggedInUser: User, isNewUser: boolean = false) => {
    setUser(loggedInUser);
    setShowAuth(false);
    
    if (isNewUser) {
      // 新規登録の場合は診断を表示
      setShowDiagnosis(true);
    } else {
      // 既存ユーザーの場合はFirestoreから診断結果と閲覧履歴を取得
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
    
    // ログイン済みの場合はFirestoreに保存
    if (user?.id) {
      try {
        await saveDiagnosisResult(user.id, result);
        console.log("診断結果を保存しました");
      } catch (error) {
        console.error("診断結果の保存に失敗:", error);
      }
    }
  };

  const handleScreenChange = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

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
      // 認証画面へは戻らず、そのままアプリ内に留まる
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

      {/* メインコンテンツ（スプラッシュ・診断が終わったら表示） */}
      {!showSplash && !showDiagnosis && (
        <>
          {currentScreen === "map" && <MapView onSpotView={handleSpotView} jumpToSpotId={jumpToSpotId} onJumpComplete={() => setJumpToSpotId(null)} favoriteSpotIds={favoriteSpotIds} onToggleFavorite={handleToggleFavorite} recommendedSpotIds={recommendedSpotIds} />}
          {currentScreen === "chat" && <AIChatView onJumpToSpot={handleJumpToSpot} />}
          {currentScreen === "mypage" && <MyPageView diagnosisResult={diagnosisResult} user={user} viewHistory={viewHistory} onLogout={handleLogout} onJumpToSpot={handleJumpToSpot} onStartDiagnosis={() => { setShowDiagnosis(true); setCurrentScreen("map"); }} onLoginRequest={() => setShowAuth(true)} />}
          
          {/* 準備中の画面 */}
          {(currentScreen === "reservations" || currentScreen === "traffic" || currentScreen === "posts") && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <p className="text-gray-400 text-lg">準備中...</p>
              </div>
            </div>
          )}
          
          {/* 下部のナビゲーション */}
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
