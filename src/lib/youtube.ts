import { Innertube, UniversalCache, YTNodes } from "youtubei.js/web";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

// Route youtubei.js through Tauri's Rust fetch. Two jobs here:
//   1. Escape the webview's CORS sandbox (Rust has no CORS).
//   2. Pin Origin/Referer/User-Agent to youtube.com — on the `web` platform
//      youtubei.js doesn't set these and lets the browser default; in Tauri
//      the browser origin is `tauri://localhost`, which YouTube rejects with
//      403. (The Rust plugin's `unsafe-headers` feature lets us set these
//      "forbidden" headers even though the webview can't.)
function ytFetch(input: any, init?: any): Promise<Response> {
  const headers = new Headers();
  if (input instanceof Request) input.headers.forEach((v, k) => headers.set(k, v));
  if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
  headers.set("Origin", "https://www.youtube.com");
  headers.set("Referer", "https://www.youtube.com/");
  // Pin locale so InnerTube picks the English transcript track by default.
  // Without this, YouTube guesses from IP/VPN and some creators (3Blue1Brown,
  // community-translated videos) default to the first contributed language.
  headers.set("Accept-Language", "en-US,en;q=0.9");
  if (!headers.has("User-Agent")) {
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );
  }
  return tauriFetch(input, { ...init, headers });
}

// One shared client. InnerTube handshake is expensive; keep it around.
let clientPromise: Promise<Innertube> | null = null;

function getClient(): Promise<Innertube> {
  if (!clientPromise) {
    clientPromise = Innertube.create({
      fetch: ytFetch,
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });
  }
  return clientPromise;
}

export interface VideoResult {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId?: string;
  publishedText: string;
  duration: string;
  durationSeconds: number;
  viewCount: string;
  isShort: boolean;
  isLive: boolean;
}

export interface ChannelResult {
  channelId: string;
  title: string;
  subscribers: string;
  videoCount: string;
  description: string;
}

export interface ChannelInfo {
  channelId: string;
  title: string;
  description: string;
  subscribers: string;
}

export interface TranscriptSegment {
  startMs: number;
  endMs: number;
  text: string;
}

function textOf(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v.toString === "function") {
    const s = v.toString();
    if (s && s !== "[object Object]") return s;
  }
  return v.text ?? "";
}

function mapVideo(v: any): VideoResult {
  const duration = v.duration ?? { text: "", seconds: 0 };
  const durText = typeof duration === "object" ? (duration.text ?? "") : "";
  const durSecs = typeof duration === "object" ? (duration.seconds ?? 0) : 0;
  const isLive = !!(v.is_live || v.badges?.some?.((b: any) => /live/i.test(textOf(b.label))));
  // Shorts are either flagged or just very short vertical videos; YouTube
  // doesn't always expose a flag, so fall back to duration + view of endpoint.
  const endpointUrl = v.endpoint?.metadata?.url || v.endpoint?.payload?.url || "";
  const isShort = /\/shorts\//.test(endpointUrl) || (durSecs > 0 && durSecs <= 60);
  return {
    id: v.id ?? v.video_id ?? "",
    title: textOf(v.title),
    description: textOf(v.description_snippet) || textOf(v.description) || "",
    channelTitle: textOf(v.author?.name),
    channelId: v.author?.id,
    publishedText: textOf(v.published),
    duration: durText,
    durationSeconds: durSecs,
    viewCount: textOf(v.short_view_count) || textOf(v.view_count),
    isShort,
    isLive,
  };
}

function mapShort(s: any): VideoResult {
  const endpoint = s.on_tap_endpoint ?? s.on_tap ?? s.navigation_endpoint;
  const url: string = endpoint?.metadata?.url ?? endpoint?.payload?.url ?? "";
  const idFromUrl = url.match(/\/shorts\/([^/?&]+)/)?.[1];
  const id = endpoint?.payload?.videoId ?? idFromUrl ?? s.entity_id ?? "";
  return {
    id,
    title: textOf(s.overlay_metadata?.primary_text) || s.accessibility_text || "",
    description: "",
    channelTitle: "",
    publishedText: "",
    duration: "",
    durationSeconds: 0,
    viewCount: textOf(s.overlay_metadata?.secondary_text),
    isShort: true,
    isLive: false,
  };
}

function mapChannel(c: any): ChannelResult {
  return {
    channelId: c.id ?? c.author?.id ?? "",
    title: textOf(c.author?.name) || textOf(c.title),
    subscribers: textOf(c.subscriber_count) || textOf(c.subscribers),
    videoCount: textOf(c.video_count) || textOf(c.videos),
    description: textOf(c.description_snippet) || textOf(c.description),
  };
}

export interface SearchVideosResult {
  videos: VideoResult[];
  continuation?: any;
}

let lastSearchObject: any = null;

export async function searchVideos(query: string): Promise<SearchVideosResult> {
  const yt = await getClient();
  // No `type` filter — YouTube's `type: "video"` excludes Shorts entirely.
  // We filter result node types manually below to keep only videos + shorts.
  const search = await yt.search(query);
  lastSearchObject = search;
  const videos: VideoResult[] = [];
  for (const node of search.results ?? []) {
    if (node.is?.(YTNodes.Video) || node.type === "Video") videos.push(mapVideo(node));
    else if (node.type === "ShortsLockupView" || node.type === "ReelItem") {
      videos.push(mapShort(node));
    }
  }
  return { videos, continuation: search };
}

export async function loadMoreVideos(continuation: any): Promise<SearchVideosResult> {
  if (!continuation?.getContinuation) return { videos: [] };
  const next = await continuation.getContinuation();
  const videos: VideoResult[] = [];
  for (const node of next.results ?? []) {
    if (node.is?.(YTNodes.Video) || node.type === "Video") videos.push(mapVideo(node));
  }
  return { videos, continuation: next };
}

export async function searchChannels(query: string): Promise<ChannelResult[]> {
  const yt = await getClient();
  const search = await yt.search(query, { type: "channel" });
  const out: ChannelResult[] = [];
  for (const node of search.results ?? []) {
    if (node.type === "Channel" || node.is?.(YTNodes.Channel)) out.push(mapChannel(node));
  }
  return out;
}

export interface ChannelArchiveResult {
  info: ChannelInfo;
  videos: VideoResult[];
  continuation?: any;
}

export async function resolveChannel(channelId: string): Promise<ChannelArchiveResult> {
  const yt = await getClient();
  const ch = await yt.getChannel(channelId);
  const info: ChannelInfo = {
    channelId,
    title: textOf(ch.metadata?.title) || textOf((ch.header as any)?.author?.name),
    description: textOf(ch.metadata?.description),
    subscribers: textOf((ch.header as any)?.subscribers) || textOf((ch.header as any)?.subscriber_count),
  };
  let videosFeed: any;
  try {
    videosFeed = await ch.getVideos();
  } catch {
    videosFeed = null;
  }
  const videos: VideoResult[] = [];
  for (const node of videosFeed?.videos ?? []) {
    videos.push(mapVideo(node));
  }
  return { info, videos, continuation: videosFeed };
}

export async function loadMoreChannelVideos(continuation: any): Promise<{ videos: VideoResult[]; continuation?: any }> {
  if (!continuation?.getContinuation) return { videos: [] };
  const next = await continuation.getContinuation();
  const videos: VideoResult[] = [];
  for (const node of next.videos ?? []) videos.push(mapVideo(node));
  return { videos, continuation: next };
}

export interface VideoDetail {
  id: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  description: string;
  viewCount: string;
  published: string;
  duration: number;
}

export async function getVideoInfo(videoId: string): Promise<VideoDetail> {
  const yt = await getClient();
  const info = await yt.getInfo(videoId);
  const basic = info.basic_info;
  return {
    id: basic.id ?? videoId,
    title: basic.title ?? "",
    channelTitle: basic.author ?? "",
    channelId: basic.channel_id,
    description: basic.short_description ?? "",
    viewCount: String(basic.view_count ?? ""),
    published: textOf((info as any).primary_info?.published),
    duration: basic.duration ?? 0,
  };
}

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const yt = await getClient();
  const info = await yt.getInfo(videoId);

  // Primary: fetch the caption track whose language_code starts with "en".
  // language_code is authoritative, so we never get surprises like
  // 3Blue1Brown's community-translated Arabic track winning over English.
  const tracks: any[] = (info as any).captions?.caption_tracks ?? [];
  const track =
    tracks.find((t) => t.language_code === "en") ??
    tracks.find((t) => (t.language_code ?? "").startsWith("en")) ??
    tracks.find((t) => t.kind === "asr") ??
    tracks[0];

  if (track?.base_url) {
    try {
      const sep = track.base_url.includes("?") ? "&" : "?";
      const res = await ytFetch(`${track.base_url}${sep}fmt=json3`);
      if (res.ok) {
        const data: any = await res.json();
        const out: TranscriptSegment[] = [];
        for (const ev of data.events ?? []) {
          if (!ev.segs) continue;
          const text = (ev.segs.map((s: any) => s.utf8 ?? "").join("") || "").trim();
          if (!text) continue;
          const start = Number(ev.tStartMs ?? 0);
          out.push({ startMs: start, endMs: start + Number(ev.dDurationMs ?? 0), text });
        }
        if (out.length > 0) return out;
      }
    } catch (e) {
      console.warn("caption track fetch failed:", e);
    }
  }

  // Fallback: youtubei.js's engagement-panel transcript. Switch to English
  // explicitly since the default is locale-guessed and sometimes non-English.
  try {
    let t = await info.getTranscript();
    const langs: string[] = (t as any).languages ?? [];
    const selected: string = (t as any).selectedLanguage ?? "";
    if (!/^english/i.test(selected)) {
      const en = langs.find((l) => /^english/i.test(l));
      if (en) t = await t.selectLanguage(en);
    }
    const segs = t?.transcript?.content?.body?.initial_segments ?? [];
    const mapped = segs
      .map((s: any) => ({
        startMs: Number(s.start_ms ?? 0),
        endMs: Number(s.end_ms ?? 0),
        text: textOf(s.snippet),
      }))
      .filter((s: TranscriptSegment) => s.text.length > 0);
    if (mapped.length > 0) return mapped;
  } catch (e) {
    console.warn("engagement-panel transcript failed:", e);
  }

  throw new Error("no captions available for this video");
}

// referenced to silence unused-warning; used indirectly for type narrowing
void lastSearchObject;
