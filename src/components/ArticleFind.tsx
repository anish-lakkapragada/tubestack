import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export const OPEN_ARTICLE_FIND_EVENT = "tubestack:open-article-find";

const SKIP_TAGS = "button, input, select, textarea, script, style, svg";
const SKIP_CONTAINERS = ".article-find, .navbar, .sidebar";
const HIGHLIGHT_NAME = "tubestack-find";
const ACTIVE_NAME = "tubestack-find-active";

type Match = { node: Text; start: number; end: number };

function normalizeChar(c: string) {
  if (c === "‘" || c === "’" || c === "‛" || c === "′") return "'";
  if (c === "“" || c === "”" || c === "‟" || c === "″") return '"';
  return c.toLocaleLowerCase();
}

function normalizeQuery(q: string) {
  let out = "";
  let prevSpace = true;
  for (let i = 0; i < q.length; i += 1) {
    const ch = normalizeChar(q[i]);
    const isSpace = /\s/.test(ch);
    if (isSpace) {
      if (prevSpace) continue;
      out += " ";
      prevSpace = true;
    } else {
      out += ch;
      prevSpace = false;
    }
  }
  return out.replace(/\s+$/, "");
}

function buildNormalized(text: string) {
  let normalized = "";
  const sourceIdx: number[] = [];
  let prevSpace = true;
  for (let i = 0; i < text.length; i += 1) {
    const ch = normalizeChar(text[i]);
    const isSpace = /\s/.test(ch);
    if (isSpace) {
      if (prevSpace) continue;
      normalized += " ";
      sourceIdx.push(i);
      prevSpace = true;
    } else {
      normalized += ch;
      sourceIdx.push(i);
      prevSpace = false;
    }
  }
  return { normalized, sourceIdx };
}

function collectMatches(root: Element, needle: string): Match[] {
  const matches: Match[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      if (parent.closest(SKIP_CONTAINERS)) return NodeFilter.FILTER_REJECT;
      if (parent.closest(SKIP_TAGS)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.nextNode() as Text | null;
  while (node) {
    const text = node.data;
    const { normalized, sourceIdx } = buildNormalized(text);
    let from = 0;
    while (from <= normalized.length - needle.length) {
      const idx = normalized.indexOf(needle, from);
      if (idx < 0) break;
      const start = sourceIdx[idx];
      const end = sourceIdx[idx + needle.length - 1] + 1;
      matches.push({ node, start, end });
      from = idx + Math.max(1, needle.length);
    }
    node = walker.nextNode() as Text | null;
  }
  return matches;
}

function rangeFor(match: Match) {
  const r = new Range();
  r.setStart(match.node, match.start);
  r.setEnd(match.node, match.end);
  return r;
}

function ensureVisible(range: Range) {
  const rect = range.getBoundingClientRect();
  if (!rect.width && !rect.height) return;

  const findBox = document.querySelector(".article-find")?.getBoundingClientRect();
  const topLimit = 80;
  const bottomLimit = Math.min(
    findBox ? findBox.top - 24 : window.innerHeight - 24,
    window.innerHeight - 24,
  );

  if (rect.top >= topLimit && rect.bottom <= bottomLimit) return;

  const band = Math.max(bottomLimit - topLimit, 120);
  const targetTop = topLimit + band * 0.2;
  const delta = rect.top - targetTop;

  window.scrollBy({ top: delta, behavior: "smooth" });
}

function highlightApiAvailable() {
  return (
    typeof CSS !== "undefined" &&
    "highlights" in CSS &&
    typeof (window as unknown as { Highlight?: unknown }).Highlight === "function"
  );
}

export default function ArticleFind() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const matchesRef = useRef<Match[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();

  const supported = useMemo(highlightApiAvailable, []);

  function clearAll() {
    if (!supported) return;
    CSS.highlights.delete(HIGHLIGHT_NAME);
    CSS.highlights.delete(ACTIVE_NAME);
  }

  function close() {
    clearAll();
    matchesRef.current = [];
    setQuery("");
    setMatchCount(0);
    setActiveIndex(0);
    setOpen(false);
  }

  useEffect(() => {
    const openFind = () => {
      setOpen(true);
      window.setTimeout(() => inputRef.current?.select(), 0);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "f") {
        e.preventDefault();
        openFind();
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener(OPEN_ARTICLE_FIND_EVENT, openFind);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener(OPEN_ARTICLE_FIND_EVENT, openFind);
    };
  }, [open]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, location.pathname, location.search]);

  useLayoutEffect(() => {
    if (!supported || !open) {
      matchesRef.current = [];
      setMatchCount(0);
      clearAll();
      return;
    }
    const needle = normalizeQuery(query);
    if (!needle) {
      matchesRef.current = [];
      setMatchCount(0);
      clearAll();
      return;
    }
    const root = document.querySelector(".app-main");
    if (!root) {
      matchesRef.current = [];
      setMatchCount(0);
      clearAll();
      return;
    }

    const matches = collectMatches(root, needle);
    matchesRef.current = matches;
    setMatchCount(matches.length);

    if (matches.length === 0) {
      clearAll();
      return;
    }

    const all = new Highlight(...matches.map(rangeFor));
    CSS.highlights.set(HIGHLIGHT_NAME, all);

    return () => {
      CSS.highlights.delete(HIGHLIGHT_NAME);
      CSS.highlights.delete(ACTIVE_NAME);
    };
  }, [supported, open, query, location.pathname, location.search]);

  useLayoutEffect(() => {
    if (!supported) return;
    const matches = matchesRef.current;
    if (matches.length === 0) {
      CSS.highlights.delete(ACTIVE_NAME);
      return;
    }
    const idx = Math.min(activeIndex, matches.length - 1);
    const range = rangeFor(matches[idx]);
    const active = new Highlight(range);
    active.priority = 1;
    CSS.highlights.set(ACTIVE_NAME, active);
    ensureVisible(range);
    inputRef.current?.focus({ preventScroll: true });
  }, [supported, activeIndex, matchCount]);

  function move(delta: number) {
    if (matchCount === 0) return;
    setActiveIndex((i) => (i + delta + matchCount) % matchCount);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    move(1);
  }

  function updateQuery(v: string) {
    setActiveIndex(0);
    setQuery(v);
  }

  if (!open) return null;

  return (
    <form className="article-find" onSubmit={submit} role="search" aria-label="find in article">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => updateQuery(e.target.value)}
        placeholder={supported ? "find in article" : "find unavailable"}
        aria-label="find in article"
        disabled={!supported}
      />
      <span className="article-find-count">
        {query ? `${matchCount ? Math.min(activeIndex, matchCount - 1) + 1 : 0}/${matchCount}` : ""}
      </span>
      <button type="button" onClick={() => move(-1)} disabled={matchCount === 0} aria-label="previous match">
        ↑
      </button>
      <button type="button" onClick={() => move(1)} disabled={matchCount === 0} aria-label="next match">
        ↓
      </button>
      <button type="button" onClick={close} aria-label="close find">
        ×
      </button>
    </form>
  );
}
