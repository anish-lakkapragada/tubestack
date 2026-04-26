import { Link } from "react-router-dom";
import { ChannelResult } from "../lib/youtube";

export default function ChannelCard({ c }: { c: ChannelResult }) {
  return (
    <Link
      to={`/channel?id=${c.channelId}`}
      style={{
        display: "block",
        padding: "10px 12px",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.1s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--input-border)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>
        {c.title}
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--muted)", display: "flex", gap: "8px" }}>
        {c.subscribers && <span>{c.subscribers}</span>}
        {c.videoCount && <span>· {c.videoCount}</span>}
      </div>
      {c.description && (
        <p style={{ fontSize: "0.8125rem", color: "var(--desc)", marginTop: "4px", lineHeight: 1.4 }}>
          {c.description.length > 180 ? c.description.slice(0, 180) + "…" : c.description}
        </p>
      )}
    </Link>
  );
}
