"use client";

import type { ScreenType } from "../page";
import { useLanguage } from "../i18n/LanguageContext";

interface NavItem {
  id: ScreenType;
  labelKey: "mypage" | "reservations" | "map" | "posts" | "chat";
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "mypage",
    labelKey: "mypage",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "reservations",
    labelKey: "reservations",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "map",
    labelKey: "map",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    id: "posts",
    labelKey: "posts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    id: "chat",
    labelKey: "chat",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="12" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

interface BottomNavigationProps {
  currentScreen: ScreenType;
  onScreenChange: (screen: ScreenType) => void;
}

export default function BottomNavigation({ currentScreen, onScreenChange }: BottomNavigationProps) {
  const { t } = useLanguage();

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <nav 
        className="bg-white border-t border-gray-200"
        style={{
          boxShadow: "0 -2px 12px rgba(0, 0, 0, 0.08)",
        }}
      >
        <ul className="flex justify-around items-center" style={{ paddingTop: "10px", paddingBottom: "12px" }}>
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <li key={item.id} className="flex-1">
                <button
                  onClick={() => onScreenChange(item.id)}
                  className={`w-full flex flex-col items-center gap-1 py-2 transition-colors ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  <span className={isActive ? "text-blue-600" : "text-gray-500"}>
                    {item.icon}
                  </span>
                  <span className={`text-xs font-medium ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                    {t.nav[item.labelKey]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
