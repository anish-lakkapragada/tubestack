import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../lib/AppContext";

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function HistoryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

// Three escalating focus modes. Same enforcement (fullscreen + key blocks);
// only the duration changes.
const LOCK_MODES = [
  { key: "hard", label: "hard", seconds: 5 * 60, blurb: "a quick reset" },
  { key: "more", label: "more", seconds: 10 * 60, blurb: "longer focus block" },
  { key: "lockdown", label: "lockdown", seconds: 20 * 60, blurb: "the strict one" },
] as const;

export default function NavBar() {
  const { theme, toggleTheme, locked, secondsLeft, hasUsedLock, startLock, watchLater, toggleSidebar } = useApp();
  const navigate = useNavigate();
  const upcoming = watchLater[0];

  // Show the icon of the *next* theme in the cycle so the button hints at
  // what it will do.
  const themeIcon = theme === "light" ? <MoonIcon /> : <SunIcon />;

  return (
    <nav className="navbar">
      {locked ? (
        <>
          <span className="countdown">{fmt(secondsLeft)}</span>
          <span className="sep">·</span>
          <span>locked</span>
        </>
      ) : (
        <>
          <span className="lock-menu-wrap">
            <button className="icon-link lock-trigger" type="button" aria-label="lock the app to focus">
              <LockIcon />
            </button>
            <div className="lock-menu" role="menu" aria-label="lock modes">
              <p className="lock-menu-desc">
                lock yourself out: forced fullscreen, no backspace, no escape until the timer is up. pick how strict.
              </p>
              {LOCK_MODES.map((mode) => (
                <button
                  key={mode.key}
                  className="lock-menu-item"
                  type="button"
                  onClick={() => startLock(mode.seconds)}
                >
                  <span className="lock-menu-row">
                    <span className="lock-menu-label">{mode.label}</span>
                    <span className="lock-menu-time">{fmt(mode.seconds)}</span>
                  </span>
                  <span className="lock-menu-blurb">{mode.blurb}</span>
                </button>
              ))}
            </div>
          </span>
          {!hasUsedLock && (
            <span className="lock-hint">force yourself to stop searching</span>
          )}
          <span className="sep">·</span>
          <button
            onClick={() => upcoming && navigate(`/watch?v=${upcoming.id}`)}
            disabled={!upcoming}
            data-tip={upcoming ? `up next: ${upcoming.title}` : "queue is empty — bookmark a video first"}
            style={{ opacity: upcoming ? 1 : 0.4, cursor: upcoming ? "pointer" : "default" }}
          >
            upcoming
          </button>
          <span className="sep">·</span>
          <button
            onClick={toggleTheme}
            className="icon-link"
            aria-label="toggle theme"
          >
            {themeIcon}
          </button>
          <span className="sep">·</span>
          <button
            onClick={() => toggleSidebar("history")}
            data-tip="history — videos you've recently opened"
            className="icon-link"
            aria-label="history"
          >
            <HistoryIcon />
          </button>
          <span className="sep">·</span>
          <button
            onClick={() => toggleSidebar("later")}
            data-tip="read later — videos you've saved for later"
            className="icon-link"
            aria-label="read later"
          >
            <BookmarkIcon />
          </button>
          <span className="sep">·</span>
          <Link to="/about" style={{ color: "var(--muted)", textDecoration: "none" }}>
            about
          </Link>
        </>
      )}
    </nav>
  );
}
