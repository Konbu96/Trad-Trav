"use client";

import { useState, useEffect, useRef } from "react";

// 日本の祝日
const HOLIDAYS: Record<string, string> = {
  "2025-01-01": "元日", "2025-01-13": "成人の日", "2025-02-11": "建国記念の日",
  "2025-02-23": "天皇誕生日", "2025-03-20": "春分の日", "2025-04-29": "昭和の日",
  "2025-05-03": "憲法記念日", "2025-05-04": "みどりの日", "2025-05-05": "こどもの日",
  "2025-05-06": "振替休日", "2025-07-21": "海の日", "2025-08-11": "山の日",
  "2025-09-15": "敬老の日", "2025-09-23": "秋分の日", "2025-10-13": "スポーツの日",
  "2025-11-03": "文化の日", "2025-11-23": "勤労感謝の日",
  "2026-01-01": "元日", "2026-01-12": "成人の日", "2026-02-11": "建国記念の日",
  "2026-02-23": "天皇誕生日", "2026-03-20": "春分の日", "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日", "2026-05-04": "みどりの日", "2026-05-05": "こどもの日",
  "2026-07-20": "海の日", "2026-08-11": "山の日", "2026-09-21": "敬老の日",
  "2026-09-23": "秋分の日", "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日", "2026-11-23": "勤労感謝の日",
};

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;      // YYYY-MM-DD (開始日)
  endDate: string;   // YYYY-MM-DD (終了日、同日なら同じ)
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  people: number;
  isReserved: boolean;
  color: string;
  note: string;
}

const COLORS = ["#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
const COLOR_LABELS = ["ブルー", "ピンク", "グリーン", "アンバー", "パープル", "レッド"];
const HOURS = Array.from({ length: 24 }, (_, i) => i + 4); // 4:00〜翌3:00
const DOW = ["月", "火", "水", "木", "金", "土", "日"];
const STORAGE_KEY = "trad-trav-schedule";

function toStr(d: Date) {
  return d.toISOString().split("T")[0];
}
function parseDate(s: string) {
  return new Date(s + "T00:00:00");
}
function formatJa(s: string) {
  const d = parseDate(s);
  const dow = ["日","月","火","水","木","金","土"][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日（${dow}）`;
}
function addDays(s: string, n: number) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
}
function dateInRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}
function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function newEvent(date: string): ScheduleEvent {
  return {
    id: Date.now().toString(),
    title: "",
    date,
    endDate: date,
    startTime: "10:00",
    endTime: "11:00",
    people: 2,
    isReserved: false,
    color: COLORS[0],
    note: "",
  };
}

// ────────────────────────────
// 予定追加シート
// ────────────────────────────
function AddEventSheet({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial: ScheduleEvent;
  onSave: (e: ScheduleEvent) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [ev, setEv] = useState<ScheduleEvent>(initial);
  const [multiDay, setMultiDay] = useState(initial.date !== initial.endDate);
  const isEditing = !!onDelete;

  const set = (k: keyof ScheduleEvent, v: unknown) =>
    setEv(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onClick={onClose} />
      <div style={{
        backgroundColor: "white", borderRadius: "24px 24px 0 0",
        padding: "20px 20px 40px", maxHeight: "85vh", overflowY: "auto",
      }}>
        {/* ハンドル */}
        <div style={{ width: "40px", height: "4px", backgroundColor: "#d1d5db", borderRadius: "9999px", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#1f2937", marginBottom: "20px" }}>
          {isEditing ? "予定を編集" : "予定を追加"}
        </h2>

        {/* タイトル */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px" }}>タイトル</label>
          <input
            type="text"
            value={ev.title}
            onChange={e => set("title", e.target.value)}
            placeholder="例：南部鉄器体験、ホテルチェックイン"
            style={{
              width: "100%", border: "1px solid #d1d5db", borderRadius: "10px",
              padding: "10px 12px", fontSize: "15px", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* 複数日トグル */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>複数日にまたがる（滞在など）</span>
          <button
            onClick={() => {
              const next = !multiDay;
              setMultiDay(next);
              if (!next) set("endDate", ev.date);
            }}
            style={{
              width: "44px", height: "24px", borderRadius: "12px", border: "none",
              backgroundColor: multiDay ? "#3b82f6" : "#d1d5db",
              position: "relative", cursor: "pointer", transition: "background 0.2s",
            }}
          >
            <div style={{
              position: "absolute", top: "2px",
              left: multiDay ? "22px" : "2px",
              width: "20px", height: "20px", borderRadius: "50%",
              backgroundColor: "white", transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </button>
        </div>

        {/* 日付 */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px" }}>
              {multiDay ? "開始日" : "日付"}
            </label>
            <input
              type="date"
              value={ev.date}
              onChange={e => {
                set("date", e.target.value);
                if (!multiDay) set("endDate", e.target.value);
              }}
              style={{
                width: "100%", border: "1px solid #d1d5db", borderRadius: "10px",
                padding: "10px 12px", fontSize: "14px", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          {multiDay && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px" }}>終了日</label>
              <input
                type="date"
                value={ev.endDate}
                min={ev.date}
                onChange={e => set("endDate", e.target.value)}
                style={{
                  width: "100%", border: "1px solid #d1d5db", borderRadius: "10px",
                  padding: "10px 12px", fontSize: "14px", outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>

        {/* 時間（複数日でないとき） */}
        {!multiDay && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px" }}>開始時刻</label>
              <input type="time" value={ev.startTime} onChange={e => set("startTime", e.target.value)}
                style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px" }}>終了時刻</label>
              <input type="time" value={ev.endTime} onChange={e => set("endTime", e.target.value)}
                style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        )}

        {/* 人数 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px" }}>人数</label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => set("people", Math.max(1, ev.people - 1))}
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #d1d5db", background: "white", fontSize: "18px", cursor: "pointer" }}>−</button>
            <span style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937", minWidth: "30px", textAlign: "center" }}>{ev.people}</span>
            <button onClick={() => set("people", Math.min(20, ev.people + 1))}
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #d1d5db", background: "white", fontSize: "18px", cursor: "pointer" }}>＋</button>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>名</span>
          </div>
        </div>

        {/* 予約状況 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "8px" }}>予約状況</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[true, false].map(v => (
              <button
                key={String(v)}
                onClick={() => set("isReserved", v)}
                style={{
                  flex: 1, padding: "8px", borderRadius: "10px", border: "none",
                  cursor: "pointer", fontWeight: "600", fontSize: "13px",
                  backgroundColor: ev.isReserved === v ? (v ? "#dbeafe" : "#fee2e2") : "#f3f4f6",
                  color: ev.isReserved === v ? (v ? "#1d4ed8" : "#b91c1c") : "#6b7280",
                  border: ev.isReserved === v ? `1.5px solid ${v ? "#93c5fd" : "#fca5a5"}` : "1.5px solid transparent",
                }}
              >
                {v ? "✓ 予約済み" : "✗ 未予約"}
              </button>
            ))}
          </div>
        </div>

        {/* 色 */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "8px" }}>色</label>
          <div style={{ display: "flex", gap: "10px" }}>
            {COLORS.map((c, i) => (
              <button
                key={c}
                onClick={() => set("color", c)}
                title={COLOR_LABELS[i]}
                style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  backgroundColor: c, border: "none", cursor: "pointer",
                  boxShadow: ev.color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : "none",
                  transition: "box-shadow 0.15s",
                }}
              />
            ))}
          </div>
        </div>

        {/* ボタン */}
        <div style={{ display: "flex", gap: "10px" }}>
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                padding: "12px 20px", borderRadius: "12px", border: "1px solid #fca5a5",
                backgroundColor: "white", color: "#ef4444", fontSize: "14px", fontWeight: "600", cursor: "pointer",
              }}
            >
              削除
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #d1d5db",
              backgroundColor: "white", color: "#6b7280", fontSize: "14px", fontWeight: "600", cursor: "pointer",
            }}
          >
            キャンセル
          </button>
          <button
            onClick={() => { if (ev.title.trim()) onSave(ev); }}
            disabled={!ev.title.trim()}
            style={{
              flex: 2, padding: "12px", borderRadius: "12px", border: "none",
              backgroundColor: ev.title.trim() ? "#3b82f6" : "#d1d5db",
              color: "white", fontSize: "14px", fontWeight: "bold", cursor: ev.title.trim() ? "pointer" : "default",
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────
// 日ビュー（タイムライン + 編集モード 2秒長押し→ドラッグ選択）
// ────────────────────────────
function DayView({
  date,
  events,
  onBack,
  onEdit,
  onSaveDirect,
}: {
  date: string;
  events: ScheduleEvent[];
  onBack: () => void;
  onAdd: (date: string) => void;
  onEdit: (ev: ScheduleEvent) => void;
  onSaveDirect: (ev: ScheduleEvent) => void;
}) {
  const dayEvents = events.filter(e => dateInRange(date, e.date, e.endDate));
  const SLOT_H = 60;
  const LONG_PRESS_MS = 300;

  const scrollRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef({ active: false, startY: 0, endY: 0, startClientX: 0, startClientY: 0 });

  const [editMode, setEditMode] = useState(false);
  const [highlight, setHighlight] = useState<{ top: number; height: number } | null>(null);
  const [pressPos, setPressPos] = useState<{ x: number; y: number } | null>(null); // 長押し中の表示位置
  const [quickForm, setQuickForm] = useState<{
    startTime: string; endTime: string; isReserved: boolean; title: string; anchorClientY: number;
  } | null>(null);

  const getContentY = (clientY: number) => {
    if (!scrollRef.current) return 0;
    const rect = scrollRef.current.getBoundingClientRect();
    return clientY - rect.top + scrollRef.current.scrollTop - 12;
  };
  const yToTime = (contentY: number): string => {
    const snapped = Math.round(contentY / SLOT_H * 60 / 15) * 15;
    const absMin = Math.max(4 * 60, Math.min(27 * 60 + 45, snapped + 4 * 60));
    return `${String(Math.floor(absMin / 60) % 24).padStart(2, "0")}:${String(absMin % 60).padStart(2, "0")}`;
  };

  const cancelPress = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
    setPressPos(null);
    dragRef.current.active = false;
    setHighlight(null);
  };

  const finalizeDrag = (endY: number, clientY: number) => {
    const { startY } = dragRef.current;
    const top = Math.min(startY, endY);
    const height = Math.abs(endY - startY);
    dragRef.current.active = false;
    // highlight はボックスが閉じるまで維持（保存・キャンセル時に消す）
    if (height < 10) return;
    setQuickForm({
      startTime: yToTime(top), endTime: yToTime(top + height),
      isReserved: false, title: "", anchorClientY: clientY,
    });
  };

  // ── タッチイベント
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // ドラッグ用リスナーが登録中かを追跡（重複防止）
    let draggingListenerActive = false;

    const onTouchMoveTracking = (e: TouchEvent) => {
      const t = e.touches[0];
      const moved = Math.hypot(
        t.clientX - dragRef.current.startClientX,
        t.clientY - dragRef.current.startClientY,
      );
      if (moved > 10) cancelPress();
    };

    const onTouchMoveDragging = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const y = getContentY(t.clientY);
      dragRef.current.endY = y;
      setHighlight({ top: Math.min(dragRef.current.startY, y), height: Math.abs(y - dragRef.current.startY) });
    };

    const switchToDragging = () => {
      if (draggingListenerActive) return;
      el.removeEventListener("touchmove", onTouchMoveTracking);
      el.addEventListener("touchmove", onTouchMoveDragging, { passive: false });
      draggingListenerActive = true;
    };

    const switchToTracking = () => {
      if (!draggingListenerActive) return;
      el.removeEventListener("touchmove", onTouchMoveDragging);
      el.addEventListener("touchmove", onTouchMoveTracking, { passive: true });
      draggingListenerActive = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!editMode) return;
      if ((e.target as HTMLElement).closest("[data-event]")) return;
      e.preventDefault(); // iOS のコールアウト・テキスト選択を防止
      const t = e.touches[0];
      const y = getContentY(t.clientY);
      dragRef.current = { active: false, startY: y, endY: y, startClientX: t.clientX, startClientY: t.clientY };
      setPressPos({ x: t.clientX, y: t.clientY });
      pressTimerRef.current = setTimeout(() => {
        dragRef.current.active = true;
        setPressPos(null);
        setHighlight({ top: y, height: 0 });
        navigator.vibrate?.(40);
        switchToDragging();
      }, LONG_PRESS_MS);
    };

    const onTouchEnd = (e: TouchEvent) => {
      switchToTracking();
      if (!dragRef.current.active) { cancelPress(); return; }
      const t = e.changedTouches[0];
      finalizeDrag(dragRef.current.endY, t.clientY);
    };

    // iOS でシステムが touch を横取りしたときもリセット
    // ただしドラッグ中（active）は無視する
    const onTouchCancel = () => {
      if (dragRef.current.active) return; // ドラッグ中はiOSのtouchcancelを無視
      switchToTracking();
      cancelPress();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false }); // iOSのコールアウト防止のためpassive:false
    el.addEventListener("touchmove", onTouchMoveTracking, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchCancel);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMoveTracking);
      el.removeEventListener("touchmove", onTouchMoveDragging);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, editMode]);

  // ── マウスイベント（2秒長押し後にドラッグ）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return;
    if ((e.target as HTMLElement).closest("[data-event]")) return;
    if (e.button !== 0) return;
    const y = getContentY(e.clientY);
    dragRef.current = { active: false, startY: y, endY: y, startClientX: e.clientX, startClientY: e.clientY };
    setPressPos({ x: e.clientX, y: e.clientY });
    pressTimerRef.current = setTimeout(() => {
      dragRef.current.active = true;
      setPressPos(null);
      setHighlight({ top: y, height: 0 });
      navigator.vibrate?.(40);
    }, LONG_PRESS_MS);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active) {
      if (pressTimerRef.current) {
        const moved = Math.hypot(e.clientX - dragRef.current.startClientX, e.clientY - dragRef.current.startClientY);
        if (moved > 10) cancelPress();
      }
      return;
    }
    const y = getContentY(e.clientY);
    dragRef.current.endY = y;
    setHighlight({ top: Math.min(dragRef.current.startY, y), height: Math.abs(y - dragRef.current.startY) });
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragRef.current.active) { cancelPress(); return; }
    finalizeDrag(dragRef.current.endY, e.clientY);
  };

  const saveQuick = () => {
    if (!quickForm?.title.trim()) return;
    const color = quickForm.isReserved ? "#3b82f6" : "#ef4444";
    onSaveDirect({
      id: Date.now().toString(),
      title: quickForm.title, date, endDate: date,
      startTime: quickForm.startTime, endTime: quickForm.endTime,
      people: 2, isReserved: quickForm.isReserved, color, note: "",
    });
    setQuickForm(null);
    setHighlight(null);
  };

  return (
    <>
      {/* 長押し中のリングアニメーション用スタイル */}
      <style>{`
        @keyframes press-ring {
          0%   { transform: translate(-50%,-50%) scale(0.2); opacity: 0.9; }
          100% { transform: translate(-50%,-50%) scale(1);   opacity: 0; }
        }
        @keyframes press-fill {
          0%   { transform: translate(-50%,-50%) scale(0); }
          100% { transform: translate(-50%,-50%) scale(1); }
        }
      `}</style>

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
        {/* ヘッダー */}
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 20px", paddingTop: "48px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#6b7280", padding: "4px" }}>←</button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "17px", fontWeight: "bold", color: "#1f2937" }}>{formatJa(date)}</h2>
            {HOLIDAYS[date] && (
              <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "600" }}>🎌 {HOLIDAYS[date]}</span>
            )}
          </div>
          <button
            onClick={() => { setEditMode(m => !m); cancelPress(); setQuickForm(null); }}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "7px 14px", borderRadius: "20px", border: "none",
              backgroundColor: editMode ? "#38bdf8" : "#f3f4f6",
              color: editMode ? "white" : "#6b7280",
              fontSize: "12px", fontWeight: "700", cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: editMode ? "0 2px 8px rgba(56,189,248,0.4)" : "none",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {editMode ? "編集中" : "編集"}
          </button>
        </div>

        {/* 編集モードのヒントバー */}
        {editMode && !highlight && !quickForm && (
          <div style={{
            backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a",
            padding: "6px 16px", fontSize: "11px", color: "#92400e", fontWeight: "500",
            textAlign: "center",
          }}>
            ✏️ 長押し → そのままドラッグ → 離すで予定追加
          </div>
        )}

        {/* タイムライン */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: "auto", padding: "12px 0 120px", position: "relative", userSelect: "none", WebkitTouchCallout: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { if (!dragRef.current.active) cancelPress(); }}
          onContextMenu={e => editMode && e.preventDefault()}
        >
          <div style={{ position: "relative" }}>
            {HOURS.flatMap(h => [0, 15, 30, 45].map(m => ({ h, m }))).map(({ h, m }) => {
              const isHour = m === 0;
              const isHalf = m === 30;
              return (
                <div key={`${h}-${m}`} style={{
                  display: "flex", height: `${SLOT_H / 4}px`,
                  borderBottom: isHour ? "1px solid #e5e7eb" : isHalf ? "1px solid #f3f4f6" : "1px dashed #f9fafb",
                }}>
                  <div style={{
                    width: "56px", flexShrink: 0, paddingLeft: "12px",
                    paddingTop: isHour ? "3px" : "1px",
                    fontSize: isHour ? "11px" : "9px",
                    color: isHour ? "#9ca3af" : "#d1d5db", fontWeight: "500",
                  }}>
                    {isHour ? `${String(h % 24).padStart(2, "0")}:00` : isHalf ? ":30" : ""}
                  </div>
                  <div style={{ flex: 1, borderLeft: "1px solid #e5e7eb" }} />
                </div>
              );
            })}

            {/* ドラッグハイライト */}
            {highlight && (
              <div style={{
                position: "absolute", top: `${highlight.top}px`, left: "56px", right: "0",
                height: `${Math.max(highlight.height, 4)}px`,
                backgroundColor: "rgba(56,189,248,0.15)",
                border: "2px solid #38bdf8", borderRadius: "6px",
                pointerEvents: "none", zIndex: 15,
              }}>
                {highlight.height > 18 && (
                  <span style={{ fontSize: "10px", color: "#0369a1", fontWeight: "700", padding: "2px 4px", display: "block" }}>
                    {yToTime(highlight.top)} – {yToTime(highlight.top + highlight.height)}
                  </span>
                )}
              </div>
            )}

            {/* 単日イベントブロック */}
            {dayEvents.filter(e => e.startTime && e.endTime && e.date === e.endDate).map(ev => {
              const startMin = timeToMin(ev.startTime);
              const endMin = timeToMin(ev.endTime);
              const topPx = (startMin - 4 * 60) / 60 * SLOT_H;
              const heightPx = Math.max((endMin - startMin) / 60 * SLOT_H, 24);
              return (
                <button
                  key={ev.id}
                  data-event="true"
                  onClick={() => onEdit(ev)}
                  style={{
                    position: "absolute", top: `${topPx}px`, left: "64px", right: "12px",
                    height: `${heightPx}px`, backgroundColor: ev.color + "22",
                    borderLeft: `4px solid ${ev.color}`, borderRadius: "0 8px 8px 0",
                    padding: "4px 8px", display: "flex", flexDirection: "column",
                    justifyContent: "center", gap: "2px", cursor: "pointer",
                    border: "none", textAlign: "left", zIndex: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: "#1f2937" }}>{ev.title}</span>
                    <span style={{
                      fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px",
                      backgroundColor: ev.isReserved ? "#dbeafe" : "#fee2e2",
                      color: ev.isReserved ? "#1d4ed8" : "#b91c1c",
                    }}>
                      {ev.isReserved ? "予約済 ✓" : "未予約"}
                    </span>
                  </div>
                  {heightPx > 40 && (
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>
                      {ev.startTime}〜{ev.endTime}　{ev.people}名
                    </span>
                  )}
                </button>
              );
            })}

            {/* 複数日イベント */}
            {dayEvents.filter(e => e.date !== e.endDate).map((ev, i) => (
              <button
                key={ev.id + "-multi"}
                data-event="true"
                onClick={() => onEdit(ev)}
                style={{
                  position: "absolute", top: `${4 + i * 28}px`, left: "64px", right: "12px",
                  height: "24px", backgroundColor: ev.color, borderRadius: "6px",
                  padding: "0 8px", display: "flex", alignItems: "center",
                  justifyContent: "space-between", cursor: "pointer", border: "none", zIndex: 20,
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: "600", color: "white" }}>{ev.title}</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.85)", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "3px", padding: "1px 4px" }}>
                  {ev.people}名 {ev.isReserved ? "✓" : ""}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 長押しインジケーター（2秒のリングアニメーション） */}
        {pressPos && (
          <>
            <div style={{
              position: "fixed", left: pressPos.x, top: pressPos.y,
              width: "48px", height: "48px", borderRadius: "50%",
              border: "3px solid #38bdf8",
              animation: `press-ring ${LONG_PRESS_MS}ms ease-out forwards`,
              pointerEvents: "none", zIndex: 300,
            }} />
            <div style={{
              position: "fixed", left: pressPos.x, top: pressPos.y,
              width: "12px", height: "12px", borderRadius: "50%",
              backgroundColor: "#38bdf8",
              animation: `press-fill ${LONG_PRESS_MS}ms ease-out forwards`,
              pointerEvents: "none", zIndex: 300,
            }} />
          </>
        )}

        {/* クイックフォーム */}
        {quickForm && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 150 }}
              onClick={() => { setQuickForm(null); setHighlight(null); setEditMode(false); }}
              position: "fixed",
              top: `${Math.min(Math.max(70, quickForm.anchorClientY - 20), (typeof window !== "undefined" ? window.innerHeight : 700) - 320)}px`,
              right: "12px", width: "250px",
              backgroundColor: "white", borderRadius: "18px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              padding: "16px", zIndex: 160,
            }}>
              {/* 選択範囲の時刻 */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "12px", alignItems: "center" }}>
                <input
                  type="time" value={quickForm.startTime}
                  onChange={e => setQuickForm(q => q ? { ...q, startTime: e.target.value } : null)}
                  style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: "8px", padding: "6px 8px", fontSize: "13px", outline: "none" }}
                />
                <span style={{ color: "#9ca3af", fontSize: "12px" }}>–</span>
                <input
                  type="time" value={quickForm.endTime}
                  onChange={e => setQuickForm(q => q ? { ...q, endTime: e.target.value } : null)}
                  style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: "8px", padding: "6px 8px", fontSize: "13px", outline: "none" }}
                />
              </div>

              {/* タイトル */}
              <input
                autoFocus
                type="text"
                value={quickForm.title}
                onChange={e => setQuickForm(q => q ? { ...q, title: e.target.value } : null)}
                placeholder="タイトルを入力…"
                onKeyDown={e => { if (e.key === "Enter") saveQuick(); if (e.key === "Escape") { setQuickForm(null); setHighlight(null); setEditMode(false); } }}
                style={{
                  width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "10px",
                  padding: "9px 11px", fontSize: "14px", outline: "none",
                  boxSizing: "border-box", marginBottom: "12px",
                }}
                onFocus={e => { e.target.style.borderColor = "#38bdf8"; }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; }}
              />

              {/* 予約状況（色が変わる） */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                {[
                  { label: "🔵 予約済", value: true, bg: "#dbeafe", border: "#3b82f6", color: "#1d4ed8" },
                  { label: "🔴 未予約", value: false, bg: "#fee2e2", border: "#ef4444", color: "#b91c1c" },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setQuickForm(q => q ? { ...q, isReserved: opt.value } : null)}
                    style={{
                      flex: 1, padding: "8px 4px", borderRadius: "10px", cursor: "pointer",
                      fontWeight: "700", fontSize: "12px",
                      backgroundColor: quickForm.isReserved === opt.value ? opt.bg : "#f9fafb",
                      color: quickForm.isReserved === opt.value ? opt.color : "#9ca3af",
                      border: `2px solid ${quickForm.isReserved === opt.value ? opt.border : "transparent"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* ボタン */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => { setQuickForm(null); setHighlight(null); setEditMode(false); }}
                  style={{ flex: 1, padding: "9px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: "13px", cursor: "pointer" }}
                >
                  キャンセル
                </button>
                <button
                  onClick={saveQuick}
                  disabled={!quickForm.title.trim()}
                  style={{
                    flex: 2, padding: "9px", borderRadius: "10px", border: "none",
                    backgroundColor: quickForm.title.trim() ? (quickForm.isReserved ? "#3b82f6" : "#ef4444") : "#d1d5db",
                    color: "white", fontSize: "13px", fontWeight: "bold",
                    cursor: quickForm.title.trim() ? "pointer" : "default",
                    transition: "background-color 0.2s",
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ────────────────────────────
// メインコンポーネント
// ────────────────────────────
export default function ScheduleView() {
  const today = toStr(new Date());
  const [view, setView] = useState<"month" | "day">("month");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [showSheet, setShowSheet] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  // ローカルストレージ読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setEvents(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveEvents = (list: ScheduleEvent[]) => {
    setEvents(list);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  };

  const handleSave = (ev: ScheduleEvent) => {
    const list = events.filter(e => e.id !== ev.id);
    saveEvents([...list, ev]);
    setShowSheet(false);
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    saveEvents(events.filter(e => e.id !== id));
    setShowSheet(false);
    setEditingEvent(null);
  };

  const openAdd = (date: string) => {
    setEditingEvent(newEvent(date));
    setShowSheet(true);
  };

  const openEdit = (ev: ScheduleEvent) => {
    setEditingEvent({ ...ev });
    setShowSheet(true);
  };

  // ────── 月カレンダー計算 ──────
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDow = (currentMonth.getDay() + 6) % 7; // 月曜始まり (0=月)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { dateStr: string; inMonth: boolean }[] = [];
  for (let i = 0; i < firstDow; i++) {
    const d = prevMonthDays - firstDow + 1 + i;
    cells.push({ dateStr: toStr(new Date(year, month - 1, d)), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: toStr(new Date(year, month, d)), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const d = cells.length - firstDow - daysInMonth + 1;
    cells.push({ dateStr: toStr(new Date(year, month + 1, d)), inMonth: false });
  }

  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  // 日付のイベント取得
  const getEventsOn = (dateStr: string) =>
    events.filter(e => dateInRange(dateStr, e.date, e.endDate));

  // ── 月ビュー ──
  const MonthView = () => (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      {/* ヘッダー */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb", padding: "16px 20px", paddingTop: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "#6b7280", padding: "4px 10px" }}>‹</button>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937" }}>
              {year}年 {month + 1}月
            </h1>
          </div>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", color: "#6b7280", padding: "4px 10px" }}>›</button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div style={{ backgroundColor: "white", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #e5e7eb" }}>
        {DOW.map((d, i) => (
          <div key={d} style={{
            textAlign: "center", padding: "6px 0", fontSize: "11px", fontWeight: "700",
            color: i === 5 ? "#3b82f6" : i === 6 ? "#ef4444" : "#6b7280",
          }}>{d}</div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "100px", backgroundColor: "white" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #f3f4f6", position: "relative" }}>
            {/* イベントバー（週をまたぐもの） */}
            {(() => {
              // この週に表示すべき複数日イベント
              const weekStart = week[0].dateStr;
              const weekEnd = week[6].dateStr;
              const multiEvents = events.filter(e =>
                e.date !== e.endDate &&
                e.date <= weekEnd &&
                e.endDate >= weekStart
              );
              return multiEvents.map((ev, ei) => {
                const startInWeek = Math.max(0, week.findIndex(c => c.dateStr === ev.date));
                const evStart = ev.date < weekStart ? 0 : week.findIndex(c => c.dateStr === ev.date);
                const evEnd = ev.endDate > weekEnd ? 6 : week.findIndex(c => c.dateStr === ev.endDate);
                const colStart = evStart === -1 ? 0 : evStart;
                const colEnd = evEnd === -1 ? 6 : evEnd;
                return (
                  <div
                    key={ev.id}
                    onClick={() => openEdit(ev)}
                    style={{
                      position: "absolute",
                      top: `${28 + ei * 16}px`,
                      left: `calc(${colStart / 7 * 100}% + 2px)`,
                      width: `calc(${(colEnd - colStart + 1) / 7 * 100}% - 4px)`,
                      height: "14px",
                      backgroundColor: ev.color,
                      borderRadius: "4px",
                      zIndex: 5,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: "4px",
                    }}
                  >
                    <span style={{ fontSize: "9px", color: "white", fontWeight: "600", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{ev.title}</span>
                  </div>
                );
                void startInWeek;
              });
            })()}

            {week.map((cell, ci) => {
              const dow = ci; // 0=月...6=日
              const isToday = cell.dateStr === today;
              const isHoliday = !!HOLIDAYS[cell.dateStr];
              const dayEvents = getEventsOn(cell.dateStr).filter(e => e.date === e.endDate);
              const isSat = dow === 5;
              const isSun = dow === 6;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => { setSelectedDate(cell.dateStr); setView("day"); }}
                  style={{
                    minHeight: "72px",
                    padding: "4px 2px 2px",
                    cursor: "pointer",
                    opacity: cell.inMonth ? 1 : 0.3,
                    borderRight: ci < 6 ? "1px solid #f3f4f6" : "none",
                    position: "relative",
                  }}
                >
                  {/* 日付番号 */}
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: isToday ? "#3b82f6" : "transparent",
                    fontSize: "12px", fontWeight: isToday ? "bold" : "500",
                    color: isToday ? "white" : isHoliday || isSun ? "#ef4444" : isSat ? "#3b82f6" : "#1f2937",
                    margin: "0 auto",
                  }}>
                    {parseDate(cell.dateStr).getDate()}
                  </div>

                  {/* 祝日マーク */}
                  {isHoliday && cell.inMonth && (
                    <div style={{ textAlign: "center", fontSize: "7px", color: "#ef4444", fontWeight: "600", marginTop: "1px" }}>
                      🎌
                    </div>
                  )}

                  {/* 単日イベントチップ */}
                  <div style={{ marginTop: "2px", display: "flex", flexDirection: "column", gap: "1px" }}>
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} onClick={e => { e.stopPropagation(); openEdit(ev); }} style={{
                        height: "12px", borderRadius: "3px", backgroundColor: ev.color,
                        paddingLeft: "3px", display: "flex", alignItems: "center",
                      }}>
                        <span style={{ fontSize: "8px", color: "white", fontWeight: "600", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {ev.title}
                        </span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span style={{ fontSize: "8px", color: "#9ca3af", paddingLeft: "2px" }}>+{dayEvents.length - 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* + ボタン */}
      <button
        onClick={() => openAdd(today)}
        style={{
          position: "absolute", bottom: "100px", right: "20px",
          width: "52px", height: "52px", borderRadius: "50%",
          backgroundColor: "#3b82f6", border: "none", color: "white",
          fontSize: "28px", cursor: "pointer",
          boxShadow: "0 4px 14px rgba(59,130,246,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 30,
        }}
      >
        ＋
      </button>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {view === "month" && <MonthView />}
      {view === "day" && (
        <DayView
          date={selectedDate}
          events={events}
          onBack={() => setView("month")}
          onAdd={openAdd}
          onEdit={openEdit}
          onSaveDirect={handleSave}
        />
      )}

      {showSheet && editingEvent && (
        <AddEventSheet
          initial={editingEvent}
          onSave={handleSave}
          onDelete={events.some(e => e.id === editingEvent.id) ? () => handleDelete(editingEvent.id) : undefined}
          onClose={() => { setShowSheet(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}
