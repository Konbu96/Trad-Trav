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
    id: "map",
    labelKey: "map",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
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
    id: "plan",
    labelKey: "plan",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
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
