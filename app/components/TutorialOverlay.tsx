"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

type TutorialOverlayProps = {
  targetId: string;
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  onSkip: () => void;
  /** 初回アプリウォークスルー: 「次へ」で進む（タブの data-tutorial-id を順に照らす） */
  onAdvance?: () => void;
  /** onAdvance 時のヒント文言（未指定なら walkthrough.tapHint を使用） */
  advanceTapHint?: string;
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
const SPOTLIGHT_PADDING = 10;
const BUBBLE_WIDTH = 280;

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
  onSkip,
  onAdvance,
  advanceTapHint,
}: TutorialOverlayProps) {
  const { t } = useLanguage();
  const useAdvance = Boolean(onAdvance);
  const [targetRect, setTargetRect] = useState<RectLike | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
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
  }, [targetId]);

  const bubbleStyle = useMemo(() => {
    if (!targetRect || viewport.width === 0 || viewport.height === 0) {
      return {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      } as const;
    }

    const showAbove = targetRect.bottom + 220 > viewport.height && targetRect.top > 220;
    const left = clamp(
      targetRect.left + targetRect.width / 2 - BUBBLE_WIDTH / 2,
      16,
      Math.max(16, viewport.width - BUBBLE_WIDTH - 16)
    );

    return {
      left: `${left}px`,
      top: showAbove ? `${Math.max(16, targetRect.top - 172)}px` : `${Math.min(viewport.height - 188, targetRect.bottom + 16)}px`,
    } as const;
  }, [targetRect, viewport.height, viewport.width]);

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        pointerEvents: "none",
      }}
    >
      {targetRect ? (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: `${targetRect.top}px`, backgroundColor: MASK_COLOR }} />
          <div
            style={{
              position: "fixed",
              top: `${targetRect.top}px`,
              left: 0,
              width: `${targetRect.left}px`,
              height: `${targetRect.height}px`,
              backgroundColor: MASK_COLOR,
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
            }}
          />
        </>
      ) : (
        <div style={{ position: "fixed", inset: 0, backgroundColor: MASK_COLOR }} />
      )}

      <div
        style={{
          position: "fixed",
          width: `${BUBBLE_WIDTH}px`,
          maxWidth: "calc(100vw - 32px)",
          borderRadius: "22px",
          backgroundColor: "white",
          border: "1px solid #f3d1da",
          boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
          padding: "16px 16px 14px",
          pointerEvents: "auto",
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
        <p style={{ fontSize: "12px", color: "#b85f74", fontWeight: 700, marginTop: "10px" }}>
          {useAdvance ? advanceTapHint ?? t.walkthrough.tapHint : t.tutorial.tapTargetHint}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: useAdvance ? "space-between" : "flex-end",
            alignItems: "center",
            gap: "8px",
            marginTop: "12px",
          }}
        >
          <button
            type="button"
            onClick={onSkip}
            style={{
              borderRadius: "999px",
              border: "1px solid #f3d1da",
              backgroundColor: "#fdf3f5",
              color: "#b85f74",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {t.tutorial.skip}
          </button>
          {useAdvance && onAdvance ? (
            <button
              type="button"
              onClick={onAdvance}
              style={{
                borderRadius: "999px",
                border: "none",
                background: "linear-gradient(135deg, #f9a8d4, #e88fa3)",
                color: "white",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 800,
                boxShadow: "0 2px 10px rgba(232, 143, 163, 0.4)",
              }}
            >
              {stepIndex >= totalSteps - 1 ? t.walkthrough.done : t.walkthrough.next}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
