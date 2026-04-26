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
const THEME_CYCLE: Theme[] = ["light", "dark"];

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
  theme: Theme;
  toggleTheme: () => void;
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

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return "dark";
  });
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

  useEffect(() => {
    const body = document.body;
    body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.toggle("locked", locked);
  }, [locked]);

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
    try { await getCurrentWindow().setFullscreen(false); } catch {}
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

  // Re-enforce fullscreen. ESC or green-button can pop the user out; reeling
  // them back every ~500ms keeps the lock honest.
  useEffect(() => {
    if (!locked) return;
    const win = getCurrentWindow();
    win.setFullscreen(true).catch(() => {});
    enforcementRef.current = window.setInterval(async () => {
      try {
        const fs = await win.isFullscreen();
        if (!fs) await win.setFullscreen(true);
      } catch {}
    }, 500);
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

  function startLock(durationSec: number = DEFAULT_LOCK_DURATION_SEC) {
    if (locked) return;
    localStorage.setItem("hasUsedLock", "1");
    setHasUsedLock(true);
    setSecondsLeft(Math.max(1, Math.floor(durationSec)));
    setLocked(true);
  }

  function toggleTheme() {
    setTheme((t) => {
      const i = THEME_CYCLE.indexOf(t);
      return THEME_CYCLE[(i + 1) % THEME_CYCLE.length];
    });
  }

  return (
    <Ctx.Provider value={{
      theme, toggleTheme,
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
