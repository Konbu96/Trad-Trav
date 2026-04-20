"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // 1.5秒後にフェードアウト開始
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1500);

    // 2秒後に完全に消える
    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      onFinish();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        zIndex: 99999,
        backgroundColor: "#FFE4EC",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 1s ease-out",
        opacity: isFading ? 0 : 1,
        overflow: "hidden",
      }}
    >
      {/* 舞妓さん */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          marginTop: "0px",
        }}
      >
        <Image
          src="/image/maiko.png"
          alt="舞妓さん"
          width={280}
          height={350}
          style={{
            height: "min(55vh, 350px)",
            width: "min(280px, calc(min(55vh, 350px) * 280 / 350))",
            objectFit: "contain",
            mixBlendMode: "multiply",
          }}
          unoptimized
          priority
        />
      </div>

      {/* アプリ名 */}
      <h1
        style={{
          color: "white",
          fontSize: "36px",
          fontWeight: "bold",
          marginTop: "-10px",
          textShadow: "2px 2px 8px rgba(0, 0, 0, 0.4)",
          letterSpacing: "6px",
          zIndex: 5,
          fontFamily: "'Cormorant Garamond', serif",
        }}
      >
        Trad Trav
      </h1>

      {/* Google Fonts読み込み */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&display=swap');
      `}</style>
    </div>
  );
}
