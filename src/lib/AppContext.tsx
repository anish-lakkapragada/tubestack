import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  loadHistory,
  loadReadLater,
  saveHistory,
  saveReadLater,
} from "./persistence";

type Theme = "light" | "dark";
export type ReaderStyle = "anthropic" | "openai" | "x" | "substack";
export type ReaderSize = "small" | "medium" | "large" | "extra-large";

export const READER_SIZE_SCALE: Record<ReaderSize, number> = {
  small: 0.76,
  medium: 0.88,
  large: 1,
  "extra-large": 1.14,
};

const READER_SIZES: ReaderSize[] = ["small", "medium", "large", "extra-large"];

const READER_LAYOUT = {
  articleWidth: "680px",
  articlePaddingTop: "46px",
} as const;

export interface ReaderStylePreset {
  id: ReaderStyle;
  label: string;
  theme: Theme;
  bg: string;
  text: string;
  muted: string;
  desc: string;
  panel: string;
  chipBg: string;
  chipBgSoft: string;
  border: string;
  inputBorder: string;
  navBg: string;
  navBorder: string;
  fontFamily: string;
  titleFontFamily: string;
  titleWeight: number;
  bodyWeight: number;
  titleSize: string;
  titleLineHeight: string;
  titleLetterSpacing: string;
  bodySize: string;
  bodyLineHeight: string;
  bodyLetterSpacing: string;
  paragraphGap: string;
  articleWidth: string;
  articlePaddingTop: string;
}

export const READER_STYLE_PRESETS: Record<ReaderStyle, ReaderStylePreset> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    theme: "light",
    bg: "#faf9f5",
    text: "#141413",
    muted: "#5e5d59",
    desc: "#6f6e69",
    panel: "#f0eee6",
    chipBg: "#ece9df",
    chipBgSoft: "#f3f1ea",
    border: "#d9d5c9",
    inputBorder: "#aeaca0",
    navBg: "rgba(250, 249, 245, 0.92)",
    navBorder: "#e6e2d6",
    fontFamily: '"anthropicSerif", Georgia, "Times New Roman", serif',
    titleFontFamily: '"anthropicSans", "Helvetica Neue", Arial, sans-serif',
    titleWeight: 600,
    bodyWeight: 400,
    titleSize: "23px",
    titleLineHeight: "1.2",
    titleLetterSpacing: "0",
    bodySize: "17px",
    bodyLineHeight: "1.55",
    bodyLetterSpacing: "0",
    paragraphGap: "17px",
    articleWidth: READER_LAYOUT.articleWidth,
    articlePaddingTop: READER_LAYOUT.articlePaddingTop,
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    theme: "dark",
    bg: "#000000",
    text: "#ffffff",
    muted: "#a7a7a7",
    desc: "#c9c9c9",
    panel: "#101010",
    chipBg: "#191919",
    chipBgSoft: "#0d0d0d",
    border: "#252525",
    inputBorder: "#3a3a3a",
    navBg: "rgba(0, 0, 0, 0.9)",
    navBorder: "#1f1f1f",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    titleFontFamily: '"SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    titleWeight: 700,
    bodyWeight: 400,
    titleSize: "40px",
    titleLineHeight: "1.16",
    titleLetterSpacing: "-0.6px",
    bodySize: "19px",
    bodyLineHeight: "1.62",
    bodyLetterSpacing: "-0.12px",
    paragraphGap: "22px",
    articleWidth: READER_LAYOUT.articleWidth,
    articlePaddingTop: READER_LAYOUT.articlePaddingTop,
  },
  x: {
    id: "x",
    label: "X",
    theme: "dark",
    bg: "#000000",
    text: "#e7e9ea",
    muted: "#71767b",
    desc: "#b9bdc1",
    panel: "#000000",
    chipBg: "#16181c",
    chipBgSoft: "#0f1419",
    border: "#2f3336",
    inputBorder: "#536471",
    navBg: "rgba(0, 0, 0, 0.9)",
    navBorder: "#2f3336",
    fontFamily: '"TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    titleFontFamily: '"TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    titleWeight: 800,
    bodyWeight: 400,
    titleSize: "34px",
    titleLineHeight: "1.294",
    titleLetterSpacing: "0",
    bodySize: "17px",
    bodyLineHeight: "1.647",
    bodyLetterSpacing: "0",
    paragraphGap: "22px",
    articleWidth: READER_LAYOUT.articleWidth,
    articlePaddingTop: READER_LAYOUT.articlePaddingTop,
  },
  substack: {
    id: "substack",
    label: "Substack",
    theme: "dark",
    bg: "#1b1b1b",
    text: "#eeeeee",
    muted: "#a9a9a9",
    desc: "#d8d8d8",
    panel: "#242424",
    chipBg: "#2b2b2b",
    chipBgSoft: "#232323",
    border: "#353535",
    inputBorder: "#555555",
    navBg: "rgba(28, 28, 28, 0.92)",
    navBorder: "#333333",
    fontFamily: '-apple-system-ui-serif, ui-serif, "Spectral", Georgia, serif',
    titleFontFamily: '"SF Pro Display", -apple-system-headline, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    titleWeight: 700,
    bodyWeight: 400,
    titleSize: "30.875px",
    titleLineHeight: "1.16",
    titleLetterSpacing: "0",
    bodySize: "19px",
    bodyLineHeight: "1.58",
    bodyLetterSpacing: "0",
    paragraphGap: "22px",
    articleWidth: READER_LAYOUT.articleWidth,
    articlePaddingTop: READER_LAYOUT.articlePaddingTop,
  },
};

const DEFAULT_READER_STYLE: ReaderStyle = "anthropic";
const DEFAULT_READER_SIZE: ReaderSize = "medium";

export interface HistoryEntry {
  path: string;  // e.g. "/watch?v=abc123"
  title: string;
  ts: number;
}

export interface WatchLaterEntry {
  id: string;
  title: string;
  channelTitle?: string;
  addedAt: number;
}

export type SidebarKey = "history" | "later";

interface AppState {
  readerStyle: ReaderStyle;
  setReaderStyle: (style: ReaderStyle) => void;
  readerSize: ReaderSize;
  setReaderSize: (size: ReaderSize) => void;
  previewReaderStyle?: ReaderStyle;
  previewReader: (preview: { style?: ReaderStyle; size?: ReaderSize }) => void;
  clearReaderPreview: () => void;
  locked: boolean;
  secondsLeft: number;
  hasUsedLock: boolean;
  startLock: (durationSec?: number) => void;
  history: HistoryEntry[];
  logVisit: (entry: Omit<HistoryEntry, "ts">) => void;
  removeHistoryEntry: (path: string, ts: number) => void;
  clearHistory: () => void;
  watchLater: WatchLaterEntry[];
  addToWatchLater: (entry: Omit<WatchLaterEntry, "addedAt">) => void;
  removeFromWatchLater: (id: string) => void;
  clearWatchLater: () => void;
  sidebarOpen: SidebarKey | null;
  toggleSidebar: (which: SidebarKey) => void;
  closeSidebar: () => void;
}

const DEFAULT_LOCK_DURATION_SEC = 5 * 60;
const HISTORY_MAX = 200;
const WATCH_PATH_RE = /^\/watch\?/;

const Ctx = createContext<AppState | null>(null);

async function requestFullscreen() {
  try {
    await getCurrentWindow().unminimize();
  } catch {}

  try {
    await getCurrentWindow().setFocus();
  } catch {}

  try {
    await getCurrentWindow().setFullscreen(true);
    return;
  } catch {}

  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch {}
}

async function exitFullscreen() {
  try {
    await getCurrentWindow().setFullscreen(false);
  } catch {}

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch {}
}

async function isFullscreenNow(): Promise<boolean> {
  try {
    if (await getCurrentWindow().isFullscreen()) return true;
  } catch {}
  const widthLooksFullscreen = window.innerWidth >= screen.availWidth - 8 || window.innerWidth >= screen.width - 8;
  const heightLooksFullscreen = window.innerHeight >= screen.availHeight - 8 || window.innerHeight >= screen.height - 8;
  if (widthLooksFullscreen && heightLooksFullscreen) return true;
  return !!document.fullscreenElement;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [readerStyle, setReaderStyleState] = useState<ReaderStyle>(() => {
    try {
      const saved = localStorage.getItem("readerStyle") as ReaderStyle | null;
      return saved && saved in READER_STYLE_PRESETS ? saved : DEFAULT_READER_STYLE;
    } catch {
      return DEFAULT_READER_STYLE;
    }
  });
  const [readerSize, setReaderSizeState] = useState<ReaderSize>(() => {
    try {
      const saved = localStorage.getItem("readerSize") as ReaderSize | null;
      return saved && saved in READER_SIZE_SCALE ? saved : DEFAULT_READER_SIZE;
    } catch {
      return DEFAULT_READER_SIZE;
    }
  });
  const [readerPreview, setReaderPreview] = useState<{ style?: ReaderStyle; size?: ReaderSize } | null>(null);
  const [locked, setLocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [hasUsedLock, setHasUsedLock] = useState(() => localStorage.getItem("hasUsedLock") === "1");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [watchLater, setWatchLater] = useState<WatchLaterEntry[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<SidebarKey | null>(null);

  // First mount: pull both lists off disk in parallel. Filter out non-watch
  // history entries that may have leaked in from earlier versions.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadHistory<HistoryEntry>(),
      loadReadLater<WatchLaterEntry>(),
    ]).then(([h, w]) => {
      if (cancelled) return;
      setHistory(h.filter((entry) => WATCH_PATH_RE.test(entry.path)));
      setWatchLater(w);
      setStorageReady(true);
    }).catch(() => {
      if (!cancelled) setStorageReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Once storage is loaded, mirror in-memory changes back to disk.
  // Skipping while !storageReady prevents the initial empty state from
  // overwriting real data on slow disks.
  useEffect(() => {
    if (!storageReady) return;
    void saveHistory(history);
  }, [history, storageReady]);
  useEffect(() => {
    if (!storageReady) return;
    void saveReadLater(watchLater);
  }, [watchLater, storageReady]);

  function logVisit(entry: Omit<HistoryEntry, "ts">) {
    if (!WATCH_PATH_RE.test(entry.path)) return;
    setHistory((prev) => {
      const ts = Date.now();
      // Replace the head if it's the same path — updates title/ts without duplicating.
      if (prev[0]?.path === entry.path) {
        const next = prev.slice();
        next[0] = { ...entry, ts };
        return next;
      }
      return [{ ...entry, ts }, ...prev].slice(0, HISTORY_MAX);
    });
  }
  function removeHistoryEntry(path: string, ts: number) {
    setHistory((prev) => prev.filter((e) => !(e.path === path && e.ts === ts)));
  }
  function clearHistory() { setHistory([]); }

  function addToWatchLater(entry: Omit<WatchLaterEntry, "addedAt">) {
    setWatchLater((prev) => {
      if (prev.some((e) => e.id === entry.id)) return prev;
      return [{ ...entry, addedAt: Date.now() }, ...prev];
    });
  }
  function removeFromWatchLater(id: string) {
    setWatchLater((prev) => prev.filter((e) => e.id !== id));
  }
  function clearWatchLater() { setWatchLater([]); }

  function toggleSidebar(which: SidebarKey) {
    setSidebarOpen((prev) => (prev === which ? null : which));
  }
  function closeSidebar() { setSidebarOpen(null); }

  // Refs so unlock() can stop intervals *before* the React cleanup would —
  // otherwise the fullscreen-enforcement tick races setFullscreen(false) and
  // the window briefly shrinks, flashes, and re-expands.
  const enforcementRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const wasFullscreenBeforeLockRef = useRef(false);
  const lockEnteredFullscreenRef = useRef(false);

  useEffect(() => {
    const effectiveStyle = readerPreview?.style ?? readerStyle;
    const effectiveSize = readerPreview?.size ?? readerSize;
    const preset = READER_STYLE_PRESETS[effectiveStyle];
    const body = document.body;
    body.classList.toggle("dark", preset.theme === "dark");
    body.dataset.readerStyle = effectiveStyle;
    const sizeScale = READER_SIZE_SCALE[effectiveSize];
    document.documentElement.style.fontSize = `${16 * sizeScale}px`;
    body.style.setProperty("--bg", preset.bg);
    body.style.setProperty("--text", preset.text);
    body.style.setProperty("--muted", preset.muted);
    body.style.setProperty("--desc", preset.desc);
    body.style.setProperty("--panel", preset.panel);
    body.style.setProperty("--chip-bg", preset.chipBg);
    body.style.setProperty("--chip-bg-soft", preset.chipBgSoft);
    body.style.setProperty("--border", preset.border);
    body.style.setProperty("--input-border", preset.inputBorder);
    body.style.setProperty("--nav-bg", preset.navBg);
    body.style.setProperty("--nav-border", preset.navBorder);
    body.style.setProperty("--app-font-family", preset.fontFamily);
    body.style.setProperty("--reader-title-font-family", preset.titleFontFamily);
    body.style.setProperty("--reader-title-weight", String(preset.titleWeight));
    body.style.setProperty("--reader-body-weight", String(preset.bodyWeight));
    body.style.setProperty("--reader-title-size", preset.titleSize);
    body.style.setProperty("--reader-title-line-height", preset.titleLineHeight);
    body.style.setProperty("--reader-title-letter-spacing", preset.titleLetterSpacing);
    body.style.setProperty("--reader-body-size", preset.bodySize);
    body.style.setProperty("--reader-body-line-height", preset.bodyLineHeight);
    body.style.setProperty("--reader-body-letter-spacing", preset.bodyLetterSpacing);
    body.style.setProperty("--reader-paragraph-gap", preset.paragraphGap);
    body.style.setProperty("--reader-article-width", preset.articleWidth);
    body.style.setProperty("--reader-article-padding-top", preset.articlePaddingTop);
    body.style.setProperty("--reader-size-scale", String(sizeScale));
  }, [readerStyle, readerSize, readerPreview]);

  useEffect(() => {
    localStorage.setItem("readerStyle", readerStyle);
    localStorage.setItem("readerSize", readerSize);
  }, [readerStyle, readerSize]);

  useEffect(() => {
    document.body.classList.toggle("locked", locked);
  }, [locked]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isIncrease = e.metaKey
        && e.shiftKey
        && (e.key === "+" || e.key === "=" || e.code === "Equal" || e.code === "NumpadAdd");
      const isDecrease = e.metaKey
        && e.shiftKey
        && (e.key === "-" || e.key === "_" || e.code === "Minus" || e.code === "NumpadSubtract");
      if (!isIncrease && !isDecrease) return;
      e.preventDefault();
      const index = READER_SIZES.indexOf(readerSize);
      const next = isIncrease
        ? READER_SIZES[Math.min(index + 1, READER_SIZES.length - 1)]
        : READER_SIZES[Math.max(index - 1, 0)];
      if (next !== readerSize) {
        setReaderPreview(null);
        setReaderSizeState(next);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [readerSize]);

  async function unlockInternal() {
    // Stop enforcement *first* so no setFullscreen(true) can fire after we
    // leave fullscreen. Then drop fullscreen and wait for it to actually land
    // before flipping the locked flag — that way React doesn't rerender mid
    // animation and there's no window-size flash.
    if (enforcementRef.current !== null) {
      clearInterval(enforcementRef.current);
      enforcementRef.current = null;
    }
    if (countdownRef.current !== null) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (lockEnteredFullscreenRef.current) {
      await exitFullscreen();
    }
    wasFullscreenBeforeLockRef.current = false;
    lockEnteredFullscreenRef.current = false;
    setLocked(false);
    setSecondsLeft(0);
  }

  // Countdown timer.
  useEffect(() => {
    if (!locked) return;
    countdownRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          void unlockInternal();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current !== null) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [locked]);

  // Re-enforce fullscreen. ESC, minimize, or the green button can pop the user
  // out; snap back quickly so lock mode does not sit minimized.
  useEffect(() => {
    if (!locked) return;
    const enforce = async () => {
      await requestFullscreen();
    };
    enforce();
    enforcementRef.current = window.setInterval(async () => {
      await enforce();
    }, 100);
    return () => {
      if (enforcementRef.current !== null) {
        clearInterval(enforcementRef.current);
        enforcementRef.current = null;
      }
    };
  }, [locked]);

  // Swallow backspace + a handful of "escape the app" shortcuts during lock.
  useEffect(() => {
    if (!locked) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "Backspace" || k === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.metaKey && (k === "ArrowLeft" || k === "[" || k === "w" || k === "W")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [locked]);

  async function beginLock(durationSec: number) {
    const wasFullscreen = await isFullscreenNow();
    wasFullscreenBeforeLockRef.current = wasFullscreen;
    lockEnteredFullscreenRef.current = false;
    setSecondsLeft(Math.max(1, Math.floor(durationSec)));
    await requestFullscreen();
    lockEnteredFullscreenRef.current = !wasFullscreen && await isFullscreenNow();
    setLocked(true);
  }

  function startLock(durationSec: number = DEFAULT_LOCK_DURATION_SEC) {
    if (locked) return;
    localStorage.setItem("hasUsedLock", "1");
    setHasUsedLock(true);
    void beginLock(durationSec);
  }

  function setReaderStyle(style: ReaderStyle) {
    setReaderPreview(null);
    setReaderStyleState(style);
  }

  function setReaderSize(size: ReaderSize) {
    setReaderPreview(null);
    setReaderSizeState(size);
  }

  function previewReader(preview: { style?: ReaderStyle; size?: ReaderSize }) {
    setReaderPreview(preview);
  }

  function clearReaderPreview() {
    setReaderPreview(null);
  }

  return (
    <Ctx.Provider value={{
      readerStyle, setReaderStyle, readerSize, setReaderSize, previewReaderStyle: readerPreview?.style, previewReader, clearReaderPreview,
      locked, secondsLeft, hasUsedLock, startLock,
      history, logVisit, removeHistoryEntry, clearHistory,
      watchLater, addToWatchLater, removeFromWatchLater, clearWatchLater,
      sidebarOpen, toggleSidebar, closeSidebar,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// Called from pages to log a visit once their title is known (titles like video
// names arrive async, so we wait for them before committing the entry).
export function useLogVisit(title: string | null) {
  const { logVisit } = useApp();
  const location = useLocation();
  useEffect(() => {
    if (!title) return;
    logVisit({ path: location.pathname + location.search, title });
  }, [title, location.pathname, location.search]);
}
