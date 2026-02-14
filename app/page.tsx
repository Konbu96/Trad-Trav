"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import BottomNavigation from "./components/BottomNavigation";
import SplashScreen from "./components/SplashScreen";
import AIChatView from "./components/AIChatView";

// 画面の種類
export type ScreenType = "map" | "mypage" | "reservations" | "traffic" | "posts" | "chat";

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

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("map");

  const handleScreenChange = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* スプラッシュ画面 */}
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* メインコンテンツ */}
      {currentScreen === "map" && <MapView />}
      {currentScreen === "chat" && <AIChatView />}
      
      {/* 準備中の画面 */}
      {(currentScreen === "mypage" || currentScreen === "reservations" || currentScreen === "traffic" || currentScreen === "posts") && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-400 text-lg">準備中...</p>
          </div>
        </div>
      )}
      
      {/* 下部のナビゲーション */}
      <BottomNavigation currentScreen={currentScreen} onScreenChange={handleScreenChange} />
    </div>
  );
}
