import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChannelResult, VideoResult, searchChannels, searchVideos, loadMoreVideos } from "../lib/youtube";
import ChannelList from "../components/ChannelList";
import ResultCard from "../components/ResultCard";
import FilterTabs from "../components/FilterTabs";
import BackButton from "../components/BackButton";

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function strongMatch(query: string, channelTitle: string): boolean {
  const q = normalizeForMatch(query);
  const t = normalizeForMatch(channelTitle);
  return !!q && !!t && q === t;
}

function looksLikeTitle(q: string): boolean {
  const trimmed = q.trim();
  if (!trimmed) return false;
  if (trimmed.length >= 30) return true;
  if (/[?!]/.test(trimmed)) return true;
  const words = trimmed.split(/\s+/);
  if (words.length >= 5) return true;
  const firstWord = (words[0] ?? "").toLowerCase().replace(/[^a-z']/g, "");
  const titleStarters = /^(how|why|what|when|where|who|is|are|does|do|can|will|should|the|a|an|i|im|my|our|he|she|they|we|you|let|lets)$/;
  if (titleStarters.test(firstWord) && words.length >= 3) return true;
  return false;
}

type Filter = "all" | "videos" | "shorts" | "live";

export default function Search() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const forceChannels = params.get("channels") === "1";
  const skipChannels = !forceChannels && looksLikeTitle(query);

  const [channels, setChannels] = useState<ChannelResult[]>([]);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [continuation, setContinuation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<Filter>("all");
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    setLoading(true);
    setError("");
    setVideos([]);
    setChannels([]);
    setContinuation(null);

    const chPromise = skipChannels ? Promise.resolve([] as ChannelResult[]) : searchChannels(query).catch(() => []);
    const vdPromise = searchVideos(query).catch((e) => { throw e; });

    Promise.allSettled([chPromise, vdPromise]).then(([chRes, vdRes]) => {
      if (chRes.status === "fulfilled") setChannels(chRes.value);
      if (vdRes.status === "fulfilled") {
        setVideos(vdRes.value.videos);
        setContinuation(vdRes.value.continuation);
      } else {
        setError(String(vdRes.reason?.message ?? vdRes.reason));
      }
      setLoading(false);
    });
  }, [query, skipChannels]);

  const { primary, hidden, hasStrongMatch } = useMemo(() => {
    const matchIndex = channels.findIndex((c) => strongMatch(query, c.title));
    const hasStrong = matchIndex >= 0;
    const primary = hasStrong ? [channels[matchIndex]] : channels.slice(0, 3);
    const hidden = hasStrong
      ? channels.filter((_, i) => i !== matchIndex)
      : channels.slice(3);
    return { primary, hidden, hasStrongMatch: hasStrong };
  }, [channels, query]);

  useEffect(() => { setDetailsOpen(hasStrongMatch); }, [hasStrongMatch]);

  const filteredVideos = useMemo(() => {
    const real = videos.filter((v) => v.id && v.title);
    if (filter === "all") return real;
    if (filter === "videos") return real.filter((v) => !v.isShort && !v.isLive);
    if (filter === "shorts") return real.filter((v) => v.isShort);
    if (filter === "live") return real.filter((v) => v.isLive);
    return real;
  }, [videos, filter]);

  async function onLoadMore() {
    if (!continuation || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await loadMoreVideos(continuation);
      setVideos((v) => [...v, ...next.videos]);
      setContinuation(next.continuation);
    } finally {
      setLoadingMore(false);
    }
  }

  if (!query) {
    return (
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 24px" }}>
        <p style={{ color: "var(--muted)" }}>no query provided.</p>
      </main>
    );
  }

  const forceChannelsUrl = `/search?q=${encodeURIComponent(query)}&channels=1`;

  return (
    <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px", paddingTop: "64px", paddingBottom: "100px" }}>
      <div style={{ marginBottom: "28px" }}>
        <BackButton />
        <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text)", marginTop: "20px", marginBottom: "4px", letterSpacing: "-0.01em" }}>
          Results for &ldquo;{query}&rdquo;
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
          {loading ? (
            "searching…"
          ) : skipChannels ? (
            <>
              {filteredVideos.length} video{filteredVideos.length === 1 ? "" : "s"}
              {" · "}
              <Link to={forceChannelsUrl} style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                also search channels
              </Link>
            </>
          ) : (
            <>
              {channels.length} channel{channels.length === 1 ? "" : "s"} · {filteredVideos.length} video{filteredVideos.length === 1 ? "" : "s"}
            </>
          )}
        </p>
      </div>

      {error && (
        <p style={{ color: "var(--error)", fontSize: "0.8125rem", marginBottom: "16px" }}>{error}</p>
      )}

      {channels.length > 0 && (
        <details
          open={detailsOpen}
          onToggle={(e) => setDetailsOpen((e.target as HTMLDetailsElement).open)}
          style={{ marginBottom: "32px" }}
        >
          <summary style={{
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--muted)",
            marginBottom: "10px",
            userSelect: "none",
          }}>
            channels ({channels.length})
          </summary>
          <div style={{ marginTop: "4px" }}>
            <ChannelList primary={primary} hidden={hidden} />
          </div>
        </details>
      )}

      <section>
        <h3 style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--muted)", marginBottom: "10px" }}>
          videos & shorts
        </h3>
        <FilterTabs value={filter} onChange={setFilter} />
        <div style={{ marginTop: "16px" }}>
          {filteredVideos.map((v) => <ResultCard key={v.id} v={v} />)}
          {!loading && filteredVideos.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "0.8125rem", padding: "16px 0" }}>
              no videos matched.
            </p>
          )}
          {continuation && filteredVideos.length > 0 && (
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              style={{
                marginTop: "16px",
                padding: "8px 14px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text)",
                fontSize: "0.8125rem",
              }}
            >
              {loadingMore ? "loading…" : "load more"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
