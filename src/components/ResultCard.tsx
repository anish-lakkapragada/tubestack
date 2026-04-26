import { Link } from "react-router-dom";
import { VideoResult } from "../lib/youtube";
import { useApp } from "../lib/AppContext";

interface Props {
  v: VideoResult;
}

export default function ResultCard({ v }: Props) {
  const { watchLater, addToWatchLater, removeFromWatchLater } = useApp();
  const saved = watchLater.some((e) => e.id === v.id);
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
          {v.duration && (
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{v.duration}</span>
          )}
        </div>
        <button
          onClick={() => saved
            ? removeFromWatchLater(v.id)
            : addToWatchLater({ id: v.id, title: v.title, channelTitle: v.channelTitle })
          }
          className={`queue-action ${saved ? "saved" : ""}`}
          aria-label={saved ? "remove from read later" : "add to read later"}
          title={saved ? "remove from read later" : "add to read later"}
        >
          <span className="queue-action-plus">{saved ? "−" : "+"}</span>
          <span>{saved ? "saved" : "later"}</span>
        </button>
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
        {v.channelTitle && (
          v.channelId ? (
            <Link to={`/channel?id=${v.channelId}`} style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
              {v.channelTitle}
            </Link>
          ) : (
            <span>{v.channelTitle}</span>
          )
        )}
        {v.viewCount && <span>· {v.viewCount}</span>}
        {v.publishedText && <span>· {v.publishedText}</span>}
      </div>
    </article>
  );
}
