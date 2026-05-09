import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MarkdownArticle from "../components/MarkdownArticle";
import whyTubestackMarkdown from "../content/why-tubestack.md?raw";
import whyTubestackFootnoteMarkdown from "../content/why-tubestack-footnote.md?raw";

// Searches that should reopen the first-run article instead of running a real query.
const TOUR_QUERIES = new Set([
  "tour",
  "onboarding",
  "intro",
  "what is this",
  "what is tubestack",
  "how does this work",
  "show me the tour",
]);

export default function Home() {
  const [query, setQuery] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if ((location.state as { showSearch?: boolean } | null)?.showSearch) {
      setShowOnboarding(false);
    }
  }, [location.state]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const v = query.trim();
    if (!v) return;
    if (TOUR_QUERIES.has(v.toLowerCase())) {
      setShowOnboarding(true);
      setQuery("");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(v)}`);
  }

  if (showOnboarding) {
    return <OnboardingArticle onBack={() => setShowOnboarding(false)} />;
  }

  return (
    <main className="home-shell">
      <div className="home-brand">
        <h1 className="home-brand-title">tubestack</h1>
        <p className="home-brand-subtitle">youtube, on your terms</p>
      </div>
      <form onSubmit={submit} className="home-search">
        <input
          autoFocus
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          type="text"
          value={query}
          placeholder="search anything"
          onChange={(e) => setQuery(e.target.value)}
          className="home-search-input"
          onFocus={(e) => (e.target.style.borderColor = "var(--text)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
        />
        <button type="submit" className="home-search-button">
          search
        </button>
      </form>
      <button
        type="button"
        onClick={() => setShowOnboarding(true)}
        className="home-tour-link"
      >
        why tubestack
      </button>
    </main>
  );
}

function OnboardingArticle({ onBack }: { onBack: () => void }) {
  return (
    <main
      aria-label="why tubestack"
      style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px", paddingTop: "64px", paddingBottom: "120px" }}
    >
      <MarkdownArticle markdown={whyTubestackMarkdown} />

      <footer style={{ marginTop: "24px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            width: "100%",
            background: "var(--chip-bg-soft)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            borderRadius: "14px",
            padding: "11px 16px",
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          start searching
        </button>
        <div className="why-footnote">
          <MarkdownArticle markdown={whyTubestackFootnoteMarkdown} />
        </div>
      </footer>
    </main>
  );
}
