"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { readPostSplashLanguageSeen } from "../lib/firstLaunchFlow";
import { translations, type Language, type Translations } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ja");

  // スプラッシュ後の言語選択を一度済ませるまで、保存済み言語は適用しない（最初に明示選択させる）
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!readPostSplashLanguageSeen()) return;
    } catch {
      return;
    }
    const saved = localStorage.getItem("language") as Language;
    if (saved && (saved === "ja" || saved === "en" || saved === "zh" || saved === "ko")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

