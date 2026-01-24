"use client";

import dynamic from "next/dynamic";
import SearchBar from "./components/SearchBar";
import BottomNavigation from "./components/BottomNavigation";

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
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* マップ（全画面） */}
      <MapView />
      
      {/* 上部の検索バー */}
      <SearchBar />
      
      {/* 下部のナビゲーション */}
      <BottomNavigation />
    </div>
  );
}
