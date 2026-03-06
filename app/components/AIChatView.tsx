"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { recommendedSpots, type Spot } from "../data/spots";

interface SuggestedSpot {
  id: number;
  name: string;
  category: string;
  description: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestedSpots?: SuggestedSpot[];
}

interface AIChatViewProps {
  onJumpToSpot?: (spotId: number) => void;
}

// スポットのカテゴリとキーワードのマッピング
const SPOT_KEYWORDS: Record<number, string[]> = {
  1: ["歴史", "城", "桜", "夜景", "函館", "観光", "文化", "星形", "タワー", "公園"],
  2: ["時計台", "札幌", "歴史", "観光", "文化", "シンボル", "写真", "レトロ"],
  3: ["温泉", "阿寒", "釧路", "道東", "温泉地", "癒し", "のんびり", "体験", "湖"],
  4: ["グルメ", "ビール", "ジンギスカン", "食事", "飲み", "肉", "レストラン", "夜", "飲食"],
  5: ["歴史", "赤レンガ", "観光", "無料", "庁舎", "文化", "レトロ", "写真", "札幌"],
  6: ["アイヌ", "文化", "体験", "歴史", "民族", "学ぶ", "展示", "札幌", "伝統"],
  7: ["アイヌ", "ウポポイ", "白老", "民族", "文化体験", "国立", "伝統", "コタン"],
  8: ["アイヌ", "二風谷", "平取", "工芸", "民具", "体験", "伝統", "民族"],
  9: ["開拓", "歴史", "明治", "体験", "札幌", "村", "建物", "農村"],
  10: ["城", "松前", "桜", "歴史", "函館", "武士", "江戸", "観光"],
  11: ["函館", "洋館", "衣装", "体験", "歴史", "写真", "明治", "重要文化財"],
  12: ["函館", "教会", "歴史", "観光", "レトロ", "写真", "鐘", "正教会"],
  13: ["神社", "神宮", "札幌", "パワースポット", "祭り", "お参り", "自然", "癒し"],
  14: ["江戸", "忍者", "武士", "体験", "テーマパーク", "登別", "ショー", "衣装"],
  15: ["小樽", "芸術", "美術館", "ステンドグラス", "体験", "レトロ", "建物", "アート"],
  16: ["博物館", "歴史", "アイヌ", "開拓", "札幌", "自然", "学ぶ", "展示"],
  17: ["網走", "監獄", "歴史", "開拓", "体験", "道東", "野外", "明治"],
  18: ["歴史", "洋館", "札幌", "明治", "観光", "重要文化財", "公園", "レトロ"],
  19: ["函館", "領事館", "歴史", "体験", "カフェ", "洋館", "開港", "文化"],
  20: ["旭川", "博物館", "アイヌ", "歴史", "文化", "展示", "学ぶ", "道北"],
  21: ["松前", "江戸", "武家屋敷", "体験", "歴史", "復元", "函館", "伝統"],
  22: ["小樽", "博物館", "鉄道", "歴史", "体験", "蒸気機関車", "海運", "開拓"],
  23: ["帯広", "十勝", "博物館", "歴史", "文化", "道東", "自然", "開拓"],
  24: ["アイヌ", "シアター", "舞踊", "阿寒", "公演", "体験", "文化", "釧路"],
  25: ["美術館", "札幌", "アート", "アイヌ", "工芸", "展示", "文化", "近代"],
  26: ["寺", "伊達", "歴史", "パワースポット", "最古", "道南", "仏教", "文化財"],
};

const CATEGORY_EMOJIS: Record<string, string> = {
  観光: "🏛️",
  グルメ: "🍽️",
  レジャー: "🎡",
  自然: "🌿",
  温泉: "♨️",
  体験: "🎭",
};

// ユーザーメッセージからスポットをマッチング
const matchSpots = (userMessage: string): SuggestedSpot[] => {
  const msg = userMessage;
  const scores: Record<number, number> = {};

  recommendedSpots.forEach(spot => {
    let score = 0;
    const keywords = SPOT_KEYWORDS[spot.id] || [];
    keywords.forEach(kw => {
      if (msg.includes(kw)) score += 2;
    });
    if (msg.includes(spot.name)) score += 5;
    if (msg.includes(spot.category)) score += 3;
    if (msg.includes(spot.description.slice(0, 10))) score += 2;
    scores[spot.id] = score;
  });

  return recommendedSpots
    .filter(spot => scores[spot.id] > 0)
    .sort((a, b) => scores[b.id] - scores[a.id])
    .slice(0, 3)
    .map(spot => ({
      id: spot.id,
      name: spot.name,
      category: spot.category,
      description: spot.description.slice(0, 40) + "...",
    }));
};

// スポット提案が必要かどうかを判定するキーワード
const SUGGESTION_TRIGGERS = [
  "行きたい", "おすすめ", "どこ", "場所", "スポット", "観光", "行こう",
  "連れて行って", "教えて", "紹介", "提案", "どこか", "行ける",
  "want to go", "recommend", "suggest", "where", "place",
];

const shouldSuggestSpots = (msg: string): boolean => {
  return SUGGESTION_TRIGGERS.some(trigger => msg.includes(trigger));
};

const getAIResponse = async (userMessage: string): Promise<{ content: string; spots?: SuggestedSpot[] }> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const msg = userMessage;

  // スポット提案が必要かチェック
  const matchedSpots = matchSpots(msg);
  if (shouldSuggestSpots(msg) || matchedSpots.length > 0) {
    const spots = matchedSpots.length > 0 ? matchedSpots : recommendedSpots.slice(0, 3).map(s => ({
      id: s.id, name: s.name, category: s.category,
      description: s.description.slice(0, 40) + "...",
    }));
    const intro = matchedSpots.length > 0
      ? `ご希望に合いそうなスポットを見つけました！マップで場所を確認してみてください🗺️`
      : `北海道のおすすめスポットをご紹介します！マップで場所を確認してみてください🗺️`;
    return { content: intro, spots };
  }

  // 挨拶
  if (msg.includes("こんにちは") || msg.includes("hello") || msg.includes("hi") || msg.includes("はじめ")) {
    return { content: "こんにちは！北海道旅行のお手伝いをしますね🌸\n「歴史のある場所に行きたい」「グルメを楽しみたい」など、気軽に話しかけてください！" };
  }
  if (msg.includes("おはよう")) {
    return { content: "おはようございます！今日も北海道旅行のお手伝いをしますね☀️ どんな旅をお探しですか？" };
  }
  if (msg.includes("こんばんは")) {
    return { content: "こんばんは！夜の北海道も素敵ですよ🌙 何かお探しですか？" };
  }
  if (msg.includes("ありがとう") || msg.includes("thank")) {
    return { content: "どういたしまして！他にも聞きたいことがあればいつでもどうぞ😊" };
  }

  // 天気・季節
  if (msg.includes("天気") || msg.includes("気温") || msg.includes("服装") || msg.includes("季節")) {
    return { content: "北海道の気候についてですね！\n\n❄️ 冬（12-2月）：-10〜0℃ → 防寒必須\n🌸 春（3-5月）：0〜15℃ → 重ね着がおすすめ\n☀️ 夏（6-8月）：15〜25℃ → 涼しくて快適\n🍂 秋（9-11月）：5〜20℃ → 紅葉が綺麗\n\nいつ頃の旅行ですか？" };
  }

  // アクセス
  if (msg.includes("アクセス") || msg.includes("行き方") || msg.includes("交通") || msg.includes("空港")) {
    return { content: "北海道へのアクセスですね！✈️\n\n🛫 新千歳空港：札幌へのメイン空港\n🛫 函館空港：函館エリアへ\n🚄 北海道新幹線：函館まで\n\nどのエリアへ行く予定ですか？" };
  }

  // グルメ
  if (msg.includes("グルメ") || msg.includes("食べ") || msg.includes("ご飯") || msg.includes("食事") || msg.includes("ラーメン") || msg.includes("海鮮") || msg.includes("ジンギスカン")) {
    const grourmetSpots = recommendedSpots.filter(s => s.category === "グルメ").map(s => ({
      id: s.id, name: s.name, category: s.category,
      description: s.description.slice(0, 40) + "...",
    }));
    return {
      content: "北海道グルメといえば、ジンギスカン・海鮮・味噌ラーメンが有名です！\nマップでグルメスポットを確認してみてください🍽️",
      spots: grourmetSpots.length > 0 ? grourmetSpots : undefined,
    };
  }

  // デフォルト
  return {
    content: `「${userMessage}」についてですね！\n\nたとえばこんな言葉で話しかけてみてください😊\n・「歴史のある場所に行きたい」\n・「子供と楽しめる場所を教えて」\n・「グルメを楽しみたい」`,
  };
};

export default function AIChatView({ onJumpToSpot }: AIChatViewProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初期メッセージを設定
  useEffect(() => {
    if (!isInitialized) {
      setMessages([
        {
          id: 0,
          role: "assistant",
          content: t.chat.welcome,
          timestamp: new Date(),
        },
      ]);
      setIsInitialized(true);
    }
  }, [t.chat.welcome, isInitialized]);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await getAIResponse(userMessage.content);
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        suggestedSpots: response.spots,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI response error:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "申し訳ありません、エラーが発生しました。もう一度お試しください。",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
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
          paddingTop: "48px", // Safe area
        }}
      >
        <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937", textAlign: "center" }}>
          {t.chat.title}
        </h1>
        <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "4px" }}>
          {t.chat.subtitle}
        </p>
      </div>

      {/* メッセージエリア */}
      <div 
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          paddingBottom: "160px", // 入力欄 + BottomNavigation分の余白
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent: message.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                display: "flex",
                flexDirection: "column",
                alignItems: message.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {/* アバター（AIのみ） */}
              {message.role === "assistant" && (
                <div 
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#ec4899",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>🌸</span>
                </div>
              )}
              
              {/* メッセージバブル */}
              <div
                style={{
                  backgroundColor: message.role === "user" ? "#3b82f6" : "white",
                  color: message.role === "user" ? "white" : "#1f2937",
                  padding: "12px 16px",
                  borderRadius: message.role === "user" 
                    ? "20px 20px 4px 20px" 
                    : "20px 20px 20px 4px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {message.content}
              </div>

              {/* スポット提案カード */}
              {message.suggestedSpots && message.suggestedSpots.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                  {message.suggestedSpots.map(spot => (
                    <button
                      key={spot.id}
                      onClick={() => onJumpToSpot?.(spot.id)}
                      style={{
                        backgroundColor: "white",
                        border: "1px solid #fce7f3",
                        borderRadius: "16px",
                        padding: "12px 14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: "0 1px 4px rgba(236, 72, 153, 0.1)",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "10px",
                          backgroundColor: "#fdf2f8",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "18px", flexShrink: 0,
                        }}>
                          {CATEGORY_EMOJIS[spot.category] || "📍"}
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", marginBottom: "2px" }}>
                            {spot.name}
                          </p>
                          <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                            {spot.description}
                          </p>
                        </div>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: "4px",
                        color: "#ec4899", fontSize: "12px", fontWeight: "500",
                        flexShrink: 0, marginLeft: "8px",
                      }}>
                        <span>地図</span>
                        <span>›</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* 時刻 */}
              <span 
                style={{ 
                  fontSize: "11px", 
                  color: "#9ca3af", 
                  marginTop: "4px",
                  paddingLeft: message.role === "assistant" ? "4px" : "0",
                  paddingRight: message.role === "user" ? "4px" : "0",
                }}
              >
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        
        {/* ローディング表示 */}
        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div 
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#ec4899",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "16px" }}>🌸</span>
              </div>
              <div 
                style={{
                  backgroundColor: "white",
                  padding: "12px 16px",
                  borderRadius: "20px 20px 20px 4px",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div style={{ display: "flex", gap: "4px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#d1d5db", animation: "bounce 1s infinite" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#d1d5db", animation: "bounce 1s infinite 0.2s" }} />
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#d1d5db", animation: "bounce 1s infinite 0.4s" }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div 
        style={{
          position: "absolute",
          bottom: "100px", // BottomNavigation分の余白
          left: 0,
          right: 0,
          backgroundColor: "white",
          borderTop: "1px solid #e5e7eb",
          padding: "12px 16px",
          paddingBottom: "24px",
        }}
      >
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "#f3f4f6",
            borderRadius: "24px",
            padding: "8px 16px",
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.chat.inputPlaceholder}
            disabled={isLoading}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              fontSize: "15px",
              color: "#1f2937",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: inputValue.trim() && !isLoading ? "#3b82f6" : "#d1d5db",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: inputValue.trim() && !isLoading ? "pointer" : "default",
              transition: "background-color 0.2s",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* ローディングアニメーション用のスタイル */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}

