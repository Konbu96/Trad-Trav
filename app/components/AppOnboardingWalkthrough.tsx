"use client";

import type { ReactNode } from "react";
import { useLanguage } from "../i18n/LanguageContext";

const SLIDE_COUNT = 3;

type MockVariant = "search" | "reviews" | "coupons";

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
    mock: "search",
  },
  {
    titleKey: "slide2Title",
    subtitleKey: "slide2Subtitle",
    bodyKeys: ["slide2Body1", "slide2Body2", "slide2Body3"],
    mock: "reviews",
  },
  {
    titleKey: "slide3Title",
    subtitleKey: "slide3Subtitle",
    bodyKeys: ["slide3Body1", "slide3Body2", "slide3Body3"],
    mock: "coupons",
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
      className="mx-auto w-[min(280px,78vw)] rounded-[2rem] border-2 border-neutral-800 bg-neutral-50 p-3 shadow-sm"
      aria-hidden
    >
      <div className="overflow-hidden rounded-[1.35rem] bg-white px-2 pb-3 pt-2">{children}</div>
    </div>
  );
}

function MockSearch() {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[4/3] rounded-lg bg-gradient-to-br from-amber-100 to-orange-100" />
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-400">
        <span className="inline-block h-3.5 w-3.5 rounded-full border border-neutral-300" />
        <span className="truncate">Search…</span>
      </div>
    </div>
  );
}

function MockReviews() {
  return (
    <div className="flex flex-col gap-2">
      {[
        { name: "A", rating: "4.5" },
        { name: "B", rating: "4.2" },
      ].map((row) => (
        <div key={row.name} className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-white p-2">
          <div className="h-10 w-10 shrink-0 rounded bg-neutral-200" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-medium text-neutral-800">{row.name}</div>
            <div className="text-[10px] text-amber-600">★{row.rating}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockCoupons() {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-dashed border-rose-300 bg-rose-50 px-2 py-2 text-center text-[10px] font-semibold text-rose-800">
        10% OFF
      </div>
      <div className="rounded-lg border border-dashed border-violet-300 bg-violet-50 px-2 py-2 text-center text-[10px] font-semibold text-violet-800">
        Special
      </div>
    </div>
  );
}

function PhoneMock({ variant }: { variant: MockVariant }) {
  return (
    <PhoneFrame>
      {variant === "search" && <MockSearch />}
      {variant === "reviews" && <MockReviews />}
      {variant === "coupons" && <MockCoupons />}
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-white text-neutral-900">
      <div className="shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]" aria-hidden />

      <div className="flex min-h-0 flex-1 flex-col items-center px-6 pb-4 pt-2">
        <h1 className="text-center text-xl font-bold leading-snug tracking-tight sm:text-2xl">{o[slide.titleKey]}</h1>
        <p className="mt-1 text-center text-sm text-neutral-600">{o[slide.subtitleKey]}</p>

        <div className="mt-5 flex w-full flex-1 flex-col items-center justify-center py-2">
          <PhoneMock variant={slide.mock} />
        </div>

        <div className="mt-auto w-full max-w-md space-y-1.5 text-center text-sm leading-relaxed text-neutral-600">
          {slide.bodyKeys.map((key) => (
            <p key={key}>{o[key]}</p>
          ))}
        </div>

        <div className="mt-6 flex gap-2" aria-hidden>
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${i === idx ? "bg-neutral-900" : "bg-neutral-300"}`}
            />
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-neutral-100 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className={`rounded-2xl border border-neutral-200 py-3 text-center text-sm font-semibold transition active:scale-[0.99] ${
              canGoBack
                ? "bg-white text-neutral-800 hover:bg-neutral-50"
                : "cursor-default bg-neutral-50 text-neutral-300"
            }`}
          >
            {t.common.back}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-2xl border border-neutral-200 bg-white py-3 text-center text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 active:scale-[0.99]"
          >
            {o.skip}
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className="rounded-2xl bg-neutral-800 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-900 active:scale-[0.99]"
          >
            {idx < SLIDE_COUNT - 1 ? o.next : o.start}
          </button>
        </div>
      </div>
    </div>
  );
}
