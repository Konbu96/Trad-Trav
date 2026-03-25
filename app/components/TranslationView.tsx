"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "../i18n/LanguageContext";

const LANGUAGES = [
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

interface QuickPhrase {
  ja: string;
  en: string;
  zh: string;
  ko: string;
}

const QUICK_PHRASES: QuickPhrase[] = [
  { ja: "これはいくらですか？", en: "How much is this?", zh: "这个多少钱？", ko: "이것은 얼마예요?" },
  { ja: "トイレはどこですか？", en: "Where is the restroom?", zh: "洗手间在哪里？", ko: "화장실이 어디예요?" },
  { ja: "助けてください", en: "Please help me", zh: "请帮帮我", ko: "도와주세요" },
  { ja: "英語を話せますか？", en: "Do you speak English?", zh: "你会说英语吗？", ko: "영어 할 줄 아세요?" },
  { ja: "メニューを見せてください", en: "Please show me the menu", zh: "请给我看菜单", ko: "메뉴 보여주세요" },
  { ja: "写真を撮ってもいいですか？", en: "May I take a photo?", zh: "可以拍照吗？", ko: "사진 찍어도 될까요?" },
  { ja: "駅はどこですか？", en: "Where is the station?", zh: "车站在哪里？", ko: "역이 어디예요?" },
  { ja: "〇〇までお願いします", en: "Please take me to 〇〇", zh: "请带我去〇〇", ko: "〇〇까지 가주세요" },
];

const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
  if (!text.trim()) return "";
  if (sourceLang === targetLang) return text;

  const langpair = `${sourceLang}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Translation API error");

  const data = await response.json();
  if (data.responseStatus !== 200) throw new Error(data.responseDetails || "Translation failed");

  return data.responseData.translatedText;
};

export default function TranslationView() {
  const { t } = useLanguage();
  const [sourceLang, setSourceLang] = useState("ja");
  const [targetLang, setTargetLang] = useState("en");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);

  const sourceLangInfo = LANGUAGES.find(l => l.code === sourceLang)!;
  const targetLangInfo = LANGUAGES.find(l => l.code === targetLang)!;

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim() || isLoading) return;
    setIsLoading(true);
    setError("");
    setTranslatedText("");
    try {
      const result = await translateText(sourceText, sourceLang, targetLang);
      setTranslatedText(result);
    } catch {
      setError(t.translation.errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, sourceLang, targetLang, isLoading, t.translation.errorMessage]);

  const handleSwapLanguages = () => {
    const prevSource = sourceLang;
    const prevTarget = targetLang;
    const prevSourceText = sourceText;
    const prevTranslated = translatedText;
    setSourceLang(prevTarget);
    setTargetLang(prevSource);
    setSourceText(prevTranslated);
    setTranslatedText(prevSourceText);
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickPhrase = (phrase: QuickPhrase) => {
    const key = sourceLang as keyof QuickPhrase;
    const text = phrase[key] ?? phrase.ja;
    setSourceText(text);
    setTranslatedText("");
    setError("");
  };

  const handleSelectSourceLang = (code: string) => {
    if (code === targetLang) setTargetLang(sourceLang);
    setSourceLang(code);
    setTranslatedText("");
    setShowSourcePicker(false);
  };

  const handleSelectTargetLang = (code: string) => {
    if (code === sourceLang) setSourceLang(targetLang);
    setTargetLang(code);
    setTranslatedText("");
    setShowTargetPicker(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f8fafc",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 20px",
          paddingTop: "48px",
        }}
      >
        <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937", textAlign: "center" }}>
          {t.translation.title}
        </h1>
        <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "4px" }}>
          {t.translation.subtitle}
        </p>
      </div>

      {/* スクロール可能なコンテンツ */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: "120px" }}>

        {/* 言語選択バー */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            marginBottom: "12px",
            position: "relative",
          }}
        >
          {/* ソース言語 */}
          <button
            onClick={() => { setShowSourcePicker(!showSourcePicker); setShowTargetPicker(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 10px", borderRadius: "10px",
              backgroundColor: "#eff6ff",
              fontSize: "14px", fontWeight: "600", color: "#1d4ed8",
              flex: 1, justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "20px" }}>{sourceLangInfo.flag}</span>
            <span>{sourceLangInfo.label}</span>
            <span style={{ fontSize: "10px", color: "#6b7280" }}>▼</span>
          </button>

          {/* スワップボタン */}
          <button
            onClick={handleSwapLanguages}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              border: "1px solid #e5e7eb", background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", margin: "0 8px", flexShrink: 0,
              color: "#6b7280", fontSize: "16px",
            }}
          >
            ⇄
          </button>

          {/* ターゲット言語 */}
          <button
            onClick={() => { setShowTargetPicker(!showTargetPicker); setShowSourcePicker(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 10px", borderRadius: "10px",
              backgroundColor: "#f0fdf4",
              fontSize: "14px", fontWeight: "600", color: "#15803d",
              flex: 1, justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "20px" }}>{targetLangInfo.flag}</span>
            <span>{targetLangInfo.label}</span>
            <span style={{ fontSize: "10px", color: "#6b7280" }}>▼</span>
          </button>

          {/* ソース言語ピッカー */}
          {showSourcePicker && (
            <div
              style={{
                position: "absolute", top: "60px", left: "0", zIndex: 100,
                backgroundColor: "white", borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                padding: "8px", minWidth: "160px",
              }}
            >
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectSourceLang(lang.code)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    width: "100%", padding: "10px 12px", border: "none",
                    background: lang.code === sourceLang ? "#eff6ff" : "transparent",
                    borderRadius: "8px", cursor: "pointer",
                    fontSize: "14px", color: "#1f2937", fontWeight: lang.code === sourceLang ? "600" : "400",
                    textAlign: "left",
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ターゲット言語ピッカー */}
          {showTargetPicker && (
            <div
              style={{
                position: "absolute", top: "60px", right: "0", zIndex: 100,
                backgroundColor: "white", borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                padding: "8px", minWidth: "160px",
              }}
            >
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleSelectTargetLang(lang.code)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    width: "100%", padding: "10px 12px", border: "none",
                    background: lang.code === targetLang ? "#f0fdf4" : "transparent",
                    borderRadius: "8px", cursor: "pointer",
                    fontSize: "14px", color: "#1f2937", fontWeight: lang.code === targetLang ? "600" : "400",
                    textAlign: "left",
                  }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 入力エリア */}
        <div
          style={{
            backgroundColor: "white", borderRadius: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            marginBottom: "12px", overflow: "hidden",
          }}
        >
          <div style={{ padding: "4px 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
              {sourceLangInfo.flag} {sourceLangInfo.label}
            </span>
          </div>
          <textarea
            value={sourceText}
            onChange={e => { setSourceText(e.target.value); setTranslatedText(""); setError(""); }}
            placeholder={t.translation.inputPlaceholder}
            rows={4}
            style={{
              width: "100%", border: "none", outline: "none",
              padding: "8px 16px 12px",
              fontSize: "16px", color: "#1f2937",
              resize: "none", lineHeight: "1.6",
              backgroundColor: "transparent", boxSizing: "border-box",
            }}
          />
          <div
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 16px", borderTop: "1px solid #f3f4f6",
            }}
          >
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>
              {sourceText.length} {t.translation.characters}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {sourceText && (
                <button
                  onClick={() => { setSourceText(""); setTranslatedText(""); setError(""); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "13px", color: "#9ca3af", padding: "4px 8px",
                  }}
                >
                  {t.translation.clear}
                </button>
              )}
              <button
                onClick={handleTranslate}
                disabled={!sourceText.trim() || isLoading}
                style={{
                  backgroundColor: sourceText.trim() && !isLoading ? "#3b82f6" : "#d1d5db",
                  color: "white", border: "none", borderRadius: "20px",
                  padding: "6px 18px", fontSize: "14px", fontWeight: "600",
                  cursor: sourceText.trim() && !isLoading ? "pointer" : "default",
                  transition: "background-color 0.2s",
                }}
              >
                {isLoading ? t.translation.translating : t.translation.translateButton}
              </button>
            </div>
          </div>
        </div>

        {/* 翻訳結果エリア */}
        {(translatedText || isLoading || error) && (
          <div
            style={{
              backgroundColor: "white", borderRadius: "16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              marginBottom: "16px", overflow: "hidden",
              borderLeft: "3px solid #3b82f6",
            }}
          >
            <div style={{ padding: "4px 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                {targetLangInfo.flag} {targetLangInfo.label}
              </span>
            </div>
            <div style={{ padding: "8px 16px 12px" }}>
              {isLoading ? (
                <div style={{ display: "flex", gap: "4px", padding: "8px 0" }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div
                      key={i}
                      style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        backgroundColor: "#93c5fd",
                        animation: `bounce 1s infinite ${delay}s`,
                      }}
                    />
                  ))}
                </div>
              ) : error ? (
                <p style={{ fontSize: "14px", color: "#ef4444", padding: "4px 0" }}>{error}</p>
              ) : (
                <p style={{ fontSize: "16px", color: "#1f2937", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {translatedText}
                </p>
              )}
            </div>
            {translatedText && !isLoading && !error && (
              <div
                style={{
                  display: "flex", justifyContent: "flex-end",
                  padding: "8px 16px", borderTop: "1px solid #f3f4f6",
                }}
              >
                <button
                  onClick={handleCopy}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: "none", border: "1px solid #e5e7eb",
                    borderRadius: "20px", padding: "5px 14px",
                    fontSize: "13px", color: copied ? "#15803d" : "#6b7280",
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  {copied ? "✓ " + t.translation.copied : "📋 " + t.translation.copy}
                </button>
              </div>
            )}
          </div>
        )}

        {/* クイックフレーズ */}
        <div>
          <h2
            style={{
              fontSize: "13px", fontWeight: "600", color: "#6b7280",
              marginBottom: "10px", letterSpacing: "0.05em", textTransform: "uppercase",
            }}
          >
            {t.translation.quickPhrases}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {QUICK_PHRASES.map((phrase, i) => {
              const sourceKey = sourceLang as keyof QuickPhrase;
              const targetKey = targetLang as keyof QuickPhrase;
              const displaySource = phrase[sourceKey] ?? phrase.ja;
              const displayTarget = phrase[targetKey] ?? phrase.en;
              return (
                <button
                  key={i}
                  onClick={() => handleQuickPhrase(phrase)}
                  style={{
                    backgroundColor: "white", borderRadius: "12px",
                    padding: "12px 14px", cursor: "pointer",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    textAlign: "left", width: "100%",
                    display: "flex", flexDirection: "column", gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                    {displaySource}
                  </span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>
                    {displayTarget}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
