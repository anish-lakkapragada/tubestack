import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { VideoDetail, TranscriptSegment, getVideoInfo, getTranscript } from "../lib/youtube";
import { useApp, useLogVisit } from "../lib/AppContext";
import BackButton from "../components/BackButton";

// YouTube auto-captions (ASR) come back lowercase, unpunctuated, and littered
// with [music]/[applause] annotations. We reconstruct prose by:
//   1. stripping bracket annotations and speaker tags (">>")
//   2. fixing lone "i" → "I" and contractions
//   3. inferring sentence breaks from timestamp *gaps* between segments — YT
//      emits each caption roughly when someone stops speaking, so a >650ms
//      gap is almost always a sentence boundary
//   4. capitalizing the first letter of each inferred sentence
//   5. grouping ~4 sentences into each paragraph
// Manual (non-ASR) captions already have punctuation and capitalization, so
// the logic is a no-op on those — it only helps, never hurts.
const BRACKET_NOISE = /\[(?:music|applause|laughter|cheering|background [^\]]*|inaudible|noise|silence|pause|sigh|sighs|coughing)\]/gi;
const SOFT_SENTENCE_START = /\b(?:okay|ok|so|well|now|today|thanks|thank you|just a quick announcement|anything you want to add|let's|lets|if you have questions|coming up|you can sign up|we have|we're|were|you describe yourself|you got|you went on|which firm|very close|no no)\b/i;
const HARD_SENTENCE_END = /[.?!]["')\]]?$/;

function cleanSegment(text: string): string {
  let t = text.replace(BRACKET_NOISE, " ").replace(/>>+/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  t = t.replace(/\b(um|uh|erm|hmm)\b/gi, " ");
  t = t.replace(/\bi\b/g, "I");
  t = t.replace(/\bi(['’])(m|ve|ll|d|s|re)\b/gi, (_, apo, suffix) => "I" + apo + suffix.toLowerCase());
  return t.replace(/\s+/g, " ").trim();
}

function toParagraphs(transcript: TranscriptSegment[]): string[] {
  if (transcript.length === 0) return [];

  const sentences: string[] = [];
  let current: string[] = [];
  let wordCount = 0;

  for (let i = 0; i < transcript.length; i++) {
    const seg = transcript[i];
    const text = cleanSegment(seg.text);
    if (!text) continue;

    current.push(text);
    wordCount += text.split(/\s+/).length;

    const next = transcript[i + 1];
    const nextText = next ? cleanSegment(next.text) : "";
    const gap = next ? next.startMs - seg.endMs : 0;
    const shouldBreak =
      !next ||
      HARD_SENTENCE_END.test(text) ||
      gap > 850 ||
      wordCount >= 28 ||
      (wordCount >= 12 && gap > 420 && SOFT_SENTENCE_START.test(nextText));

    if (shouldBreak) {
      sentences.push(finishSentence(current.join(" ")));
      current = [];
      wordCount = 0;
    }
  }

  if (current.length > 0) sentences.push(finishSentence(current.join(" ")));

  const cleaned = sentences
    .map((s) => s.replace(/\s+([.?!,;:])/g, "$1").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));

  if (cleaned.length === 0) return [];

  return groupSentences(cleaned);
}

function finishSentence(text: string): string {
  const t = text
    .replace(/\s+([.?!,;:])/g, "$1")
    .replace(/([.?!])\s*([.?!])+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return "";
  return HARD_SENTENCE_END.test(t) ? t : `${t}.`;
}

function groupSentences(sentences: string[]): string[] {
  const paragraphs: string[] = [];
  let current: string[] = [];
  let words = 0;

  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length;
    if (current.length > 0 && (current.length >= 3 || words + sentenceWords > 72)) {
      paragraphs.push(current.join(" "));
      current = [];
      words = 0;
    }
    current.push(sentence);
    words += sentenceWords;
  }
  if (current.length > 0) paragraphs.push(current.join(" "));

  return paragraphs;
}

export default function Watch() {
  const [params] = useSearchParams();
  const videoId = params.get("v") ?? "";
  const [info, setInfo] = useState<VideoDetail | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(true);
  const [transcriptError, setTranscriptError] = useState("");
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

  if (!videoId) {
    return (
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 24px" }}>
        <p style={{ color: "var(--muted)" }}>no video id provided.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px", paddingTop: "64px", paddingBottom: "120px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <BackButton />
        {info && (
          <button
            onClick={() => saved
              ? removeFromWatchLater(videoId)
              : addToWatchLater({ id: videoId, title: info.title, channelTitle: info.channelTitle })
            }
            style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.8125rem", textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            {saved ? "− remove from read later" : "+ read later"}
          </button>
        )}
      </div>

      <article style={{ marginTop: "32px" }}>
        <header style={{ marginBottom: "36px" }}>
          {info && (
            <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginBottom: "10px" }}>
              {info.channelId ? (
                <Link to={`/channel?id=${info.channelId}`} style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                  {info.channelTitle}
                </Link>
              ) : info.channelTitle}
              {info.viewCount && <> · {Number(info.viewCount).toLocaleString()} views</>}
            </p>
          )}
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text)", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
            {info?.title || (loading ? "loading…" : "untitled")}
          </h1>
        </header>

        <section>
          <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--muted)", marginBottom: "24px" }}>
            transcript
          </p>
          {transcriptLoading ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>loading transcript…</p>
          ) : paragraphs.length === 0 ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
              {transcriptError ? "no transcript available for this video." : "no transcript available for this video."}
            </p>
          ) : (
            <div>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ fontSize: "1rem", color: "var(--text)", lineHeight: 1.8, marginBottom: "20px" }}>
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
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: "999px",
                padding: "10px 16px",
                fontSize: "0.875rem",
              }}
            >
              remove from watch list
            </button>
          </footer>
        )}
      </article>
    </main>
  );
}
