"use client";

import type { ScreenType } from "../page";
import { useLanguage } from "../i18n/LanguageContext";

interface NavItem {
  id: ScreenType;
  labelKey: "plan" | "map" | "chat" | "mypage";
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "plan",
    labelKey: "plan",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
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
    id: "chat",
    labelKey: "chat",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
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
        style={{ boxShadow: "0 -2px 12px rgba(0, 0, 0, 0.08)" }}
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
