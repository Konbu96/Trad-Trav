"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// 仮のAI応答（後でAPI連携に置き換え）
const getAIResponse = async (userMessage: string): Promise<string> => {
  // 簡単な応答パターン（後でOpenAI APIなどに置き換え）
  await new Promise(resolve => setTimeout(resolve, 1000)); // 擬似的な遅延
  
  const msg = userMessage.toLowerCase();
  
  // 挨拶
  if (msg.includes("こんにちは") || msg.includes("はじめまして") || msg.includes("やあ") || msg.includes("ハロー") || msg.includes("hello") || msg.includes("hi")) {
    return "こんにちは！北海道旅行のお手伝いをしますね🌸 観光スポットやグルメなど、何でも聞いてください！";
  }
  if (msg.includes("おはよう")) {
    return "おはようございます！今日も北海道旅行のお手伝いをしますね☀️ 何かお探しですか？";
  }
  if (msg.includes("こんばんは")) {
    return "こんばんは！夜の北海道も素敵ですよ🌙 函館の夜景や札幌のすすきのなど、何か気になることはありますか？";
  }
  if (msg.includes("ありがとう") || msg.includes("サンキュー")) {
    return "どういたしまして！他にも聞きたいことがあればいつでもどうぞ😊";
  }
  
  // 観光スポット
  if (msg.includes("おすすめ") || msg.includes("観光") || msg.includes("どこ行けば")) {
    return "北海道のおすすめスポットですね！\n\n📍 五稜郭（函館）\n📍 札幌時計台\n📍 円山動物園\n📍 サッポロビール園\n📍 赤レンガ庁舎\n\nどのエリアに興味がありますか？";
  }
  if (msg.includes("五稜郭")) {
    return "五稜郭は日本初の西洋式城郭です🏯\n\n⏰ 営業時間：8:00〜19:00\n💰 入場料：大人900円\n📍 住所：北海道函館市五稜郭町44\n\n五稜郭タワーから見る星形が絶景ですよ！春は桜の名所としても有名です🌸";
  }
  if (msg.includes("時計台")) {
    return "札幌市時計台は札幌のシンボルです🕰️\n\n⏰ 営業時間：8:45〜17:10\n💰 入場料：大人200円\n📍 住所：北海道札幌市中央区北1条西2丁目\n\n1878年から時を刻み続けています！";
  }
  if (msg.includes("札幌")) {
    return "札幌には見どころがたくさんあります！\n\n🏛️ 時計台\n🏛️ 赤レンガ庁舎\n🍺 サッポロビール園\n🐻 円山動物園\n\nジンギスカンやスープカレーも外せませんね！";
  }
  if (msg.includes("函館")) {
    return "函館といえば五稜郭と夜景が有名ですね！\n\n⭐ 五稜郭\n🌃 函館山夜景\n🦑 朝市の海鮮\n\n函館山からの夜景は「100万ドルの夜景」と呼ばれています✨";
  }
  
  // グルメ
  if (msg.includes("グルメ") || msg.includes("食べ物") || msg.includes("ご飯") || msg.includes("食事") || msg.includes("何食べ")) {
    return "北海道グルメなら、これがおすすめです！\n\n🍖 ジンギスカン\n🍣 海鮮丼\n🍜 味噌ラーメン\n🍛 スープカレー\n🦀 カニ料理\n\n何か気になる料理はありますか？";
  }
  if (msg.includes("ラーメン")) {
    return "北海道ラーメンといえば！\n\n🍜 札幌：味噌ラーメン\n🍜 旭川：醤油ラーメン\n🍜 函館：塩ラーメン\n\n各地域で特色があって楽しいですよ！";
  }
  if (msg.includes("ジンギスカン")) {
    return "ジンギスカンならサッポロビール園がおすすめです！🍖\n\n歴史ある赤レンガの建物で、出来たてビールと一緒に楽しめます🍺\n予約をおすすめしますよ！";
  }
  if (msg.includes("海鮮") || msg.includes("寿司") || msg.includes("カニ")) {
    return "北海道の海鮮は絶品です！🦀\n\n🐟 札幌：二条市場、場外市場\n🦑 函館：函館朝市\n🦀 小樽：三角市場\n\n新鮮な海鮮丼やカニをぜひ味わってください！";
  }
  
  // 天気・季節
  if (msg.includes("天気") || msg.includes("気温") || msg.includes("服装")) {
    return "北海道の気候についてですね！\n\n❄️ 冬（12-2月）：-10〜0℃ → 防寒必須\n🌸 春（3-5月）：0〜15℃ → 重ね着がおすすめ\n☀️ 夏（6-8月）：15〜25℃ → 涼しくて快適\n🍂 秋（9-11月）：5〜20℃ → 紅葉が綺麗\n\nいつ頃の旅行ですか？";
  }
  
  // アクセス
  if (msg.includes("アクセス") || msg.includes("行き方") || msg.includes("交通")) {
    return "北海道へのアクセスですね！✈️\n\n🛫 新千歳空港：札幌へのメイン空港\n🛫 函館空港：函館エリアへ\n🚄 北海道新幹線：函館まで\n\nどのエリアへ行く予定ですか？";
  }
  
  // デフォルト
  return `「${userMessage}」についてですね！\n\n申し訳ありませんが、詳しい情報を持っていません。\n\n以下のような質問ならお答えできますよ😊\n・おすすめの観光スポット\n・グルメ情報\n・各エリアの見どころ\n・アクセス方法`;
};

export default function AIChatView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: "こんにちは！北海道旅行のお手伝いをします🌸\n観光スポットやグルメ、アクセス方法など、何でも聞いてくださいね！",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        content: response,
        timestamp: new Date(),
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
          AIお助けチャット
        </h1>
        <p style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "4px" }}>
          北海道旅行のことなら何でも聞いてね！
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
            placeholder="メッセージを入力..."
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

