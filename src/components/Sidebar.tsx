import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appCacheDir, appDataDir, join } from "@tauri-apps/api/path";
import { openPath } from "@tauri-apps/plugin-opener";
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

interface SidebarFrameProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  onClose: () => void;
  onClear?: () => void;
  clearDisabled?: boolean;
  children: ReactNode;
}

function SidebarFrame({ title, subtitle, eyebrow, onClose, onClear, clearDisabled, children }: SidebarFrameProps) {
  return (
    <>
      <div className="sidebar-scrim" onClick={onClose} />
      <aside className="sidebar">
        <header className="sidebar-header">
          {eyebrow && <span className="sidebar-eyebrow">{eyebrow}</span>}
          <div className="sidebar-title-row">
            <span className="sidebar-title">{title}</span>
            <button onClick={onClose} className="sidebar-close" aria-label="close">×</button>
          </div>
          <span className="sidebar-subtitle">{subtitle}</span>
        </header>
        <div className="sidebar-body">{children}</div>
        {onClear && (
          <footer className="sidebar-footer">
            <button
              onClick={() => { if (!clearDisabled && confirm(`clear ${title.toLowerCase()}?`)) onClear(); }}
              disabled={clearDisabled}
              className="sidebar-clear"
            >
              clear all
            </button>
          </footer>
        )}
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

function StorageFolderLinks({ jsonFile }: { jsonFile?: string }) {
  const [paths, setPaths] = useState<{ appData?: string; appCache?: string; jsonPath?: string }>({});

  useEffect(() => {
    let alive = true;
    Promise.allSettled([appDataDir(), appCacheDir()]).then(async ([data, cache]) => {
      if (!alive) return;
      const appData = data.status === "fulfilled" ? data.value : undefined;
      const jsonPath = appData && jsonFile ? await join(appData, jsonFile).catch(() => undefined) : undefined;
      setPaths({
        appData,
        appCache: cache.status === "fulfilled" ? cache.value : undefined,
        jsonPath,
      });
    });
    return () => { alive = false; };
  }, [jsonFile]);

  return (
    <div className="sidebar-storage-links" aria-label="storage folders">
      <div>
        {jsonFile && (
          <button type="button" disabled={!paths.jsonPath} onClick={() => paths.jsonPath && openPath(paths.jsonPath!)}>
            open {jsonFile}
          </button>
        )}
        <button type="button" disabled={!paths.appData} onClick={() => paths.appData && openPath(paths.appData!)}>
          app data
        </button>
        <button type="button" disabled={!paths.appCache} onClick={() => paths.appCache && openPath(paths.appCache!)}>
          cache
        </button>
      </div>
    </div>
  );
}

export function HistorySidebar() {
  const { history, removeHistoryEntry, clearHistory, closeSidebar } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const here = location.pathname + location.search;

  return (
    <SidebarFrame
      title="History"
      eyebrow="recently watched"
      subtitle={history.length === 0 ? "nothing watched yet" : `${history.length} watched item${history.length === 1 ? "" : "s"}`}
      onClose={closeSidebar}
      onClear={clearHistory}
      clearDisabled={history.length === 0}
    >
      <StorageFolderLinks jsonFile={STORAGE_FILES.history} />
      {history.length === 0 ? (
        <p className="sidebar-empty">open a video or short and it will show up here.</p>
      ) : (
        history.map((h, index) => (
          <Row
            key={`${h.path}-${h.ts}`}
            slot={String(index + 1).padStart(2, "0")}
            title={h.title}
            dateLabel={relLabel(h.ts)}
            meta={timeLabel(h.ts)}
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
  const { watchLater, removeFromWatchLater, clearWatchLater, closeSidebar } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const here = location.pathname + location.search;

  return (
    <SidebarFrame
      title="Read later"
      eyebrow="stack"
      subtitle={watchLater.length === 0 ? "nothing queued" : `${watchLater.length} queued · newest first`}
      onClose={closeSidebar}
      onClear={clearWatchLater}
      clearDisabled={watchLater.length === 0}
    >
      <StorageFolderLinks jsonFile={STORAGE_FILES.readLater} />
      {watchLater.length === 0 ? (
        <p className="sidebar-empty">use the + button on a video, short, or result to push it here.</p>
      ) : (
        watchLater.map((v, index) => {
          const path = `/watch?v=${v.id}`;
          return (
            <Row
              key={v.id}
              slot={index === 0 ? "up" : String(index + 1).padStart(2, "0")}
              title={v.title}
              dateLabel={relLabel(v.addedAt)}
              meta={v.channelTitle || timeLabel(v.addedAt)}
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
