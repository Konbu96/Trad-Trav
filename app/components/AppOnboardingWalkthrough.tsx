"use client";

import type { ReactNode } from "react";
import { TRADITIONAL_GENRES, type TraditionalGenreId } from "../data/traditionalGenres";
import { useLanguage } from "../i18n/LanguageContext";
import type { Translations } from "../i18n/translations";

const SLIDE_COUNT = 3;

type MockVariant = "mapDiscover" | "nowInfo" | "myPage";

const SLIDES: {
  titleKey: keyof MessagesOnboarding;
  subtitleKey: keyof MessagesOnboarding;
  bodyKeys: [keyof MessagesOnboarding, keyof MessagesOnboarding, keyof MessagesOnboarding];
  mock: MockVariant;
}[] = [
  {
    titleKey: "slide1Title",
    subtitleKey: "slide1Subtitle",
    bodyKeys: ["slide1Body1", "slide1Body2", "slide1Body3"],
    mock: "mapDiscover",
  },
  {
    titleKey: "slide2Title",
    subtitleKey: "slide2Subtitle",
    bodyKeys: ["slide2Body1", "slide2Body2", "slide2Body3"],
    mock: "nowInfo",
  },
  {
    titleKey: "slide3Title",
    subtitleKey: "slide3Subtitle",
    bodyKeys: ["slide3Body1", "slide3Body2", "slide3Body3"],
    mock: "myPage",
  },
];

/** Narrow type for onboarding message keys (avoids importing full Translations). */
type MessagesOnboarding = {
  skip: string;
  next: string;
  start: string;
  slide1Title: string;
  slide1Subtitle: string;
  slide1Body1: string;
  slide1Body2: string;
  slide1Body3: string;
  slide2Title: string;
  slide2Subtitle: string;
  slide2Body1: string;
  slide2Body2: string;
  slide2Body3: string;
  slide3Title: string;
  slide3Subtitle: string;
  slide3Body1: string;
  slide3Body2: string;
  slide3Body3: string;
};

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="mx-auto w-[min(280px,78vw)] rounded-[2rem] border-2 border-rose-200/90 bg-gradient-to-b from-white to-rose-50/80 p-3 shadow-md shadow-rose-200/40"
      aria-hidden
    >
      <div className="overflow-hidden rounded-[1.35rem] border border-rose-100/60 bg-white px-2 pb-3 pt-2 shadow-inner shadow-rose-100/30">
        {children}
      </div>
    </div>
  );
}

function genreLabel(id: TraditionalGenreId, t: Translations): string {
  const map: Record<TraditionalGenreId, string> = {
    festival: t.mapTab.genreFestival,
    performing: t.mapTab.genrePerforming,
    history: t.mapTab.genreHistory,
    craft: t.mapTab.genreCraft,
  };
  return map[id];
}

/** 体験発掘タブに近い見た目：ピンク帯タイトル・上段検索・縦並びジャンル棚 */
function MockMapDiscover({ t }: { t: Translations }) {
  const genres = TRADITIONAL_GENRES.slice(0, 2);

  return (
    <div className="flex flex-col">
      <div
        className="flex-shrink-0 px-1.5 py-2 text-center text-[9px] font-extrabold leading-tight text-white"
        style={{ background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)" }}
      >
        {t.mapTab.headerTitle}
      </div>
      <div className="border-b bg-white px-2 py-2" style={{ borderColor: "#f7dfe5" }}>
        <div
          className="flex items-center gap-2 rounded-xl px-2 py-1.5"
          style={{ border: "1px solid #cfd4dc", boxShadow: "inset 0 1px 2px rgba(15,23,42,0.03)" }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-rose-400"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span className="truncate text-[10px] text-rose-400/90">{t.mapTab.searchPlaceholder}</span>
        </div>
      </div>
      <div className="space-y-2.5 bg-rose-50/70 px-1 py-2">
        {genres.map((g) => (
          <section key={g.id}>
            <h3 className="mb-1 pl-2 text-[10px] font-extrabold leading-tight" style={{ color: "#ef7e8d" }}>
              {genreLabel(g.id, t)}
            </h3>
            <div className="flex gap-1 pb-0.5" style={{ scrollbarWidth: "none" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border text-[13px] leading-none"
                  style={{
                    width: 34,
                    height: 34,
                    borderColor: "#ececec",
                    boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
                    background: "linear-gradient(135deg, #f6d7b8, #f3b6c3)",
                  }}
                >
                  <span aria-hidden>{g.emoji}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** なう情報タブに寄せたヘッダー＋カード */
function MockNowInfo({ t }: { t: Translations }) {
  return (
    <div className="flex flex-col bg-gradient-to-b from-rose-50/90 to-pink-50/40">
      <div
        className="py-2 text-center text-[11px] font-extrabold text-white"
        style={{ background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)" }}
      >
        {t.nowInfo.pageTitle}
      </div>
      <div className="space-y-2 p-2">
        <div
          className="rounded-2xl border bg-white p-2"
          style={{ borderColor: "#f7dfe5", boxShadow: "0 2px 10px rgba(236,72,153,0.08)" }}
        >
          <div
            className="inline-block rounded-full px-2 py-0.5 text-[8px] font-bold text-white"
            style={{ background: "#e88fa3" }}
          >
            {t.nowInfo.mannerBadge}
          </div>
          <p className="mt-1 line-clamp-2 text-[9px] leading-snug text-rose-800/85">{t.nowInfo.mannerSectionTitle}</p>
        </div>
        {[
          { rating: "4.5" },
          { rating: "4.2" },
        ].map((row, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-xl border border-rose-100/80 bg-white p-2"
            style={{ boxShadow: "0 2px 8px rgba(232,143,163,0.12)" }}
          >
            <div className="h-9 w-9 shrink-0 rounded-lg bg-rose-100" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-semibold text-rose-950">{t.nowInfo.facilitiesSectionTitle}</div>
              <div className="text-[9px] text-amber-600">★{row.rating}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** マイページ：言語・クエスト（実アプリに近いメニュー風） */
function MockMyPage({ t }: { t: Translations }) {
  return (
    <div className="flex flex-col bg-gradient-to-b from-rose-50/80 to-pink-50/50">
      <div
        className="py-2 text-center text-[11px] font-extrabold text-white"
        style={{ background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)" }}
      >
        {t.mypage.title}
      </div>
      <div className="p-2">
        <div
          className="rounded-2xl border bg-white p-2.5"
          style={{ borderColor: "#f7dfe5", boxShadow: "0 2px 10px rgba(15,23,42,0.06)" }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-rose-100 pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-sm" aria-hidden>
                🌐
              </span>
              <span className="truncate text-[10px] font-semibold text-rose-950">{t.mypage.language}</span>
            </div>
            <span className="text-rose-300">›</span>
          </div>
          <div className="pt-2">
            <div className="text-[10px] font-extrabold" style={{ color: "#ef7e8d" }}>
              {t.mypage.playerQuestsTitle}
            </div>
            <div className="mt-1.5">
              <span
                className="inline-block rounded-full border px-2 py-0.5 text-[8px] font-semibold"
                style={{ borderColor: "#f3d1da", color: "#e88fa3", backgroundColor: "#fff" }}
              >
                {t.mypage.playerQuestClaimAll}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneMock({ variant }: { variant: MockVariant }) {
  const { t } = useLanguage();

  return (
    <PhoneFrame>
      {variant === "mapDiscover" && <MockMapDiscover t={t} />}
      {variant === "nowInfo" && <MockNowInfo t={t} />}
      {variant === "myPage" && <MockMyPage t={t} />}
    </PhoneFrame>
  );
}

export type AppOnboardingWalkthroughProps = {
  slideIndex: number;
  onPrimary: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export default function AppOnboardingWalkthrough({
  slideIndex,
  onPrimary,
  onBack,
  onSkip,
}: AppOnboardingWalkthroughProps) {
  const { t } = useLanguage();
  const o = t.onboarding as MessagesOnboarding;
  const idx = Math.min(Math.max(0, slideIndex), SLIDE_COUNT - 1);
  const slide = SLIDES[idx]!;

  const canGoBack = idx > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-rose-50 via-pink-50/60 to-rose-100/40 text-rose-950"
      style={{ boxShadow: "inset 0 0 80px rgba(232,143,163,0.08)" }}
    >
      <div className="shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]" aria-hidden />

      <div className="flex min-h-0 flex-1 flex-col items-center px-6 pb-4 pt-2">
        <h1 className="text-center text-xl font-bold leading-snug tracking-tight text-rose-950 sm:text-2xl">
          {o[slide.titleKey]}
        </h1>
        <p className="mt-1 text-center text-sm text-rose-700/90">{o[slide.subtitleKey]}</p>

        <div className="mt-5 w-full shrink-0">
          <PhoneMock variant={slide.mock} />
        </div>

        <div className="mt-4 w-full max-w-md space-y-1.5 text-center text-sm leading-relaxed text-rose-800/88">
          {slide.bodyKeys.map((key) => (
            <p key={key}>{o[key]}</p>
          ))}
        </div>

        <div className="mt-6 flex gap-2" aria-hidden>
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${i === idx ? "bg-[#e88fa3] shadow-sm shadow-rose-300/60" : "bg-rose-200/90"}`}
            />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-rose-200/60 bg-rose-50/40 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-[2px]">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className={`rounded-2xl border py-3 text-center text-sm font-semibold transition active:scale-[0.99] ${
              canGoBack
                ? "border-rose-200 bg-white/90 text-rose-800 shadow-sm shadow-rose-100/50 hover:bg-rose-50"
                : "cursor-default border-rose-100 bg-rose-50/40 text-rose-300"
            }`}
          >
            {t.common.back}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-2xl border border-rose-200 bg-white/85 py-3 text-center text-sm font-semibold text-rose-700 shadow-sm shadow-rose-100/40 transition hover:bg-rose-50 active:scale-[0.99]"
          >
            {o.skip}
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="rounded-2xl bg-gradient-to-r from-[#e88fa3] to-[#f3a7b8] py-3 text-center text-sm font-semibold text-white shadow-md shadow-rose-300/45 transition hover:brightness-[1.03] active:scale-[0.99]"
          >
            {idx < SLIDE_COUNT - 1 ? o.next : o.start}
          </button>
        </div>
      </div>
    </div>
  );
}
