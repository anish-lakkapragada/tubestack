import { useState } from "react";
import { ChannelResult } from "../lib/youtube";
import ChannelCard from "./ChannelCard";

interface Props {
  primary: ChannelResult[];
  hidden: ChannelResult[];
}

export default function ChannelList({ primary, hidden }: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
        {primary.map((c) => (
          <li key={c.channelId}><ChannelCard c={c} /></li>
        ))}
        {expanded && hidden.map((c) => (
          <li key={c.channelId}><ChannelCard c={c} /></li>
        ))}
      </ul>
      {hidden.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            marginTop: "8px",
            padding: "4px 0",
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: "0.75rem",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          {expanded ? "hide extra channels" : `show ${hidden.length} more ${hidden.length === 1 ? "channel" : "channels"}`}
        </button>
      )}
    </>
  );
}
