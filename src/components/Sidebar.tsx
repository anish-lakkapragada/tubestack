import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appDataDir, dirname, join } from "@tauri-apps/api/path";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import { useApp } from "../lib/AppContext";
import { STORAGE_FILES } from "../lib/persistence";

// Short date like "apr 23" / "mar 3" / "jan 2024" for older years.
function shortDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function relLabel(ts: number): string {
  const d = new Date(ts); d.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return shortDate(ts);
}

function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).toLowerCase();
}

function BookmarkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

interface SidebarFrameProps {
  title: string;
  description: string;
  storageFile: string;
  storageLabel: string;
  onClose: () => void;
  children: ReactNode;
}

function SidebarFrame({ title, description, storageFile, storageLabel, onClose, children }: SidebarFrameProps) {
  const [closing, setClosing] = useState(false);
  const [storagePath, setStoragePath] = useState("");

  function closeWithAnimation() {
    setClosing(true);
    window.setTimeout(onClose, 220);
  }

  useEffect(() => {
    let cancelled = false;
    async function resolveStoragePath() {
      try {
        const dir = await appDataDir();
        const path = await join(dir, storageFile);
        if (!cancelled) setStoragePath(path);
      } catch {
        if (!cancelled) setStoragePath(storageFile);
      }
    }
    void resolveStoragePath();
    return () => { cancelled = true; };
  }, [storageFile]);

  async function openStorageLocation() {
    if (!storagePath) return;
    try {
      await revealItemInDir(storagePath);
    } catch {
      try {
        await openPath(await dirname(storagePath));
      } catch {}
    }
  }

  return (
    <>
      <div className={`sidebar-scrim ${closing ? "closing" : ""}`} onClick={closeWithAnimation} />
      <aside className={`sidebar ${closing ? "closing" : ""}`}>
        <header className="sidebar-header">
          <button onClick={closeWithAnimation} className="sidebar-close" aria-label="close">×</button>
          <div className="sidebar-heading">
            <span className="sidebar-title">{title}</span>
            {storagePath && (
              <button
                type="button"
                className="sidebar-storage-path"
                onClick={openStorageLocation}
                title={storagePath}
              >
                {storageLabel}
              </button>
            )}
            <span className="sidebar-description">{description}</span>
          </div>
        </header>
        <div className="sidebar-body">{children}</div>
      </aside>
    </>
  );
}

interface RowProps {
  slot?: string;
  title: string;
  dateLabel: string;
  meta?: string;
  active: boolean;
  onClick: () => void;
  onRemove: () => void;
}

function Row({ slot, title, dateLabel, meta, active, onClick, onRemove }: RowProps) {
  return (
    <div className={`sidebar-row ${active ? "active" : ""}`}>
      {slot && (
        <div className="sidebar-row-slot">
          <span>{slot}</span>
        </div>
      )}
      <button className="sidebar-row-main" onClick={onClick}>
        <span className="sidebar-row-title">{title}</span>
        <span className="sidebar-row-date">{dateLabel}</span>
        {meta && <span className="sidebar-row-meta">{meta}</span>}
      </button>
      <button
        className="sidebar-row-remove"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        aria-label="remove"
        title="remove"
      >
        ×
      </button>
    </div>
  );
}

export function HistorySidebar() {
  const { history, removeHistoryEntry, closeSidebar } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const here = location.pathname + location.search;

  return (
    <SidebarFrame
      title="History"
      description="what you've read recently"
      storageFile={STORAGE_FILES.history}
      storageLabel="open history.json"
      onClose={closeSidebar}
    >
      {history.length === 0 ? (
        <p className="sidebar-empty">open an article and it will show up here.</p>
      ) : (
        history.map((h, index) => (
          <Row
            key={`${h.path}-${h.ts}`}
            slot={String(index + 1).padStart(2, "0")}
            title={h.title}
            dateLabel={`${relLabel(h.ts)} ${timeLabel(h.ts)}`}
            active={h.path === here}
            onClick={() => { navigate(h.path); closeSidebar(); }}
            onRemove={() => removeHistoryEntry(h.path, h.ts)}
          />
        ))
      )}
    </SidebarFrame>
  );
}

export function WatchLaterSidebar() {
  const { watchLater, removeFromWatchLater, closeSidebar } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const here = location.pathname + location.search;

  return (
    <SidebarFrame
      title="Read later"
      description="what to read next"
      storageFile={STORAGE_FILES.readLater}
      storageLabel="open read-later.json"
      onClose={closeSidebar}
    >
      {watchLater.length === 0 ? (
        <p className="sidebar-empty">
          hit <span className="sidebar-empty-icon"><BookmarkIcon /></span> on an article or result to push it here.
        </p>
      ) : (
        watchLater.map((v, index) => {
          const path = `/watch?v=${v.id}`;
          return (
            <Row
              key={v.id}
              slot={index === 0 ? "up" : String(index + 1).padStart(2, "0")}
              title={v.title}
              dateLabel={`${relLabel(v.addedAt)} ${timeLabel(v.addedAt)}`}
              meta={v.channelTitle}
              active={path === here}
              onClick={() => { navigate(path); closeSidebar(); }}
              onRemove={() => removeFromWatchLater(v.id)}
            />
          );
        })
      )}
    </SidebarFrame>
  );
}
