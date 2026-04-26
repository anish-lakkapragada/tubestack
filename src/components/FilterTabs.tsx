interface Props {
  value: "all" | "videos" | "shorts" | "live";
  onChange: (v: Props["value"]) => void;
}

const TABS: Props["value"][] = ["all", "videos", "shorts", "live"];

export default function FilterTabs({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", gap: "4px", fontSize: "0.8125rem" }}>
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: "4px 10px",
            borderRadius: "4px",
            border: "none",
            background: value === t ? "var(--inverse-bg)" : "transparent",
            color: value === t ? "var(--inverse-text)" : "var(--muted)",
            fontSize: "0.8125rem",
            fontWeight: value === t ? 500 : 400,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
