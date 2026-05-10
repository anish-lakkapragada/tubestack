import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChannelInfo, VideoResult, resolveChannel, loadMoreChannelVideos } from "../lib/youtube";
import ResultCard from "../components/ResultCard";
import BackButton from "../components/BackButton";
import FilterTabs from "../components/FilterTabs";

type Filter = "all" | "videos" | "shorts" | "live";

export default function Channel() {
  const [params] = useSearchParams();
  const channelId = params.get("id") ?? "";
  const [info, setInfo] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [continuation, setContinuation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!channelId) { setLoading(false); return; }
    setLoading(true);
    setError("");
    resolveChannel(channelId)
      .then((r) => {
        setInfo(r.info);
        setVideos(r.videos);
        setContinuation(r.continuation);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, [channelId]);

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
      const next = await loadMoreChannelVideos(continuation);
      setVideos((v) => [...v, ...next.videos]);
      setContinuation(next.continuation);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px", paddingTop: "64px", paddingBottom: "100px" }}>
      <BackButton />
      {loading && <p style={{ marginTop: "20px", color: "var(--muted)" }}>loading…</p>}
      {error && <p style={{ marginTop: "20px", color: "var(--error)" }}>{error}</p>}
      {info && (
        <div style={{ marginTop: "20px", marginBottom: "28px" }}>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text)", marginBottom: "4px", letterSpacing: "-0.01em" }}>
            {info.title}
          </h2>
          {info.subscribers && (
            <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{info.subscribers}</p>
          )}
          {info.description && (
            <p style={{ fontSize: "0.875rem", color: "var(--desc)", marginTop: "10px", lineHeight: 1.5 }}>
              {info.description}
            </p>
          )}
        </div>
      )}
      <section>
        <h3 style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--muted)", marginBottom: "10px" }}>
          videos & shorts
        </h3>
        <FilterTabs value={filter} onChange={setFilter} />
        <div style={{ marginTop: "16px" }}>
          {filteredVideos.map((v) => <ResultCard key={v.id} v={v} />)}
        </div>
        {!loading && filteredVideos.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "0.8125rem", padding: "16px 0" }}>no videos matched.</p>
        )}
        {continuation && (
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
      </section>
    </main>
  );
}
