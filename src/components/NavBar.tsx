import { Link, useNavigate } from "react-router-dom";
import { READER_STYLE_PRESETS, ReaderSize, ReaderStyle, useApp } from "../lib/AppContext";

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

function HomeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
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

function AnthropicLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 46 32" fill="currentColor" aria-hidden style={{ display: "block" }}>
      <path d="M32.73 0h-6.945L38.45 32h6.945L32.73 0ZM12.665 0 0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264Zm-.702 19.337 4.334-11.246 4.334 11.246h-8.668Z" />
    </svg>
  );
}

function OpenAILogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 41 41" fill="currentColor" aria-hidden style={{ display: "block" }}>
      <path d="M37.5 16.9a10 10 0 0 0-12-13 10 10 0 0 0-17 3.6 10 10 0 0 0-5.4 16.6 10 10 0 0 0 12 13 10 10 0 0 0 17-3.6 10 10 0 0 0 5.4-16.6Zm-15 21a7.5 7.5 0 0 1-4.8-1.7l8-4.6a1.3 1.3 0 0 0 .7-1.1V19.1l3.6 2.1v9.3a7.5 7.5 0 0 1-7.5 7.4ZM6.4 31a7.5 7.5 0 0 1-.9-5l8.1 4.7c.4.2.9.2 1.3 0l9.8-5.7v4.1l-8.1 4.7A7.5 7.5 0 0 1 6.4 31ZM4.3 13.6a7.5 7.5 0 0 1 3.9-3.3v9.5c0 .5.2.9.7 1.1l9.8 5.7-3.6 2.1-8.1-4.7a7.5 7.5 0 0 1-2.7-10.4Zm27.7 6.5-9.8-5.7 3.6-2.1 8.1 4.7a7.5 7.5 0 0 1-1.2 13.5v-9.3c0-.5-.3-.9-.7-1.1ZM35.3 15l-8.1-4.7c-.4-.2-.9-.2-1.3 0l-9.8 5.7v-4.1l8.1-4.7A7.5 7.5 0 0 1 35.3 15ZM10.8 19.9v-9.3a7.5 7.5 0 0 1 12.3-5.8l-8 4.6a1.3 1.3 0 0 0-.7 1.1v11.3l-3.6-2Zm5.3-1.9 4.3-2.5 4.3 2.5v5l-4.3 2.5-4.3-2.5v-5Z" />
    </svg>
  );
}

function XLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ display: "block" }}>
      <path d="M18.9 2.6h3.3l-7.2 8.2 8.5 11.2h-6.7l-5.2-6.8-6 6.8H2.3l7.7-8.8L1.8 2.6h6.8l4.7 6.2 5.6-6.2Zm-1.2 17.5h1.8L7.6 4.4h-2l12.1 15.7Z" />
    </svg>
  );
}

function SubstackLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" aria-hidden style={{ display: "block" }}>
      <path d="M5 4h22v4H5V4Zm0 7h22v4H5v-4Zm0 7h22v10L16 22 5 28V18Z" />
    </svg>
  );
}

function StyleLogo({ style }: { style: ReaderStyle }) {
  if (style === "anthropic") return <AnthropicLogo />;
  if (style === "openai") return <OpenAILogo />;
  if (style === "x") return <XLogo />;
  return <SubstackLogo />;
}

// Three escalating focus modes. Same enforcement (fullscreen + key blocks);
// only the duration changes.
const LOCK_MODES = [
  { key: "ephemeral", label: "ephemeral", seconds: 5, blurb: "a little fresh air" },
  { key: "hard", label: "hard", seconds: 5 * 60, blurb: "a quick reset" },
  { key: "more", label: "more", seconds: 10 * 60, blurb: "longer focus block" },
  { key: "lockdown", label: "lockdown", seconds: 20 * 60, blurb: "the strict one" },
] as const;

const READER_STYLES: ReaderStyle[] = ["anthropic", "openai", "x", "substack"];
const READER_SIZES: ReaderSize[] = ["small", "medium", "large", "extra-large"];
const READER_SIZE_LABEL: Record<ReaderSize, string> = {
  small: "small",
  medium: "med",
  large: "large",
  "extra-large": "xl",
};

export default function NavBar() {
  const { readerStyle, setReaderStyle, readerSize, setReaderSize, previewReaderStyle, previewReader, clearReaderPreview, locked, secondsLeft, hasUsedLock, startLock, watchLater, toggleSidebar } = useApp();
  const navigate = useNavigate();
  const upcoming = watchLater[0];
  const visibleReaderStyle = previewReaderStyle ?? readerStyle;

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
          <span className="reader-controls">
            <span className="style-menu-wrap">
              <button className="style-trigger" type="button" aria-label="reading style">
                <span>theme</span>
                <span className="style-trigger-icon"><StyleLogo style={visibleReaderStyle} /></span>
              </button>
              <div
                className="style-menu"
                role="dialog"
                aria-label="reading style"
                onMouseLeave={clearReaderPreview}
              >
                <span className="style-menu-label">themes</span>
                <div className="style-option-grid style-theme-grid">
                  {READER_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={readerStyle === style ? "active" : ""}
                      onMouseEnter={() => previewReader({ style })}
                      onFocus={() => previewReader({ style })}
                      onMouseDown={() => setReaderStyle(style)}
                      onClick={() => setReaderStyle(style)}
                      aria-label={READER_STYLE_PRESETS[style].label}
                    >
                      <span className="style-option-icon"><StyleLogo style={style} /></span>
                    </button>
                  ))}
                </div>
                <span className="style-menu-label">font size</span>
                <div className="style-option-grid style-size-grid">
                  {READER_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={readerSize === size ? "active" : ""}
                      onMouseDown={() => setReaderSize(size)}
                      onClick={() => setReaderSize(size)}
                    >
                      {READER_SIZE_LABEL[size]}
                    </button>
                  ))}
                </div>
              </div>
            </span>
          </span>
          <span className="sep">·</span>
          <button
            onClick={() => navigate("/", { state: { showSearch: true, ts: Date.now() } })}
            className="icon-link"
            aria-label="home"
          >
            <HomeIcon />
          </button>
          <span className="sep">·</span>
          <span className="lock-menu-wrap">
            <button className="icon-link lock-trigger" type="button" aria-label="lock the app to focus">
              <LockIcon />
            </button>
            <div className="lock-menu" role="menu" aria-label="lock modes">
              <p className="lock-menu-desc">
                lock yourself in: forced fullscreen, no escape until the timer is up. pick how strict.
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
            data-tip={upcoming ? "read what's next" : "queue is empty — bookmark an article first"}
            style={{ opacity: upcoming ? 1 : 0.4, cursor: upcoming ? "pointer" : "default" }}
          >
            upcoming
          </button>
          <span className="sep">·</span>
          <button
            onClick={() => toggleSidebar("history")}
            data-tip="history — articles you've recently opened"
            className="icon-link"
            aria-label="history"
          >
            <HistoryIcon />
          </button>
          <span className="sep">·</span>
          <button
            onClick={() => toggleSidebar("later")}
            data-tip="read later — articles you've saved for later"
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
