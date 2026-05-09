import { Link } from "react-router-dom";
import { VideoResult } from "../lib/youtube";
import { useApp } from "../lib/AppContext";

interface Props {
  v: VideoResult;
}

function visibleMeta(value?: string) {
  const text = value?.trim();
  if (!text || /^n\/a$/i.test(text)) return "";
  return text;
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill={filled ? "currentColor" : "none"} aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default function ResultCard({ v }: Props) {
  const { watchLater, addToWatchLater, removeFromWatchLater } = useApp();
  const saved = watchLater.some((e) => e.id === v.id);
  const channelTitle = visibleMeta(v.channelTitle);
  const duration = visibleMeta(v.duration);
  const viewCount = visibleMeta(v.viewCount);
  const publishedText = visibleMeta(v.publishedText);
  const badges: string[] = [];
  if (v.isLive) badges.push("live");
  else if (v.isShort) badges.push("short");
  else badges.push("video");

  return (
    <article className="result-card">
      <div className="result-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {badges.map((b) => (
            <span key={b} className="result-chip">
              {b}
            </span>
          ))}
          {duration && (
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{duration}</span>
          )}
        </div>
        <div className="result-card-actions">
          <button
            onClick={() => saved
              ? removeFromWatchLater(v.id)
              : addToWatchLater({ id: v.id, title: v.title, channelTitle })
            }
            className={`queue-action ${saved ? "saved" : ""}`}
            data-tip={saved ? "remove from read later" : "add to read later"}
            aria-label={saved ? "remove from read later" : "add to read later"}
          >
            <BookmarkIcon filled={saved} />
          </button>
        </div>
      </div>
      <Link to={`/watch?v=${v.id}`} style={{ textDecoration: "none" }}>
        <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)", marginBottom: "6px", lineHeight: 1.35 }}>
          {v.title}
        </h4>
      </Link>
      {v.description && (
        <Link to={`/watch?v=${v.id}`} style={{ textDecoration: "none" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--desc)", marginBottom: "8px", lineHeight: 1.5 }}>
            {v.description.length > 220 ? v.description.slice(0, 220) + "…" : v.description}
          </p>
        </Link>
      )}
      <div style={{ fontSize: "0.75rem", color: "var(--muted)", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {channelTitle && (
          v.channelId ? (
            <Link to={`/channel?id=${v.channelId}`} style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
              {channelTitle}
            </Link>
          ) : (
            <span>{channelTitle}</span>
          )
        )}
        {viewCount && <span>· {viewCount}</span>}
        {publishedText && <span>· {publishedText}</span>}
      </div>
    </article>
  );
}
