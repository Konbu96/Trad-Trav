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

interface Phrase {
  ja: string;
  en: string;
  zh: string;
  ko: string;
  fr?: string;
  de?: string;
  es?: string;
}

interface PhraseCategoryData {
  id: string;
  label: string;
  emoji: string;
  phrases: Phrase[];
}

const PHRASE_CATEGORIES: PhraseCategoryData[] = [
  {
    id: "general",
    label: "一般",
    emoji: "💬",
    phrases: [
      { ja: "これはいくらですか？", en: "How much is this?", zh: "这个多少钱？", ko: "이것은 얼마예요?" },
      { ja: "トイレはどこですか？", en: "Where is the restroom?", zh: "洗手间在哪里？", ko: "화장실이 어디예요?" },
      { ja: "助けてください", en: "Please help me", zh: "请帮帮我", ko: "도와주세요" },
      { ja: "英語を話せますか？", en: "Do you speak English?", zh: "你会说英语吗？", ko: "영어 할 줄 아세요?" },
      { ja: "写真を撮ってもいいですか？", en: "May I take a photo?", zh: "可以拍照吗？", ko: "사진 찍어도 될까요?" },
      { ja: "駅はどこですか？", en: "Where is the station?", zh: "车站在哪里？", ko: "역이 어디예요?" },
      { ja: "〇〇までお願いします", en: "Please take me to 〇〇", zh: "请带我去〇〇", ko: "〇〇까지 가주세요" },
      { ja: "ゆっくり話してください", en: "Please speak slowly", zh: "请说慢一点", ko: "천천히 말씀해 주세요" },
    ],
  },
  {
    id: "festival",
    label: "祭り・芸能",
    emoji: "🎭",
    phrases: [
      { ja: "跳ね人として参加したいのですが", en: "I'd like to join as a dancer", zh: "我想作为舞者参加", ko: "무용수로 참가하고 싶습니다" },
      { ja: "衣装はどこで借りられますか？", en: "Where can I rent a costume?", zh: "在哪里可以租借服装？", ko: "의상은 어디서 빌릴 수 있나요?" },
      { ja: "踊りの輪に入ってもいいですか？", en: "May I join the dance circle?", zh: "我可以加入舞蹈吗？", ko: "춤 무리에 들어가도 될까요?" },
      { ja: "この祭りは何時に始まりますか？", en: "What time does this festival start?", zh: "这个祭典什么时候开始？", ko: "이 축제는 몇 시에 시작하나요?" },
      { ja: "一緒に踊ってもいいですか？", en: "May I dance with you?", zh: "我可以和你一起跳舞吗？", ko: "같이 춤춰도 될까요?" },
      { ja: "この踊りの意味を教えてください", en: "Please tell me the meaning of this dance", zh: "请告诉我这个舞蹈的含义", ko: "이 춤의 의미를 알려주세요" },
      { ja: "観客として見ていいですか？", en: "Can I watch as an audience?", zh: "我可以作为观众观看吗？", ko: "관객으로 봐도 될까요?" },
    ],
  },
  {
    id: "craft",
    label: "工芸体験",
    emoji: "🏺",
    phrases: [
      { ja: "体験を申し込みたいのですが", en: "I'd like to sign up for a workshop", zh: "我想报名参加体验活动", ko: "체험을 신청하고 싶습니다" },
      { ja: "道具の使い方を教えてください", en: "Please show me how to use this tool", zh: "请告诉我这个工具的使用方法", ko: "도구 사용법을 알려주세요" },
      { ja: "作品は持ち帰れますか？", en: "Can I take the piece home?", zh: "作品可以带回家吗？", ko: "작품을 가져갈 수 있나요?" },
      { ja: "何分くらいかかりますか？", en: "How long will it take?", zh: "大概需要多长时间？", ko: "얼마나 걸리나요?" },
      { ja: "子供でも参加できますか？", en: "Can children participate?", zh: "孩子也可以参加吗？", ko: "아이도 참가할 수 있나요?" },
      { ja: "これは何という技法ですか？", en: "What technique is this?", zh: "这叫什么技法？", ko: "이것은 어떤 기법인가요?" },
      { ja: "事前予約は必要ですか？", en: "Is advance reservation required?", zh: "需要提前预约吗？", ko: "사전 예약이 필요한가요?" },
    ],
  },
  {
    id: "reservation",
    label: "予約・問い合わせ",
    emoji: "📞",
    phrases: [
      { ja: "予約を取りたいのですが", en: "I'd like to make a reservation", zh: "我想预约", ko: "예약하고 싶습니다" },
      { ja: "〇名で参加したいのですが", en: "We'd like to participate as a group of 〇", zh: "我们〇人想参加", ko: "〇명으로 참가하고 싶습니다" },
      { ja: "〇月〇日は空いていますか？", en: "Is 〇/〇 available?", zh: "〇月〇日有空吗？", ko: "〇월 〇일은 비어 있나요?" },
      { ja: "料金を教えてください", en: "Please tell me the price", zh: "请告诉我价格", ko: "요금을 알려주세요" },
      { ja: "キャンセルはできますか？", en: "Can I cancel the reservation?", zh: "可以取消预约吗？", ko: "예약 취소가 가능한가요?" },
      { ja: "英語対応は可能ですか？", en: "Do you offer English support?", zh: "有英语服务吗？", ko: "영어 대응이 가능한가요?" },
      { ja: "確認のため連絡先を教えてください", en: "Please share your contact information for confirmation", zh: "请告诉我联系方式以便确认", ko: "확인을 위해 연락처를 알려주세요" },
    ],
  },
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

interface TranslationViewProps {
  spotName?: string | null;
  initialCategory?: string;
}

export default function TranslationView({ spotName, initialCategory }: TranslationViewProps) {
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
  const [activeCategory, setActiveCategory] = useState(initialCategory || (spotName ? "reservation" : "general"));

  const sourceLangInfo = LANGUAGES.find(l => l.code === sourceLang)!;
  const targetLangInfo = LANGUAGES.find(l => l.code === targetLang)!;
  const activeCategoryData = PHRASE_CATEGORIES.find(c => c.id === activeCategory)!;

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

  const handleQuickPhrase = (phrase: Phrase) => {
    const key = sourceLang as keyof Phrase;
    const text = (phrase[key] as string) ?? phrase.ja;
    setSourceText(text);
    setTranslatedText("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      {/* ヘッダー */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 20px", paddingTop: "48px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937", textAlign: "center" }}>
          {t.translation.title}
        </h1>
        <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "4px" }}>
          {t.translation.subtitle}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "120px" }}>

        {/* スポットコンテキストバナー */}
        {spotName && (
          <div style={{
            margin: "12px 16px 0",
            backgroundColor: "#eff6ff",
            borderRadius: "12px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid #bfdbfe",
          }}>
            <span style={{ fontSize: "18px" }}>📍</span>
            <div>
              <p style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "600", marginBottom: "1px" }}>スポット連携中</p>
              <p style={{ fontSize: "13px", color: "#1e40af", fontWeight: "500" }}>{spotName}</p>
            </div>
          </div>
        )}

        {/* 言語選択バー */}
        <div style={{
          backgroundColor: "white", borderRadius: "16px", padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)", margin: "12px 16px 0", position: "relative",
        }}>
          <button
            onClick={() => { setShowSourcePicker(!showSourcePicker); setShowTargetPicker(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none",
              cursor: "pointer", padding: "6px 10px", borderRadius: "10px", backgroundColor: "#eff6ff",
              fontSize: "14px", fontWeight: "600", color: "#1d4ed8", flex: 1, justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "20px" }}>{sourceLangInfo.flag}</span>
            <span>{sourceLangInfo.label}</span>
            <span style={{ fontSize: "10px", color: "#6b7280" }}>▼</span>
          </button>

          <button
            onClick={handleSwapLanguages}
            style={{
              width: "36px", height: "36px", borderRadius: "50%", border: "1px solid #e5e7eb",
              background: "white", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", margin: "0 8px", flexShrink: 0, color: "#6b7280", fontSize: "16px",
            }}
          >
            ⇄
          </button>

          <button
            onClick={() => { setShowTargetPicker(!showTargetPicker); setShowSourcePicker(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none",
              cursor: "pointer", padding: "6px 10px", borderRadius: "10px", backgroundColor: "#f0fdf4",
              fontSize: "14px", fontWeight: "600", color: "#15803d", flex: 1, justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "20px" }}>{targetLangInfo.flag}</span>
            <span>{targetLangInfo.label}</span>
            <span style={{ fontSize: "10px", color: "#6b7280" }}>▼</span>
          </button>

          {showSourcePicker && (
            <div style={{
              position: "absolute", top: "60px", left: "0", zIndex: 100, backgroundColor: "white",
              borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", padding: "8px", minWidth: "160px",
            }}>
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => handleSelectSourceLang(lang.code)} style={{
                  display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px",
                  border: "none", background: lang.code === sourceLang ? "#eff6ff" : "transparent",
                  borderRadius: "8px", cursor: "pointer", fontSize: "14px", color: "#1f2937",
                  fontWeight: lang.code === sourceLang ? "600" : "400", textAlign: "left",
                }}>
                  <span>{lang.flag}</span><span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}

          {showTargetPicker && (
            <div style={{
              position: "absolute", top: "60px", right: "0", zIndex: 100, backgroundColor: "white",
              borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", padding: "8px", minWidth: "160px",
            }}>
              {LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => handleSelectTargetLang(lang.code)} style={{
                  display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "10px 12px",
                  border: "none", background: lang.code === targetLang ? "#f0fdf4" : "transparent",
                  borderRadius: "8px", cursor: "pointer", fontSize: "14px", color: "#1f2937",
                  fontWeight: lang.code === targetLang ? "600" : "400", textAlign: "left",
                }}>
                  <span>{lang.flag}</span><span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 入力エリア */}
        <div style={{
          backgroundColor: "white", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          margin: "12px 16px 0", overflow: "hidden",
        }}>
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
              width: "100%", border: "none", outline: "none", padding: "8px 16px 12px",
              fontSize: "16px", color: "#1f2937", resize: "none", lineHeight: "1.6",
              backgroundColor: "transparent", boxSizing: "border-box",
            }}
          />
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 16px", borderTop: "1px solid #f3f4f6",
          }}>
            <span style={{ fontSize: "12px", color: "#9ca3af" }}>
              {sourceText.length} {t.translation.characters}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {sourceText && (
                <button onClick={() => { setSourceText(""); setTranslatedText(""); setError(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#9ca3af", padding: "4px 8px" }}>
                  {t.translation.clear}
                </button>
              )}
              <button
                onClick={handleTranslate}
                disabled={!sourceText.trim() || isLoading}
                style={{
                  backgroundColor: sourceText.trim() && !isLoading ? "#3b82f6" : "#d1d5db",
                  color: "white", border: "none", borderRadius: "20px", padding: "6px 18px",
                  fontSize: "14px", fontWeight: "600",
                  cursor: sourceText.trim() && !isLoading ? "pointer" : "default",
                  transition: "background-color 0.2s",
                }}
              >
                {isLoading ? t.translation.translating : t.translation.translateButton}
              </button>
            </div>
          </div>
        </div>

        {/* 翻訳結果 */}
        {(translatedText || isLoading || error) && (
          <div style={{
            backgroundColor: "white", borderRadius: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            margin: "12px 16px 0", overflow: "hidden", borderLeft: "3px solid #3b82f6",
          }}>
            <div style={{ padding: "4px 12px 0" }}>
              <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>
                {targetLangInfo.flag} {targetLangInfo.label}
              </span>
            </div>
            <div style={{ padding: "8px 16px 12px" }}>
              {isLoading ? (
                <div style={{ display: "flex", gap: "4px", padding: "8px 0" }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div key={i} style={{
                      width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#93c5fd",
                      animation: `bounce 1s infinite ${delay}s`,
                    }} />
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
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px", borderTop: "1px solid #f3f4f6" }}>
                <button onClick={handleCopy} style={{
                  display: "flex", alignItems: "center", gap: "6px", background: "none",
                  border: "1px solid #e5e7eb", borderRadius: "20px", padding: "5px 14px",
                  fontSize: "13px", color: copied ? "#15803d" : "#6b7280", cursor: "pointer",
                }}>
                  {copied ? "✓ " + t.translation.copied : "📋 " + t.translation.copy}
                </button>
              </div>
            )}
          </div>
        )}

        {/* フレーズカテゴリタブ */}
        <div style={{ margin: "20px 16px 0" }}>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", marginBottom: "10px", letterSpacing: "0.05em" }}>
            {t.translation.quickPhrases}
          </p>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {PHRASE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap",
                  padding: "6px 12px", borderRadius: "20px", border: "none", cursor: "pointer",
                  fontSize: "13px", fontWeight: "500",
                  backgroundColor: activeCategory === cat.id ? "#3b82f6" : "#e5e7eb",
                  color: activeCategory === cat.id ? "white" : "#374151",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* フレーズ一覧 */}
        <div style={{ margin: "10px 16px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
          {activeCategoryData.phrases.map((phrase, i) => {
            const sourceKey = sourceLang as keyof Phrase;
            const targetKey = targetLang as keyof Phrase;
            const displaySource = (phrase[sourceKey] as string) ?? phrase.ja;
            const displayTarget = (phrase[targetKey] as string) ?? phrase.en;
            return (
              <button key={i} onClick={() => handleQuickPhrase(phrase)} style={{
                backgroundColor: "white", borderRadius: "12px", padding: "12px 14px", cursor: "pointer",
                border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                textAlign: "left", width: "100%", display: "flex", flexDirection: "column", gap: "4px",
              }}>
                <span style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>{displaySource}</span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>{displayTarget}</span>
              </button>
            );
          })}
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
