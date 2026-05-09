import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { VideoDetail, TranscriptSegment, getVideoInfo, getTranscript } from "../lib/youtube";
import { useApp, useLogVisit } from "../lib/AppContext";
import { toParagraphs } from "../lib/transcriptFormat";
import BackButton from "../components/BackButton";
import { OPEN_ARTICLE_FIND_EVENT } from "../components/ArticleFind";

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill={filled ? "currentColor" : "none"} aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Watch() {
  const [params] = useSearchParams();
  const videoId = params.get("v") ?? "";
  const [info, setInfo] = useState<VideoDetail | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [transcriptError, setTranscriptError] = useState("");
  const [copyState, setCopyState] = useState<"article" | "error" | null>(null);
  const { watchLater, addToWatchLater, removeFromWatchLater } = useApp();
  const saved = watchLater.some((e) => e.id === videoId);
  useLogVisit(info?.title ?? null);

  useEffect(() => {
    if (!videoId) { setLoading(false); return; }
    setLoading(true);
    setTranscript([]);
    setTranscriptError("");
    getVideoInfo(videoId)
      .then(setInfo)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
    setTranscriptLoading(true);
    getTranscript(videoId)
      .then(setTranscript)
      .catch((e) => setTranscriptError(String(e?.message ?? e)))
      .finally(() => setTranscriptLoading(false));
  }, [videoId]);

  const paragraphs = useMemo(() => toParagraphs(transcript), [transcript]);
  const transcriptText = useMemo(() => paragraphs.join("\n\n"), [paragraphs]);

  async function copyArticle() {
    if (!transcriptText) return;
    try {
      await navigator.clipboard.writeText(transcriptText);
      setCopyState("article");
      window.setTimeout(() => setCopyState(null), 1400);
    } catch (e) {
      console.error(e);
      setCopyState("error");
      window.setTimeout(() => setCopyState(null), 1800);
    }
  }

  function openArticleFind() {
    window.dispatchEvent(new Event(OPEN_ARTICLE_FIND_EVENT));
  }

  if (!videoId) {
    return (
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 24px" }}>
        <p style={{ color: "var(--muted)" }}>no video id provided.</p>
      </main>
    );
  }

  return (
    <main className="reader-article-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <BackButton />
      </div>

      <article style={{ marginTop: "32px" }}>
        <header style={{ marginBottom: "36px" }}>
          {info && (
            <p className="reader-article-meta">
              {info.channelId ? (
                <Link to={`/channel?id=${info.channelId}`} style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                  {info.channelTitle}
                </Link>
              ) : info.channelTitle}
              {info.viewCount && <> · {Number(info.viewCount).toLocaleString()} views</>}
            </p>
          )}
          <h1 className="reader-article-title">
            {info?.title || (loading ? "loading…" : "untitled")}
          </h1>
        </header>

        <section>
          <div className="transcript-heading">
            <div className="watch-action-buttons">
              <button
                type="button"
                onClick={() => void copyArticle()}
                disabled={!transcriptText}
                data-tip={copyState === "article" ? "copied article" : copyState === "error" ? "copy failed" : "copy article"}
                aria-label="copy article"
              >
                <CopyIcon />
              </button>
              {info && (
                <button
                  type="button"
                  onClick={() => saved
                    ? removeFromWatchLater(videoId)
                    : addToWatchLater({ id: videoId, title: info.title, channelTitle: info.channelTitle })
                  }
                  data-tip={saved ? "remove from read later" : "add to read later"}
                  aria-label={saved ? "remove from read later" : "add to read later"}
                  className={saved ? "active" : ""}
                >
                  <BookmarkIcon filled={saved} />
                </button>
              )}
            </div>
            {paragraphs.length > 0 && (
              <div className="transcript-tools" aria-label="transcript tools">
                <button
                  type="button"
                  onClick={openArticleFind}
                  data-tip="find in article"
                  aria-label="find in article"
                >
                  <SearchIcon />
                </button>
              </div>
            )}
          </div>
          {transcriptLoading ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>loading transcript…</p>
          ) : paragraphs.length === 0 ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
              {transcriptError ? "no transcript available for this video." : "no transcript available for this video."}
            </p>
          ) : (
            <div className="transcript-body">
              {paragraphs.map((p, i) => (
                <p key={i}>
                  {p}
                </p>
              ))}
            </div>
          )}
        </section>
        {saved && (
          <footer style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => removeFromWatchLater(videoId)}
              style={{
                width: "100%",
                background: "var(--chip-bg-soft)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: "10px",
                padding: "14px 18px",
                fontSize: "0.9375rem",
                fontWeight: 500,
              }}
            >
              remove from read later
            </button>
          </footer>
        )}
      </article>
    </main>
  );
}
