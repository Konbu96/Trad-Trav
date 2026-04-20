"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

type TutorialOverlayProps = {
  targetId: string;
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
};

type RectLike = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

const MASK_COLOR = "rgba(15, 23, 42, 0.5)";
/** ハイライトを対象より少し大きく見せる（外側の余白 px） */
const SPOTLIGHT_PADDING = 20;
const BUBBLE_WIDTH = 280;
/** 下部固定ボタン列のためのビューポート下端の予約（px） */
const BOTTOM_UI_RESERVE_PX = 100;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTutorialTarget(targetId: string) {
  return document.querySelector<HTMLElement>(`[data-tutorial-id="${targetId}"]`);
}

function getExpandedRect(rect: DOMRect): RectLike {
  const top = Math.max(0, rect.top - SPOTLIGHT_PADDING);
  const left = Math.max(0, rect.left - SPOTLIGHT_PADDING);
  const width = rect.width + SPOTLIGHT_PADDING * 2;
  const height = rect.height + SPOTLIGHT_PADDING * 2;

  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

export default function TutorialOverlay({
  targetId,
  title,
  description,
  stepIndex,
  totalSteps,
  onBack,
  onSkip,
  onNext,
}: TutorialOverlayProps) {
  const { t } = useLanguage();
  const isLastStep = stepIndex >= totalSteps - 1;
  const canGoBack = stepIndex > 0;
  const [targetRect, setTargetRect] = useState<RectLike | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [mounted, setMounted] = useState(false);
  /** 同一ステップで scrollIntoView を繰り返さない（要素が遅れて出る場合は interval で再試行） */
  const scrolledForStepRef = useRef("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    scrolledForStepRef.current = "";
    const scrollKey = `${targetId}:${stepIndex}`;

    const updatePosition = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const element = getTutorialTarget(targetId);
      if (!element) {
        setTargetRect(null);
        return;
      }

      if (scrolledForStepRef.current !== scrollKey) {
        scrolledForStepRef.current = scrollKey;
        element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        window.setTimeout(updatePosition, 450);
      }

      setTargetRect(getExpandedRect(element.getBoundingClientRect()));
    };

    updatePosition();

    const handleScroll = () => {
      updatePosition();
    };

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", handleScroll, true);
    const intervalId = window.setInterval(updatePosition, 250);

    let observer: ResizeObserver | null = null;
    const target = getTutorialTarget(targetId);
    if (target && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => updatePosition());
      observer.observe(target);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", handleScroll, true);
      window.clearInterval(intervalId);
      observer?.disconnect();
    };
  }, [targetId, stepIndex]);

  const bubbleStyle = useMemo(() => {
    if (!targetRect || viewport.width === 0 || viewport.height === 0) {
      return {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      } as const;
    }

    const usableH = viewport.height - BOTTOM_UI_RESERVE_PX;
    const showAbove =
      targetRect.bottom + 220 > usableH && targetRect.top > 220;
    const left = clamp(
      targetRect.left + targetRect.width / 2 - BUBBLE_WIDTH / 2,
      16,
      Math.max(16, viewport.width - BUBBLE_WIDTH - 16)
    );

    const topBelow = Math.min(usableH - 200, targetRect.bottom + 16);
    const topAbove = Math.max(16, targetRect.top - 172);

    return {
      left: `${left}px`,
      top: showAbove ? `${topAbove}px` : `${Math.max(16, topBelow)}px`,
    } as const;
  }, [targetRect, viewport.height, viewport.width]);

  const overlay = (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10050,
        pointerEvents: "auto",
      }}
    >
      {/* 背面:チュートリアル吹き出し以外のタップをすべて受け止める（迷子防止） */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundColor: "transparent",
          pointerEvents: "auto",
        }}
      />

      {targetRect ? (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: `${targetRect.top}px`,
              backgroundColor: MASK_COLOR,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: `${targetRect.top}px`,
              left: 0,
              width: `${targetRect.left}px`,
              height: `${targetRect.height}px`,
              backgroundColor: MASK_COLOR,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: `${targetRect.top}px`,
              left: `${targetRect.right}px`,
              right: 0,
              height: `${targetRect.height}px`,
              backgroundColor: MASK_COLOR,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: `${targetRect.bottom}px`,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: MASK_COLOR,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        </>
      ) : (
        <div style={{ position: "fixed", inset: 0, backgroundColor: MASK_COLOR, pointerEvents: "none", zIndex: 1 }} />
      )}

      <div
        style={{
          position: "fixed",
          width: `${BUBBLE_WIDTH}px`,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "min(72vh, calc(100dvh - 120px))",
          overflowY: "auto",
          borderRadius: "22px",
          backgroundColor: "white",
          border: "1px solid #f3d1da",
          boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
          padding: "16px 16px 14px",
          pointerEvents: "auto",
          zIndex: 2,
          ...bubbleStyle,
        }}
      >
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#e88fa3" }}>
          {t.tutorial.stepLabel
            .replace("{current}", String(stepIndex + 1))
            .replace("{total}", String(totalSteps))}
        </p>
        <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#111827", marginTop: "6px", lineHeight: 1.4 }}>
          {title}
        </h3>
        <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.8, marginTop: "8px" }}>
          {description}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            marginTop: "14px",
          }}
        >
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            style={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              backgroundColor: canGoBack ? "#fff" : "#f3f4f6",
              color: canGoBack ? "#374151" : "#9ca3af",
              padding: "10px 6px",
              fontSize: "12px",
              fontWeight: 700,
              minHeight: "44px",
              cursor: canGoBack ? "pointer" : "default",
            }}
          >
            {t.tutorial.back}
          </button>
          <button
            type="button"
            onClick={onSkip}
            style={{
              borderRadius: "12px",
              border: "1px solid #f3d1da",
              backgroundColor: "#fdf3f5",
              color: "#b85f74",
              padding: "10px 6px",
              fontSize: "12px",
              fontWeight: 700,
              minHeight: "44px",
            }}
          >
            {t.tutorial.skip}
          </button>
          <button
            type="button"
            onClick={onNext}
            style={{
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #f9a8d4, #e88fa3)",
              color: "white",
              padding: "10px 6px",
              fontSize: "12px",
              fontWeight: 800,
              minHeight: "44px",
              boxShadow: "0 2px 10px rgba(232, 143, 163, 0.35)",
            }}
          >
            {isLastStep ? t.tutorial.done : t.tutorial.next}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(overlay, document.body);
}
