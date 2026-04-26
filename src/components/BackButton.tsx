import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useApp } from "../lib/AppContext";

const backStyle = {
  background: "none",
  border: "none",
  color: "var(--muted)",
  fontSize: "0.8125rem",
  textDecoration: "none",
  padding: 0,
} as const;

export default function BackButton() {
  const navigate = useNavigate();
  const { locked } = useApp();
  const [warning, setWarning] = useState(false);
  const warningTimer = useRef<number | null>(null);

  function goBack() {
    if (locked) {
      setWarning(true);
      if (warningTimer.current !== null) window.clearTimeout(warningTimer.current);
      warningTimer.current = window.setTimeout(() => setWarning(false), 1800);
      return;
    }
    const idx = window.history.state?.idx;
    if (typeof idx === "number" && idx > 0) navigate(-1);
    else navigate("/");
  }

  return (
    <span className="back-button-wrap">
      <button
        type="button"
        onClick={goBack}
        title={locked ? "disabled in locked mode" : "back"}
        style={{ ...backStyle, opacity: locked ? 0.35 : 1, cursor: "pointer" }}
      >
        ← back
      </button>
      {warning && <span className="back-lock-warning">disabled in locked mode</span>}
    </span>
  );
}
