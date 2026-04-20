"use client";

import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { LANGUAGE_PICKER_ROW_LABEL } from "../i18n/languagePickerLabels";
import { ClockIcon, DefaultAvatarIcon, GearIcon, HeartIcon, PenIcon } from "./icons";
import { TIPS_TOPICS } from "../data/helpfulInfo";
import { recommendedSpots } from "../data/spots";
import { localizeHelpfulCard } from "../lib/localizeHelpfulLibrary";
import type { CurrentAddress, LocationPermissionState } from "../page";
import {
  cosmeticsCoinsForLevelUp,
  loadCosmeticsCoins,
  saveCosmeticsCoins,
} from "../lib/cosmeticsCoins";
import { locationIssueMessage } from "../lib/locationIssue";
import type { LocationIssueCode } from "../lib/locationIssue";
import {
  QUESTS,
  dailyQuestStateForUi,
  defaultPlayerProgress,
  getQuestProgressViewsForCategory,
  getQuestUnclaimedBadgeCounts,
  xpIntoCurrentLevel,
  type PlayerProgress,
  type QuestCategory,
} from "../lib/playerProgress";

interface User {
  name: string;
  email: string;
}

interface ViewHistoryItem {
  id: number;
  name: string;
  date: string;
  category: string;
}

type MypagePanel = "main" | "history" | "favorites" | "settings" | "cosmetics";

export type MyPageTutorialHandle = {
  applyTutorialAutomation: (targetId: string) => void;
};

function MypageSubHeader({
  title,
  onBack,
  backDataTutorialId,
  onTutorialAction,
}: {
  title: string;
  onBack: () => void;
  backDataTutorialId?: string;
  onTutorialAction?: (actionId: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px 16px",
        borderBottom: "1px solid #f7dfe5",
        background: "#fdf3f5",
      }}
    >
      <button
        type="button"
        data-tutorial-id={backDataTutorialId}
        onClick={() => {
          if (backDataTutorialId) {
            onTutorialAction?.(backDataTutorialId);
          }
          onBack();
        }}
        style={{
          border: "none",
          background: "rgba(255,255,255,0.9)",
          borderRadius: "12px",
          padding: "8px 14px",
          fontSize: "14px",
          fontWeight: 600,
          color: "#374151",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          cursor: "pointer",
        }}
      >
        ← {t.common.back}
      </button>
      <h1 style={{ fontSize: "17px", fontWeight: 800, color: "#111827", flex: 1 }}>{title}</h1>
    </div>
  );
}

interface MyPageViewProps {
  user: User | null;
  viewHistory?: ViewHistoryItem[];
  onLogout?: () => void;
  onJumpToSpot?: (spotId: number, spotNameHint?: string) => void;
  onStartDiagnosis?: () => void;
  onLoginRequest?: () => void;
  locationPermissionState?: LocationPermissionState;
  locationIssueCode?: LocationIssueCode;
  currentPosition?: { latitude: number; longitude: number } | null;
  currentAddress?: CurrentAddress | null;
  isUsingMockLocation?: boolean;
  onRequestLocationPermission?: () => void;
  settingsOpenKey?: number;
  onTutorialAction?: (actionId: string) => void;
  onReplayTutorials?: () => void;
  favoriteSpotIds?: number[];
  onToggleFavorite?: (spotId: number) => void;
  helpfulFavoriteKeys?: string[];
  onToggleHelpfulFavorite?: (favoriteKey: string) => void;
  onOpenHelpfulFavorite?: (favoriteKey: string) => void;
  /** 未ログイン時に localStorage から復元した表示名（空ならゲスト扱い） */
  guestDisplayName?: string;
  onSaveDisplayName?: (name: string) => Promise<void>;
  playerProgress?: PlayerProgress;
  /** クエスト報酬の受け取り（「達成」押下） */
  onClaimQuest?: (questId: string) => void;
  /** 開発時のみ: 経験値・クエスト等を初期化 */
  onResetPlayerProgressDev?: () => void | Promise<void>;
}

const MyPageView = forwardRef<MyPageTutorialHandle, MyPageViewProps>(function MyPageView(
  {
    user,
    viewHistory = [],
    onLogout,
    onJumpToSpot,
    onStartDiagnosis,
    onLoginRequest,
    locationPermissionState = "idle",
    locationIssueCode = "",
    currentPosition = null,
    currentAddress = null,
    isUsingMockLocation = false,
    onRequestLocationPermission,
    settingsOpenKey = 0,
    onTutorialAction,
    onReplayTutorials,
    favoriteSpotIds = [],
    onToggleFavorite,
    helpfulFavoriteKeys = [],
    onToggleHelpfulFavorite,
    onOpenHelpfulFavorite,
    guestDisplayName = "",
    onSaveDisplayName,
    playerProgress: playerProgressProp,
  onClaimQuest,
  onResetPlayerProgressDev,
  },
  ref
) {
  const playerProgress = playerProgressProp ?? defaultPlayerProgress();
  const levelRingGradId = useId().replace(/:/g, "");
  const { language, setLanguage, t } = useLanguage();
  const { level: playerLevel, current: xpInLevel, need: xpNeedForLevel } = xpIntoCurrentLevel(playerProgress.xp);
  const [questCategory, setQuestCategory] = useState<QuestCategory>("daily");
  const [xpGainOverlay, setXpGainOverlay] = useState<{ xp: number } | null>(null);
  const [levelUpOverlay, setLevelUpOverlay] = useState<{ level: number; coinsEarned: number } | null>(null);
  const [ringPulseOn, setRingPulseOn] = useState(false);
  const prevLevelOverlayRef = useRef(playerLevel);
  const levelOverlayMountedRef = useRef(false);
  const prevXpRingRef = useRef(playerProgress.xp);
  const xpRingFirstRef = useRef(true);
  const xpGainOverlayRef = useRef(xpGainOverlay);
  const pendingLevelUpRef = useRef<{ level: number; coinsEarned: number } | null>(null);
  xpGainOverlayRef.current = xpGainOverlay;

  const dismissXpGainOverlay = useCallback(() => {
    setXpGainOverlay((prev) => {
      if (prev == null) return prev;
      const pending = pendingLevelUpRef.current;
      pendingLevelUpRef.current = null;
      if (pending != null) {
        queueMicrotask(() => setLevelUpOverlay(pending));
      }
      return null;
    });
  }, []);

  const dismissLevelUpOverlay = useCallback(() => {
    setLevelUpOverlay(null);
  }, []);

  useEffect(() => {
    if (!levelOverlayMountedRef.current) {
      levelOverlayMountedRef.current = true;
      prevLevelOverlayRef.current = playerLevel;
      return;
    }
    if (playerLevel > prevLevelOverlayRef.current) {
      const payload = {
        level: playerLevel,
        coinsEarned: cosmeticsCoinsForLevelUp(playerLevel),
      };
      if (xpGainOverlayRef.current != null) {
        pendingLevelUpRef.current = payload;
      } else {
        setLevelUpOverlay(payload);
      }
      prevLevelOverlayRef.current = playerLevel;
      return;
    }
    prevLevelOverlayRef.current = playerLevel;
  }, [playerLevel]);

  useEffect(() => {
    if (xpRingFirstRef.current) {
      xpRingFirstRef.current = false;
      prevXpRingRef.current = playerProgress.xp;
      return;
    }
    if (playerProgress.xp > prevXpRingRef.current) {
      setRingPulseOn(true);
      const timer = window.setTimeout(() => setRingPulseOn(false), 1000);
      prevXpRingRef.current = playerProgress.xp;
      return () => window.clearTimeout(timer);
    }
    prevXpRingRef.current = playerProgress.xp;
  }, [playerProgress.xp]);
  const questRowsSorted = useMemo(() => {
    const questOrder = (id: string) => QUESTS.findIndex((q) => q.id === id);
    const dailyUi = dailyQuestStateForUi(playerProgress.dailyQuestState);
    const raw = getQuestProgressViewsForCategory(
      playerProgress.stats,
      dailyUi,
      questCategory,
      playerProgress.completedQuestIds
    );
    /** 0=達成ボタン表示中（最上段）, 1=未達成, 2=達成済み（最下段） */
    const rank = (row: (typeof raw)[0]) => {
      if (row.rewardClaimed) return 2;
      if (row.done) return 0;
      return 1;
    };
    return [...raw].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      return questOrder(a.quest.id) - questOrder(b.quest.id);
    });
  }, [playerProgress.stats, playerProgress.dailyQuestState, playerProgress.completedQuestIds, questCategory]);

  const questUnclaimedBadges = useMemo(
    () => getQuestUnclaimedBadgeCounts(playerProgress),
    [playerProgress]
  );

  const levelBarPercent =
    xpNeedForLevel > 0 ? Math.min(100, Math.round((xpInLevel / xpNeedForLevel) * 100)) : 0;
  const xpToNextLevel = Math.max(0, xpNeedForLevel - xpInLevel);
  const RING_SIZE = 92;
  const RING_R = 40;
  const ringCircumference = 2 * Math.PI * RING_R;
  const ringDashOffset = ringCircumference * (1 - levelBarPercent / 100);
  const savedRawDisplayName = user ? (user.name ?? "") : guestDisplayName;
  /** 未ログイン時は「ゲスト」表記を出さない（空なら名前欄を畳む） */
  const resolvedDisplayName = user
    ? savedRawDisplayName.trim() || t.mypage.guest
    : savedRawDisplayName.trim();
  const [draftName, setDraftName] = useState(savedRawDisplayName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [saveNameError, setSaveNameError] = useState("");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [panel, setPanel] = useState<MypagePanel>("main");
  const [subPanelEntered, setSubPanelEntered] = useState(false);
  const locationSectionRef = useRef<HTMLDivElement | null>(null);
  const [cosmeticsCoins, setCosmeticsCoins] = useState(() => loadCosmeticsCoins());
  const prevLevelCoinRef = useRef(playerLevel);
  const coinLevelMountedRef = useRef(false);

  useEffect(() => {
    if (!coinLevelMountedRef.current) {
      coinLevelMountedRef.current = true;
      prevLevelCoinRef.current = playerLevel;
      return;
    }
    if (playerLevel > prevLevelCoinRef.current) {
      const delta = cosmeticsCoinsForLevelUp(playerLevel);
      setCosmeticsCoins((c) => {
        const next = c + delta;
        saveCosmeticsCoins(next);
        return next;
      });
    }
    prevLevelCoinRef.current = playerLevel;
  }, [playerLevel]);

  useEffect(() => {
    if (panel === "main") {
      setSubPanelEntered(false);
      return;
    }
    setSubPanelEntered(false);
    const t = window.setTimeout(() => setSubPanelEntered(true), 20);
    return () => window.clearTimeout(t);
  }, [panel]);

  const beginCloseSubPanel = useCallback(() => {
    setSubPanelEntered(false);
  }, []);

  const handleSubPanelTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
      if (!subPanelEntered) {
        setPanel("main");
      }
    },
    [subPanelEntered]
  );

  useImperativeHandle(
    ref,
    () => ({
      applyTutorialAutomation(targetId: string) {
        switch (targetId) {
          case "nav.mypage":
          case "mypage.location-share-button":
          case "mypage.language-button":
          case "mypage.login-cta":
            return;
          case "mypage.settings-entry":
            setShowLanguageModal(false);
            setPanel("settings");
            return;
          case "mypage.settings-back":
            setShowLanguageModal(false);
            setPanel("main");
            setSubPanelEntered(false);
            return;
          case "mypage.quest-section":
            setShowLanguageModal(false);
            setPanel("main");
            setSubPanelEntered(false);
            requestAnimationFrame(() => {
              document
                .querySelector<HTMLElement>(`[data-tutorial-id="mypage.quest-section"]`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
            return;
          case "mypage.cosmetics-entry":
            setShowLanguageModal(false);
            setPanel("cosmetics");
            return;
          default:
            return;
        }
      },
    }),
    []
  );

  const favoriteDisplayRows = favoriteSpotIds.map((id) => {
    const spot = recommendedSpots.find((s) => s.id === id);
    const hist = viewHistory.find((h) => h.id === id);
    const name =
      spot?.name ||
      hist?.name ||
      t.mypage.favoriteNameMapSpot;
    const category = spot?.category || hist?.category || "";
    return { id, name, category };
  });

  const mannerFavoriteKeys = useMemo(
    () => helpfulFavoriteKeys.filter((k) => k.startsWith("manner:") || k.startsWith("mannerItem:")),
    [helpfulFavoriteKeys]
  );
  const triviaFavoriteKeys = useMemo(
    () =>
      helpfulFavoriteKeys.filter((k) => {
        if (!k.startsWith("tips:")) return false;
        const id = k.slice("tips:".length);
        return TIPS_TOPICS.find((topic) => topic.id === id)?.tabId === "trivia";
      }),
    [helpfulFavoriteKeys]
  );
  const guideFavoriteKeys = useMemo(
    () =>
      helpfulFavoriteKeys.filter((k) => {
        if (!k.startsWith("tips:")) return false;
        const id = k.slice("tips:".length);
        return TIPS_TOPICS.find((topic) => topic.id === id)?.tabId === "guide";
      }),
    [helpfulFavoriteKeys]
  );

  const totalFavoritesCount =
    favoriteDisplayRows.length + mannerFavoriteKeys.length + triviaFavoriteKeys.length + guideFavoriteKeys.length;

  useEffect(() => {
    if (!settingsOpenKey) return;
    setPanel("settings");
    const id = window.setTimeout(() => {
      locationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(id);
  }, [settingsOpenKey]);

  useEffect(() => {
    if (!isEditingName) {
      setDraftName(savedRawDisplayName);
    }
  }, [savedRawDisplayName, isEditingName]);

  const beginEditName = useCallback(() => {
    setDraftName(savedRawDisplayName);
    setSaveNameError("");
    setIsEditingName(true);
  }, [savedRawDisplayName]);

  const handleCancelNameEdit = useCallback(() => {
    setDraftName(savedRawDisplayName);
    setSaveNameError("");
    setIsEditingName(false);
  }, [savedRawDisplayName]);

  const handleConfirmSaveName = useCallback(async () => {
    if (!onSaveDisplayName) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    setSaveNameError("");
    try {
      await onSaveDisplayName(draftName);
      setIsEditingName(false);
    } catch {
      setSaveNameError(t.mypage.saveDisplayNameFailed);
    } finally {
      setSavingName(false);
    }
  }, [draftName, onSaveDisplayName, t.mypage.saveDisplayNameFailed]);

  const getLocationErrorGuide = () => {
    if (locationPermissionState === "denied") {
      return t.mypage.locationGuideDenied;
    }

    if (locationPermissionState === "unsupported") {
      return t.mypage.locationGuideUnsupported;
    }

    if (locationIssueCode === "timeout") {
      return t.mypage.locationGuideTimeout;
    }

    if (locationIssueCode === "insecure_context") {
      return t.mypage.locationGuideInsecure;
    }

    if (locationIssueCode === "position_unavailable") {
      return t.mypage.locationGuideUnavailable;
    }

    return t.mypage.locationGuideGeneric;
  };

  const settingsPanelBody = (
    <>
      <div style={{ padding: "0 0 8px" }}>
        <div
          ref={locationSectionRef}
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "18px 16px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            marginBottom: "12px",
            border: "1px solid #f7dfe5",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "14px",
                backgroundColor: "#fdf3f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              📍
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "15px", fontWeight: "600", color: "#1f2937" }}>
                {t.mypage.locationSectionTitle}
              </p>
              <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.7", marginTop: "4px" }}>
                {t.mypage.locationSectionLead}
              </p>
            </div>
          </div>

          {onRequestLocationPermission && (
            <button
              type="button"
              onClick={() => {
                onTutorialAction?.("mypage.location-share-button");
                onRequestLocationPermission();
              }}
              data-tutorial-id="mypage.location-share-button"
              style={{
                marginTop: "14px",
                borderRadius: "999px",
                backgroundColor:
                  isUsingMockLocation
                    ? "#f59e0b"
                    : locationPermissionState === "granted"
                      ? "#e88fa3"
                      : locationPermissionState === "requesting"
                        ? "#f3b6c3"
                        : "#e88fa3",
                color: "white",
                padding: "10px 14px",
                fontSize: "13px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                opacity: locationPermissionState === "requesting" ? 0.9 : 1,
              }}
            >
              {locationPermissionState === "requesting"
                ? t.mypage.locationButtonRequesting
                : isUsingMockLocation
                  ? t.mypage.locationButtonMock
                  : locationPermissionState === "granted"
                    ? t.mypage.locationButtonWatching
                    : t.mypage.locationButtonPrompt}
            </button>
          )}

          {currentPosition && (
            <div style={{ marginTop: "10px" }}>
              <p style={{ fontSize: "12px", color: isUsingMockLocation ? "#b45309" : "#166534", fontWeight: "700" }}>
                {isUsingMockLocation ? t.mypage.locationStatusMock : t.mypage.locationStatusWatching}
              </p>
              {currentAddress && (
                <p style={{ fontSize: "12px", color: "#1f2937", lineHeight: "1.6", marginTop: "4px" }}>
                  {currentAddress.prefecture}{currentAddress.city}{currentAddress.town}
                </p>
              )}
              <p style={{ fontSize: "12px", color: "#374151", lineHeight: "1.6", marginTop: "2px" }}>
                {t.common.latLng
                  .replace("{lat}", String(currentPosition.latitude.toFixed(5)))
                  .replace("{lng}", String(currentPosition.longitude.toFixed(5)))}
              </p>
              {currentAddress?.formattedAddress && (
                <p style={{ fontSize: "11px", color: "#6b7280", lineHeight: "1.6", marginTop: "4px" }}>
                  {currentAddress.formattedAddress}
                </p>
              )}
            </div>
          )}

          {(locationPermissionState === "denied" || locationPermissionState === "unsupported" || locationPermissionState === "error") && locationIssueCode && (
            <div
              style={{
                marginTop: "12px",
                borderRadius: "14px",
                backgroundColor: "#fdf3f5",
                border: "1px solid #fecdd3",
                padding: "12px 14px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#b91c1c", fontWeight: "700" }}>
                {t.mypage.locationFetchFailedTitle}
              </p>
              <p style={{ fontSize: "12px", color: "#991b1b", lineHeight: "1.7", marginTop: "4px" }}>
                {locationIssueMessage(t, locationIssueCode)}
              </p>
              <p style={{ fontSize: "11px", color: "#7f1d1d", lineHeight: "1.7", marginTop: "6px" }}>
                {getLocationErrorGuide()}
              </p>
            </div>
          )}
        </div>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              onTutorialAction?.("mypage.language-button");
              setShowLanguageModal(true);
            }}
            data-tutorial-id="mypage.language-button"
            style={{
              width: "100%",
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>🌐</span>
              <span style={{ fontSize: "15px", color: "#374151" }}>{t.mypage.language}</span>
            </div>
            <span style={{ fontSize: "14px", color: "#9ca3af" }}>
              {LANGUAGE_PICKER_ROW_LABEL[language]} ›
            </span>
          </button>
          {onReplayTutorials && (
            <button
              type="button"
              onClick={onReplayTutorials}
              style={{
                width: "100%",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "none",
                border: "none",
                borderTop: "1px solid #f3f4f6",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>💡</span>
                <span style={{ fontSize: "15px", color: "#374151" }}>{t.mypage.tutorialReplay}</span>
              </div>
              <span style={{ fontSize: "14px", color: "#9ca3af" }}>›</span>
            </button>
          )}
        </div>

        {onResetPlayerProgressDev && (
          <div
            style={{
              marginTop: "12px",
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "16px 14px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              border: "1px dashed #d4d4d8",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "#9ca3af",
                letterSpacing: "0.06em",
                marginBottom: "6px",
              }}
            >
              {t.mypage.developerToolsSection}
            </p>
            <p style={{ fontSize: "11px", color: "#6b7280", lineHeight: 1.65, marginBottom: "12px" }}>
              {t.mypage.developerQuestResetHelp}
            </p>
            <button
              type="button"
              onClick={async () => {
                if (typeof window !== "undefined" && !window.confirm(t.mypage.developerQuestResetConfirm)) {
                  return;
                }
                await onResetPlayerProgressDev();
              }}
              style={{
                width: "100%",
                borderRadius: "12px",
                border: "1px solid #fecdd3",
                backgroundColor: "#fdf2f8",
                color: "#9d174d",
                padding: "10px 14px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.mypage.developerQuestResetButton}
            </button>
          </div>
        )}
      </div>
    </>
  );

  const showSubPanelLayer =
    panel === "history" || panel === "favorites" || panel === "settings" || panel === "cosmetics";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {xpGainOverlay ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={t.mypage.playerRewardTapToContinue}
          onClick={dismissXpGainOverlay}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              dismissXpGainOverlay();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 84,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(15, 23, 42, 0.12)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "min(300px, calc(100vw - 40px))",
              padding: "22px 20px 16px",
              borderRadius: "22px",
              background: "linear-gradient(145deg, #ffffff 0%, #fff5f8 45%, #fdf3f5 100%)",
              border: "2px solid #f7dfe5",
              boxShadow:
                "0 12px 40px rgba(232, 143, 163, 0.35), 0 0 0 1px rgba(255,255,255,0.8) inset, 0 0 48px rgba(243, 167, 184, 0.25)",
              textAlign: "center",
              overflow: "hidden",
              transform: "translate(-50%, -50%)",
              animation: "trad-trav-xp-card-enter 0.65s cubic-bezier(0.34, 1.2, 0.64, 1) forwards",
              pointerEvents: "none",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.85) 50%, transparent 60%)",
                animation: "trad-trav-xp-shine-sweep 1.1s ease-out 0.15s forwards",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "6px",
                fontSize: "22px",
                lineHeight: 1,
              }}
              aria-hidden
            >
              <span style={{ animation: "trad-trav-xp-sparkle 0.9s ease-in-out infinite" }}>
                {t.mypage.playerXpGainSparkle}
              </span>
              <span style={{ animation: "trad-trav-xp-sparkle 0.9s ease-in-out 0.12s infinite" }}>
                {t.mypage.playerXpGainSparkle}
              </span>
              <span style={{ animation: "trad-trav-xp-sparkle 0.9s ease-in-out 0.24s infinite" }}>
                {t.mypage.playerXpGainSparkle}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "42px",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                background: "linear-gradient(135deg, #e88fa3 0%, #d4728a 50%, #b85f74 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1.1,
                textShadow: "0 2px 16px rgba(232, 143, 163, 0.25)",
              }}
            >
              +{xpGainOverlay.xp}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "13px", fontWeight: 800, color: "#b85f74", lineHeight: 1.4 }}>
              {t.mypage.playerXpGainLine}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "12px", fontWeight: 700, color: "#9ca3af", lineHeight: 1.45 }}>
              {t.mypage.playerQuestClaimToast.replace("{n}", String(xpGainOverlay.xp))}
            </p>
            <p
              style={{
                margin: "14px 0 0",
                paddingTop: "12px",
                borderTop: "1px dashed #f3d1da",
                fontSize: "12px",
                fontWeight: 700,
                color: "#e88fa3",
                letterSpacing: "0.04em",
              }}
            >
              {t.mypage.playerRewardTapToContinue}
            </p>
          </div>
        </div>
      ) : null}
      {levelUpOverlay != null ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={t.mypage.playerRewardTapToContinue}
          onClick={dismissLevelUpOverlay}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              dismissLevelUpOverlay();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 86,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(15, 23, 42, 0.18)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "200px",
              height: "200px",
              marginTop: "-100px",
              marginLeft: "-100px",
              borderRadius: "50%",
              background: "conic-gradient(from 0deg, transparent, rgba(232,143,163,0.12), transparent, rgba(243,167,184,0.15), transparent)",
              animation: "trad-trav-level-up-rays 2.2s ease-out forwards",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "min(320px, calc(100vw - 36px))",
              padding: "26px 22px 24px",
              borderRadius: "24px",
              background: "linear-gradient(165deg, #ffffff 0%, #fff8fa 40%, #fdf3f5 100%)",
              border: "2px solid #f3b6c3",
              boxShadow: "0 16px 48px rgba(232, 143, 163, 0.4)",
              textAlign: "center",
              transform: "translate(-50%, -50%)",
              animation: "trad-trav-level-up-card 0.75s cubic-bezier(0.34, 1.45, 0.64, 1) forwards",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: 900,
                letterSpacing: language === "en" ? "0.28em" : "0.12em",
                color: "#e88fa3",
                ...(language === "en" ? { textTransform: "uppercase" as const } : {}),
              }}
            >
              {t.mypage.playerLevelUpTitle}
            </p>
            <p
              style={{
                margin: "14px 0 0",
                fontSize: "44px",
                fontWeight: 900,
                lineHeight: 1,
                color: "#111827",
                letterSpacing: "-0.02em",
              }}
            >
              Lv.{levelUpOverlay.level}
            </p>
            <p style={{ margin: "12px 0 0", fontSize: "14px", fontWeight: 700, color: "#b85f74", lineHeight: 1.5 }}>
              {t.mypage.playerLevelUpSubtitle}
            </p>
            <p
              style={{
                margin: "14px 0 0",
                fontSize: "16px",
                fontWeight: 900,
                color: "#b45309",
                lineHeight: 1.4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <span aria-hidden>🪙</span>
              {t.mypage.playerLevelUpCoins.replace("{n}", String(levelUpOverlay.coinsEarned))}
            </p>
            <p
              style={{
                margin: "16px 0 0",
                paddingTop: "14px",
                borderTop: "1px dashed #f3b6c3",
                fontSize: "12px",
                fontWeight: 700,
                color: "#e88fa3",
                letterSpacing: "0.04em",
              }}
            >
              {t.mypage.playerRewardTapToContinue}
            </p>
          </div>
        </div>
      ) : null}
      {showSubPanelLayer && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fdf3f5",
            transform: subPanelEntered ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.36s cubic-bezier(0.32, 0.72, 0, 1)",
            willChange: "transform",
            boxShadow: subPanelEntered ? "-8px 0 32px rgba(232, 143, 163, 0.18)" : "none",
          }}
          onTransitionEnd={handleSubPanelTransitionEnd}
        >
      {panel === "history" && (
        <>
          <MypageSubHeader
            title={t.mypage.viewHistory}
            onBack={beginCloseSubPanel}
          />
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 100px" }}>
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              }}
            >
              {viewHistory.length > 0 ? (
                viewHistory.map((item, index) => (
                  <button
                    key={`${item.id}-${item.date}`}
                    type="button"
                    onClick={() => {
                      onJumpToSpot?.(item.id, item.name);
                      setSubPanelEntered(false);
                      setPanel("main");
                    }}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderBottom: index < viewHistory.length - 1 ? "1px solid #f3f4f6" : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "none",
                      border: "none",
                      cursor: onJumpToSpot ? "pointer" : "default",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: "500", color: "#374151" }}>{item.name}</p>
                      <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        {item.category} • {item.date}
                      </p>
                    </div>
                    <span style={{ fontSize: "20px", color: onJumpToSpot ? "#e88fa3" : "#d1d5db" }}>›</span>
                  </button>
                ))
              ) : (
                <div style={{ padding: "24px", textAlign: "center" }}>
                  <p style={{ color: "#9ca3af", fontSize: "14px" }}>{t.mypage.noHistory}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {panel === "favorites" && (
        <>
          <MypageSubHeader
            title={t.mypage.favorites}
            onBack={beginCloseSubPanel}
          />
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 100px" }}>
            {totalFavoritesCount === 0 ? (
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>{t.mypage.noFavorites}</p>
              </div>
            ) : (
              <>
                <section style={{ marginBottom: "20px" }}>
                  <h2
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#b85f74",
                      margin: "0 0 8px 4px",
                    }}
                  >
                    {t.mypage.favoriteSectionSpots}
                  </h2>
                  <div
                    style={{
                      backgroundColor: "white",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                    }}
                  >
                    {favoriteDisplayRows.length > 0 ? (
                      favoriteDisplayRows.map((row, index) => (
                        <div
                          key={row.id}
                          style={{
                            display: "flex",
                            alignItems: "stretch",
                            borderBottom: index < favoriteDisplayRows.length - 1 ? "1px solid #f3f4f6" : "none",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onJumpToSpot?.(row.id, row.name);
                              setSubPanelEntered(false);
                              setPanel("main");
                            }}
                            style={{
                              flex: 1,
                              padding: "16px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "none",
                              border: "none",
                              cursor: onJumpToSpot ? "pointer" : "default",
                              textAlign: "left",
                              minWidth: 0,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <p
                                className="line-clamp-2"
                                style={{ fontSize: "15px", fontWeight: "500", color: "#374151" }}
                              >
                                {row.name}
                              </p>
                              {row.category ? (
                                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{row.category}</p>
                              ) : null}
                            </div>
                            <span
                              style={{ fontSize: "20px", color: onJumpToSpot ? "#e88fa3" : "#d1d5db", flexShrink: 0 }}
                            >
                              ›
                            </span>
                          </button>
                          {onToggleFavorite ? (
                            <button
                              type="button"
                              onClick={() => onToggleFavorite(row.id)}
                              style={{
                                flexShrink: 0,
                                padding: "12px 14px",
                                border: "none",
                                borderLeft: "1px solid #f3f4f6",
                                background: "#fff",
                                color: "#e88fa3",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                alignSelf: "stretch",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {t.mypage.removeFavorite}
                            </button>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: "16px", textAlign: "center" }}>
                        <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>{t.mypage.favoriteSectionEmpty}</p>
                      </div>
                    )}
                  </div>
                </section>

                {(
                  [
                    { title: t.mypage.favoriteSectionManner, keys: mannerFavoriteKeys },
                    { title: t.mypage.favoriteSectionTrivia, keys: triviaFavoriteKeys },
                    { title: t.mypage.favoriteSectionGuide, keys: guideFavoriteKeys },
                  ] as const
                ).map(({ title, keys }) => (
                  <section key={title} style={{ marginBottom: "20px" }}>
                    <h2
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "#b85f74",
                        margin: "0 0 8px 4px",
                      }}
                    >
                      {title}
                    </h2>
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "16px",
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      {keys.length > 0 ? (
                        keys.map((favoriteKey, index) => {
                          const card = localizeHelpfulCard(favoriteKey, t, language);
                          return (
                            <div
                              key={favoriteKey}
                              style={{
                                display: "flex",
                                alignItems: "stretch",
                                borderBottom: index < keys.length - 1 ? "1px solid #f3f4f6" : "none",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenHelpfulFavorite?.(favoriteKey);
                                  setSubPanelEntered(false);
                                  setPanel("main");
                                }}
                                style={{
                                  flex: 1,
                                  padding: "16px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  background: "none",
                                  border: "none",
                                  cursor: onOpenHelpfulFavorite ? "pointer" : "default",
                                  textAlign: "left",
                                  minWidth: 0,
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <p
                                    className="line-clamp-2"
                                    style={{ fontSize: "15px", fontWeight: "500", color: "#374151" }}
                                  >
                                    {card.title}
                                  </p>
                                  {card.subtitle ? (
                                    <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                                      {card.subtitle}
                                    </p>
                                  ) : null}
                                </div>
                                <span
                                  style={{
                                    fontSize: "20px",
                                    color: onOpenHelpfulFavorite ? "#e88fa3" : "#d1d5db",
                                    flexShrink: 0,
                                  }}
                                >
                                  ›
                                </span>
                              </button>
                              {onToggleHelpfulFavorite ? (
                                <button
                                  type="button"
                                  onClick={() => onToggleHelpfulFavorite(favoriteKey)}
                                  style={{
                                    flexShrink: 0,
                                    padding: "12px 14px",
                                    border: "none",
                                    borderLeft: "1px solid #f3f4f6",
                                    background: "#fff",
                                    color: "#e88fa3",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    alignSelf: "stretch",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  {t.mypage.removeFavorite}
                                </button>
                              ) : null}
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: "16px", textAlign: "center" }}>
                          <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>{t.mypage.favoriteSectionEmpty}</p>
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {panel === "settings" && (
        <>
          <MypageSubHeader
            title={t.mypage.settings}
            onBack={beginCloseSubPanel}
            backDataTutorialId="mypage.settings-back"
            onTutorialAction={onTutorialAction}
          />
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 100px" }}>{settingsPanelBody}</div>
        </>
      )}

      {panel === "cosmetics" && (
        <>
          <MypageSubHeader title={t.mypage.cosmeticsShopTitle} onBack={beginCloseSubPanel} />
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 100px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "16px",
                padding: "14px 16px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)",
                border: "1px solid #fde68a",
              }}
            >
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#92400e" }}>
                {t.mypage.cosmeticsShopCoinsLabel}
              </p>
              <p style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#b45309", letterSpacing: "0.02em" }}>
                🪙 {cosmeticsCoins}
              </p>
            </div>
            <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: 1.75, margin: "0 0 20px" }}>
              {t.mypage.cosmeticsShopLead}
            </p>
            {(
              [
                { emoji: "🏅", title: t.mypage.cosmeticsShopSectionBadges },
                { emoji: "✨", title: t.mypage.cosmeticsShopSectionTitles },
                { emoji: "🐰", title: t.mypage.cosmeticsShopSectionCharacter },
              ] as const
            ).map((row) => (
              <div
                key={row.title}
                style={{
                  marginBottom: "12px",
                  padding: "16px",
                  borderRadius: "16px",
                  backgroundColor: "white",
                  border: "1px solid #f3f4f6",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "24px" }}>{row.emoji}</span>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#111827" }}>{row.title}</p>
                </div>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#e88fa3" }}>
                  {t.mypage.cosmeticsShopComingSoon}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#6b7280", lineHeight: 1.55 }}>
                  {t.mypage.cosmeticsShopComingSoonHint}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
        </div>
      )}

      {panel === "main" && (
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: "100px" }}>
      {/* ヘッダー */}
      <div
        style={{
          backgroundColor: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
          background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
          minHeight: "92px",
          padding: "0 20px",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 800, textAlign: "center" }}>
          {t.mypage.title}
        </h1>
      </div>

      <div style={{ padding: "20px 24px 0" }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "22px",
            padding: "18px 16px",
            boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
            border: "1px solid #f7dfe5",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}>
              <div
                className={ringPulseOn ? "trad-trav-avatar-ring-pulse-on" : undefined}
                style={{
                  position: "relative",
                  width: RING_SIZE,
                  height: RING_SIZE,
                  borderRadius: "50%",
                }}
                aria-label={t.mypage.playerLevelSummaryAria}
              >
                <svg
                  width={RING_SIZE}
                  height={RING_SIZE}
                  viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                  style={{ position: "absolute", left: 0, top: 0, transform: "rotate(-90deg)" }}
                  aria-hidden
                >
                  <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_R}
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth={6}
                  />
                  <circle
                    key={`xp-ring-${playerLevel}`}
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_R}
                    fill="none"
                    stroke={`url(#${levelRingGradId})`}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringDashOffset}
                    style={{
                      transition: "stroke-dashoffset 1.25s cubic-bezier(0.22, 0.61, 0.36, 1)",
                    }}
                  />
                  <defs>
                    <linearGradient id={levelRingGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#e88fa3" />
                      <stop offset="100%" stopColor="#f3a7b8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    backgroundColor: "#fdf3f5",
                    pointerEvents: "none",
                  }}
                >
                  <DefaultAvatarIcon size={70} backgroundColor="#fdf3f5" silhouetteColor="#f3a7b8" />
                </div>
              </div>
            </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12px", fontWeight: 800, color: "#b85f74", margin: "0 0 4px" }}>
              {t.mypage.playerProgressLevel.replace("{level}", String(playerLevel))}
            </p>
            {isEditingName ? (
              <div style={{ width: "100%" }}>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleConfirmSaveName();
                    }
                  }}
                  disabled={savingName}
                  autoFocus
                  placeholder=""
                  style={{
                    backgroundColor: "#fdf3f5",
                    border: "1px solid #f3d1da",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    color: "#111827",
                    fontSize: "18px",
                    fontWeight: "600",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "10px",
                  }}
                >
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={() => void handleConfirmSaveName()}
                    style={{
                      border: "none",
                      background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
                      color: "white",
                      borderRadius: "10px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: savingName ? "default" : "pointer",
                      opacity: savingName ? 0.7 : 1,
                    }}
                  >
                    {savingName ? t.common.loading : t.common.save}
                  </button>
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={handleCancelNameEdit}
                    style={{
                      border: "1px solid #e5e7eb",
                      background: "white",
                      color: "#374151",
                      borderRadius: "10px",
                      padding: "8px 16px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: savingName ? "default" : "pointer",
                    }}
                  >
                    {t.common.cancel}
                  </button>
                </div>
                {saveNameError ? (
                  <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px", marginBottom: 0 }}>
                    {saveNameError}
                  </p>
                ) : null}
              </div>
            ) : resolvedDisplayName || user ? (
              <button
                type="button"
                onClick={beginEditName}
                style={{
                  background: "none",
                  border: "none",
                  color: "#111827",
                  fontSize: "18px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: 0,
                }}
              >
                {resolvedDisplayName || (user ? t.mypage.guest : "")}
                <span style={{ fontSize: "14px", opacity: 0.7 }}>✏️</span>
              </button>
            ) : null}
            {user ? (
              <p style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>
                {t.mypage.accountDisplayNameLabel}
              </p>
            ) : null}
          </div>
          </div>

          <div
            style={{
              marginTop: "14px",
              paddingTop: "14px",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#1f2937", margin: "0 0 6px" }}>
              {t.mypage.playerXpToNext.replace("{n}", String(xpToNextLevel))}
            </p>
            <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>
              {t.mypage.playerXpCurrent.replace("{xp}", String(playerProgress.xp))}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
          {[
            {
              label: t.mypage.menuHistory,
              icon: <ClockIcon size={18} color="white" />,
              onClick: () => setPanel("history"),
            },
            {
              label: t.mypage.favorites,
              icon: <HeartIcon size={18} color="white" />,
              onClick: () => setPanel("favorites"),
            },
            {
              label: t.mypage.menuDiagnosis,
              icon: <PenIcon size={18} color="white" />,
              onClick: () => onStartDiagnosis?.(),
            },
            {
              label: t.mypage.menuSettings,
              icon: <GearIcon size={18} color="white" />,
              onClick: () => {
                onTutorialAction?.("mypage.settings-entry");
                setPanel("settings");
              },
              tutorialId: "mypage.settings-entry" as const,
            },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              data-tutorial-id={"tutorialId" in item ? item.tutorialId : undefined}
              onClick={item.onClick}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "999px",
                  backgroundColor: "#f28ca3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                {item.icon}
              </div>
              <p style={{ fontSize: "11px", color: "#1f2937", fontWeight: 600 }}>{item.label}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          data-tutorial-id="mypage.cosmetics-entry"
          onClick={() => {
            onTutorialAction?.("mypage.cosmetics-entry");
            setPanel("cosmetics");
          }}
          style={{
            width: "100%",
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            padding: "14px 16px",
            borderRadius: "18px",
            border: "2px solid #f7dfe5",
            background: "linear-gradient(135deg, #ffffff 0%, #fff5f8 55%, #fdf3f5 100%)",
            boxShadow: "0 4px 16px rgba(232, 143, 163, 0.15)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <span
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                flexShrink: 0,
              }}
              aria-hidden
            >
              🎀
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#b85f74", lineHeight: 1.3 }}>
                {t.mypage.cosmeticsShopButton}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#6b7280", lineHeight: 1.45 }}>
                {t.mypage.cosmeticsShopButtonSub}
              </p>
            </div>
          </div>
          <div
            style={{
              flexShrink: 0,
              padding: "6px 12px",
              borderRadius: "999px",
              backgroundColor: "rgba(254, 243, 199, 0.95)",
              border: "1px solid #fde68a",
              fontSize: "13px",
              fontWeight: 800,
              color: "#b45309",
            }}
          >
            🪙 {cosmeticsCoins}
          </div>
        </button>
      </div>

      <div style={{ padding: "24px 24px 16px" }}>
        <div
          data-tutorial-id="mypage.quest-section"
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "16px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            border: "1px solid #f3f4f6",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "10px",
            }}
          >
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#111827", margin: 0 }}>
              {t.mypage.playerQuestsTitle}
            </h2>
            <div
              role="tablist"
              aria-label={t.mypage.playerQuestsTitle}
              style={{
                display: "flex",
                borderRadius: "10px",
                backgroundColor: "#f3f4f6",
                padding: "3px",
                gap: "2px",
                flexShrink: 0,
              }}
            >
              {(
                [
                  {
                    id: "daily" as const,
                    label: t.mypage.playerQuestTabDaily,
                    showBadge: questUnclaimedBadges.dailyUnclaimed > 0,
                  },
                  {
                    id: "normal" as const,
                    label: t.mypage.playerQuestTabNormal,
                    showBadge: questUnclaimedBadges.normalUnclaimed > 0,
                  },
                ] as const
              ).map(({ id, label, showBadge }) => {
                const selected = questCategory === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setQuestCategory(id)}
                    style={{
                      position: "relative",
                      border: "none",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      fontSize: "10px",
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      maxWidth: "132px",
                      lineHeight: 1.25,
                      backgroundColor: selected ? "white" : "transparent",
                      color: selected ? "#b85f74" : "#6b7280",
                      boxShadow: selected ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    {label}
                    {showBadge ? (
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          top: "3px",
                          right: "4px",
                          width: "7px",
                          height: "7px",
                          borderRadius: "999px",
                          backgroundColor: "#ef4444",
                          border: "1px solid white",
                          boxShadow: "0 0 0 1px rgba(239,68,68,0.35)",
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {questRowsSorted.map(({ quest, done, rewardClaimed, current, target }) => {
              const byId = t.mypage.questById[quest.id as keyof typeof t.mypage.questById];
              const title =
                typeof byId === "string" ? byId : language === "ja" ? quest.labelJa : quest.labelEn;
              const showCounter =
                quest.kind.type === "spot_views" ||
                quest.kind.type === "daily_spot_views" ||
                quest.kind.type === "favorites" ||
                quest.kind.type === "tutorials_all" ||
                (quest.kind.type === "diagnosis" && !done);
              const progressLabel = t.mypage.playerQuestProgress
                .replace("{current}", String(current))
                .replace("{target}", String(target));
              const isSaved = rewardClaimed;
              return (
                <div
                  key={quest.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "14px",
                    border: isSaved ? "1px solid #e5e7eb" : done ? "1px solid #f7dfe5" : "1px solid #f3f4f6",
                    backgroundColor: isSaved ? "#f3f4f6" : done ? "#fdf3f5" : "#fafafa",
                    opacity: isSaved ? 0.92 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: isSaved ? "#6b7280" : "#1f2937",
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {title}
                    </p>
                    {showCounter && !done && (
                      <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px", marginBottom: 0 }}>
                        {progressLabel}
                      </p>
                    )}
                    {!isSaved && !done && (
                      <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px", marginBottom: 0 }}>
                        {t.mypage.playerQuestXpReward.replace("{xp}", String(quest.xpReward))}
                      </p>
                    )}
                    {!isSaved && done && (
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#b85f74",
                          marginTop: "6px",
                          marginBottom: 0,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {t.mypage.playerQuestClaimablePoints.replace("{xp}", String(quest.xpReward))}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                    {isSaved ? (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#6b7280",
                          backgroundColor: "#e5e7eb",
                          padding: "4px 10px",
                          borderRadius: "999px",
                          border: "1px solid #d1d5db",
                        }}
                      >
                        {t.mypage.playerQuestDoneSaved}
                      </span>
                    ) : done ? (
                      <button
                        type="button"
                        disabled={!onClaimQuest}
                        onClick={() => {
                          setXpGainOverlay({ xp: quest.xpReward });
                          onClaimQuest?.(quest.id);
                        }}
                        style={{
                          border: "none",
                          borderRadius: "999px",
                          padding: "6px 14px",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: onClaimQuest ? "pointer" : "default",
                          opacity: onClaimQuest ? 1 : 0.5,
                          background: "linear-gradient(135deg, #e88fa3 0%, #f3a7b8 100%)",
                          color: "white",
                          boxShadow: onClaimQuest ? "0 1px 4px rgba(232,143,163,0.45)" : "none",
                        }}
                      >
                        {t.mypage.playerQuestDone}
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "#9ca3af",
                          backgroundColor: "#f3f4f6",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        {t.mypage.playerQuestStatusIncomplete}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ログイン / ログアウトボタン */}
      <div style={{ padding: "0 24px 40px" }}>
        {user ? (
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #fecdd3",
              backgroundColor: "#fdf3f5",
              color: "#e11d48",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            {t.mypage.logout}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              type="button"
              data-tutorial-id="mypage.login-cta"
              onClick={() => {
                onTutorialAction?.("mypage.login-cta");
                onLoginRequest?.();
              }}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #e88fa3, #f3a7b8)",
                color: "white",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(236, 72, 153, 0.35)",
              }}
            >
              {t.mypage.loginCta}
            </button>
          </div>
        )}
      </div>

        </div>
      )}

      {/* 言語選択モーダル */}
      {showLanguageModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowLanguageModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "20px",
              padding: "24px",
              width: "280px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "20px", textAlign: "center" }}>
              {t.mypage.language}
            </h3>
            
            <button
              onClick={() => {
                setLanguage("ja");
                setShowLanguageModal(false);
              }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: language === "ja" ? "2px solid #e88fa3" : "1px solid #e5e7eb",
                backgroundColor: language === "ja" ? "#fdf3f5" : "white",
                marginBottom: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "15px", color: "#374151" }}>{LANGUAGE_PICKER_ROW_LABEL.ja}</span>
              {language === "ja" && <span style={{ color: "#e88fa3" }}>✓</span>}
            </button>

            <button
              onClick={() => {
                setLanguage("en");
                setShowLanguageModal(false);
              }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: language === "en" ? "2px solid #e88fa3" : "1px solid #e5e7eb",
                backgroundColor: language === "en" ? "#fdf3f5" : "white",
                marginBottom: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "15px", color: "#374151" }}>{LANGUAGE_PICKER_ROW_LABEL.en}</span>
              {language === "en" && <span style={{ color: "#e88fa3" }}>✓</span>}
            </button>

            <button
              onClick={() => {
                setLanguage("zh");
                setShowLanguageModal(false);
              }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: language === "zh" ? "2px solid #e88fa3" : "1px solid #e5e7eb",
                backgroundColor: language === "zh" ? "#fdf3f5" : "white",
                marginBottom: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "15px", color: "#374151" }}>{LANGUAGE_PICKER_ROW_LABEL.zh}</span>
              {language === "zh" && <span style={{ color: "#e88fa3" }}>✓</span>}
            </button>

            <button
              onClick={() => {
                setLanguage("ko");
                setShowLanguageModal(false);
              }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: language === "ko" ? "2px solid #e88fa3" : "1px solid #e5e7eb",
                backgroundColor: language === "ko" ? "#fdf3f5" : "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "15px", color: "#374151" }}>{LANGUAGE_PICKER_ROW_LABEL.ko}</span>
              {language === "ko" && <span style={{ color: "#e88fa3" }}>✓</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default MyPageView;
