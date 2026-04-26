import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import onboardingFeed from "../onboarding-feed.json";

// Searches that should drop you into the tour instead of running a real query.
const TOUR_QUERIES = new Set([
  "tour",
  "onboarding",
  "intro",
  "what is this",
  "what is tubestack",
  "how does this work",
  "show me the tour",
]);

interface FeedVideo {
  kicker: string;
  title: string;
  meta: string;
  duration: string;
  tone: string;
  thumbnailText?: string;
  channel?: string;
  avatar?: string;
  variant?: "default" | "sponsored";
}

interface FeedShort {
  title: string;
  views: string;
  tone: string;
}

type FeedSection =
  | { type: "grid"; items: FeedVideo[] }
  | { type: "shorts"; title: string; items: FeedShort[] }
  | { type: "shelf"; title: string; subtitle: string; items: FeedVideo[] }
  | { type: "final"; item: FeedVideo };

// Bump by 0.0.1 whenever the onboarding sequence changes.
// Users see onboarding once per version.
const ONBOARDING_VERSION = "0.0.3";
const ONBOARDING_VERSION_KEY = "onboardingVersionSeen";

// All onboarding copy lives in src/onboarding-feed.json so it's editable
// without touching component code. The cast pins JSON's structural inference
// to the FeedSection union (JSON can't express the discriminated `type`).
const ONBOARDING_FEED = onboardingFeed as unknown as {
  platformPrefix: string;
  platformSuffix: string;
  platformAccent: string;
  introQuery: string;
  tags: string[];
  sections: FeedSection[];
};

const FEED_SECTIONS = ONBOARDING_FEED.sections;

type IconName = "home" | "shorts" | "subs" | "history" | "playlist" | "later" | "liked";

// Sidebar mirrors real YouTube's collapsed nav: a few core verbs at the top, a
// "you" cluster below. Icons are inline SVGs sized 24px to match real YT.
const SIDEBAR_GROUPS: { heading?: string; items: { label: string; icon: IconName }[] }[] = [
  {
    items: [
      { label: "home", icon: "home" },
      { label: "shorts", icon: "shorts" },
      { label: "subscriptions", icon: "subs" },
    ],
  },
  {
    heading: "you",
    items: [
      { label: "history", icon: "history" },
      { label: "playlists", icon: "playlist" },
      { label: "read later", icon: "later" },
      { label: "liked videos", icon: "liked" },
    ],
  },
];

function SidebarIcon({ name }: { name: IconName }) {
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
          <path d="M12 3 3 10v11h6v-7h6v7h6V10z" />
        </svg>
      );
    case "shorts":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
          <path d="M14.5 3 5 11.5h4.5L9.5 21 19 12.5h-4.5z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "subs":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M10 10.5v4l4-2z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "history":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
          <path d="M3 4v4h4" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
    case "playlist":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d="M4 6h12M4 12h12M4 18h8" />
          <path d="M18 14.5v6l5-3z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "later":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );
    case "liked":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
          <path d="M2 10h4v11H2zM7 21h10.3a2 2 0 0 0 2-1.6l1.6-7.8A2 2 0 0 0 19 9.2h-5.4l.8-3.7c.2-.9-.5-1.7-1.4-1.7-.5 0-1 .3-1.3.7L7 9.5z" />
        </svg>
      );
  }
}

function SearchGlassIcon({ small = false }: { small?: boolean }) {
  const size = small ? 16 : 18;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M15 15L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9a6 6 0 1 1 12 0v3l1.5 3h-15L6 12V9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(() => (
    localStorage.getItem(ONBOARDING_VERSION_KEY) !== ONBOARDING_VERSION
  ));
  const navigate = useNavigate();

  useEffect(() => {
    if (showOnboarding) {
      localStorage.setItem(ONBOARDING_VERSION_KEY, ONBOARDING_VERSION);
      localStorage.setItem("onboardingSeen", "1");
    }
  }, [showOnboarding]);

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
    return (
      <Onboarding
        onExit={(searchValue) => {
          setShowOnboarding(false);
          if (searchValue) navigate(`/search?q=${encodeURIComponent(searchValue)}`);
        }}
      />
    );
  }

  return (
    <main className="home-shell">
      <div className="home-brand">
        <h1 className="home-brand-title">tubestack</h1>
        <p className="home-brand-subtitle">youtube without the bullshit</p>
      </div>
      <form onSubmit={submit} className="home-search">
        <input
          autoFocus
          type="text"
          value={query}
          placeholder="search creators, videos, or shorts…"
          onChange={(e) => setQuery(e.target.value)}
          className="home-search-input"
          onFocus={(e) => (e.target.style.borderColor = "var(--text)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
        />
        <button type="submit" className="home-search-button">
          Search
        </button>
      </form>
      <button
        type="button"
        onClick={() => setShowOnboarding(true)}
        className="home-tour-link"
      >
        new here? take the tour
      </button>
    </main>
  );
}

interface OnboardingProps {
  onExit: (searchValue?: string) => void;
}

function Onboarding({ onExit }: OnboardingProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [typedQuery, setTypedQuery] = useState("");
  const [brandStage, setBrandStage] = useState<"hidden" | "prefix" | "full">("hidden");
  const [shellVisible, setShellVisible] = useState(false);
  const [visibleTagCount, setVisibleTagCount] = useState(0);
  const [feedReady, setFeedReady] = useState(false);
  const [visibleSectionCount, setVisibleSectionCount] = useState(0);

  const visibleSections = FEED_SECTIONS.slice(0, visibleSectionCount);
  const showFinal = visibleSections.some((section) => section.type === "final");

  useEffect(() => {
    let index = 0;
    let revealTimer: number | null = null;
    const typeTimer = window.setInterval(() => {
      index += 1;
      setTypedQuery(ONBOARDING_FEED.introQuery.slice(0, index));
      if (index >= ONBOARDING_FEED.introQuery.length) {
        clearInterval(typeTimer);
        revealTimer = window.setTimeout(() => setShellVisible(true), 2500);
      }
    }, 58);
    return () => {
      clearInterval(typeTimer);
      if (revealTimer !== null) clearTimeout(revealTimer);
    };
  }, []);

  useEffect(() => {
    if (!shellVisible) return;
    setBrandStage("prefix");
    const brandTimer = window.setTimeout(() => setBrandStage("full"), 700);
    return () => clearTimeout(brandTimer);
  }, [shellVisible]);

  useEffect(() => {
    if (!shellVisible) return;
    let tagIndex = 0;
    let tagTimer: number | null = null;
    const startTimer = window.setTimeout(() => {
      tagTimer = window.setInterval(() => {
        tagIndex += 1;
        setVisibleTagCount(tagIndex);
        if (tagIndex >= ONBOARDING_FEED.tags.length) {
          if (tagTimer !== null) clearInterval(tagTimer);
          window.setTimeout(() => setFeedReady(true), 650);
        }
      }, 850);
    }, 4100);
    return () => {
      clearTimeout(startTimer);
      if (tagTimer !== null) clearInterval(tagTimer);
    };
  }, [shellVisible]);

  useEffect(() => {
    if (!shellVisible || !feedReady) return;
    const marker = loadMoreRef.current;
    if (!marker) return;

    let loading = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || loading) return;
        if (visibleSectionCount >= FEED_SECTIONS.length) return;
        loading = true;
        window.setTimeout(() => {
          setVisibleSectionCount((count) => Math.min(count + 1, FEED_SECTIONS.length));
          loading = false;
        }, 900);
      },
      { root: null, rootMargin: "0px 0px 48px 0px", threshold: 0.35 },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [shellVisible, feedReady, visibleSectionCount]);

  function submit(e: FormEvent) {
    e.preventDefault();
    onExit(searchValue.trim() || undefined);
  }

  return (
    <main className={`onboarding-shell ${shellVisible ? "feed-visible" : "typing-only"}`}>
      {!shellVisible && (
        <section className="onboarding-type-stage" aria-label="opening search">
          <div className="yt-search-shell intro-search-shell">
            <span>{typedQuery}</span>
            <span className="typing-caret" aria-hidden />
          </div>
        </section>
      )}

      {shellVisible && (
      <section className="yt-feed-frame" aria-label="first launch article in a youtube-style feed">
        <header className="yt-topbar">
          <div className="yt-topbar-left">
            <button className="yt-hamburger" aria-hidden tabIndex={-1}>
              <span /><span /><span />
            </button>
            <div className="yt-logo-mark">
              <span className="yt-play" />
              <span className="yt-brand-name" aria-label="youbinge">
                {brandStage !== "hidden" && <span>{ONBOARDING_FEED.platformPrefix}</span>}
                {brandStage === "full" && (
                  <span className="yt-brand-suffix yt-brand-accent">{ONBOARDING_FEED.platformAccent}</span>
                )}
                {brandStage === "prefix" && <span className="typing-caret brand-caret" aria-hidden />}
              </span>
            </div>
          </div>
          <div className="yt-topbar-search">
            <div className="yt-search-shell">
              <SearchGlassIcon />
              <span className="yt-search-text">{typedQuery}</span>
              <span className="typing-caret" aria-hidden />
              <span className="yt-search-go" aria-hidden>
                <SearchGlassIcon small />
              </span>
            </div>
            <button className="yt-mic" aria-hidden tabIndex={-1}>
              <MicIcon />
            </button>
          </div>
          <div className="yt-top-actions">
            <span className="yt-action-pill" aria-hidden>+ create</span>
            <span className="yt-action-bell" aria-hidden>
              <BellIcon />
            </span>
            <span className="yt-action-avatar" aria-hidden>y</span>
          </div>
        </header>

        <div className="yt-layout">
          <aside className="yt-sidebar">
            {SIDEBAR_GROUPS.map((group, gi) => (
              <div key={gi} className="yt-sidebar-group">
                {group.heading && <span className="yt-sidebar-heading">{group.heading}</span>}
                {group.items.map((item, ii) => (
                  <span key={ii} className={`yt-sidebar-item ${gi === 0 && ii === 0 ? "active" : ""}`}>
                    <span className="yt-side-icon" aria-hidden>
                      <SidebarIcon name={item.icon} />
                    </span>
                    <span>{item.label}</span>
                  </span>
                ))}
              </div>
            ))}
          </aside>

          <div className="yt-main">
            <div className="yt-chip-row">
              {ONBOARDING_FEED.tags.slice(0, visibleTagCount).map((tag, index) => (
                <span
                  key={tag}
                  className={`yt-chip ${index === visibleTagCount - 1 ? "is-selected" : ""}`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* {(!feedReady || visibleSectionCount === 0) && (
              <div className="yt-empty-feed-spacer">
                <span>{feedReady ? "scroll" : "loading taste profile"}</span>
              </div>
            )} */}

            {visibleSections.map((section, sectionIndex) => (
              <FeedSectionView section={section} sectionIndex={sectionIndex} key={`${section.type}-${sectionIndex}`} />
            ))}

            <div ref={loadMoreRef} className={`yt-load-marker ${showFinal ? "is-final" : ""}`}>
              {showFinal || !feedReady ? "" : ""}
            </div>
          </div>
        </div>
      </section>
      )}

      {showFinal && (
        <section className="feed-end">
          <div className="feed-end-inner">
            <h2 className="feed-end-title">search for yourself.</h2>
            <span className="feed-end-caret" aria-hidden />
            <form onSubmit={submit} className="onboarding-search">
              <input
                autoFocus
                type="text"
                value={searchValue}
                placeholder="search for yourself..."
                onChange={(e) => setSearchValue(e.target.value)}
                className="home-search-input"
                onFocus={(e) => (e.target.style.borderColor = "var(--text)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
              />
              <button type="submit" className="home-search-button">
                Search
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}

function FeedSectionView({ section, sectionIndex }: { section: FeedSection; sectionIndex: number }) {
  if (section.type === "grid") {
    return (
      <section className="yt-grid yt-section" aria-label="recommended videos">
        {section.items.map((video, index) => (
          <VideoCard
            video={video}
            index={index}
            key={video.title}
            animationOffset={sectionIndex * 0.08}
          />
        ))}
      </section>
    );
  }

  if (section.type === "shorts") {
    return (
      <section className="yt-shorts-shelf yt-section" aria-label="shorts shelf">
        <div className="yt-shelf-title-row">
          <span className="yt-shorts-mark" aria-hidden />
          <h2>{section.title}</h2>
          <span className="yt-kebab" aria-hidden>⋮</span>
        </div>
        <div className="yt-shorts-row">
          {section.items.map((short, index) => (
            <article className="yt-short-card" key={short.title} style={{ animationDelay: `${0.08 * index}s` }}>
              <div className={`yt-short-thumb yt-thumb-${short.tone}`}>
                <strong>{short.title}</strong>
                <span className="yt-short-views" aria-hidden>
                  <span className="yt-short-play" />
                  {short.views}
                </span>
              </div>
              <div className="yt-short-copy">
                <h3>{short.title}</h3>
                <span className="yt-kebab" aria-hidden>⋮</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "shelf") {
    return (
      <section className="yt-news-shelf yt-section" aria-label={section.title}>
        <div className="yt-news-heading">
          <h2>{section.title}</h2>
          <p>{section.subtitle}</p>
        </div>
        <div className="yt-grid">
          {section.items.map((video, index) => (
            <VideoCard
              video={video}
              index={index}
              key={video.title}
              animationOffset={sectionIndex * 0.08}
            />
          ))}
        </div>
      </section>
    );
  }

  return null;
}

function VideoCard({
  video,
  index,
  animationOffset = 0,
}: {
  video: FeedVideo;
  index: number;
  animationOffset?: number;
}) {
  const sponsored = video.variant === "sponsored";
  return (
    <article
      className={`yt-video-card ${sponsored ? "is-sponsored" : ""}`}
      style={{ animationDelay: `${animationOffset + 0.08 * index}s` }}
    >
      <div className={`yt-thumb yt-thumb-${video.tone}`}>
        {sponsored && <span className="yt-ad-badge">ad</span>}
        <span className="yt-duration">{video.duration}</span>
        <strong>{video.thumbnailText ?? video.title}</strong>
      </div>
      <div className="yt-card-row">
        <span className="yt-avatar">{video.avatar ?? video.channel?.slice(0, 2) ?? "yt"}</span>
        <div className="yt-card-copy">
          <h2>{video.title}</h2>
          <span className="yt-channel">
            {video.channel}
            <span className="yt-verified" aria-hidden>✓</span>
          </span>
          <span className="yt-card-meta">{sponsored ? "sponsored · ad" : video.meta}</span>
        </div>
        <span className="yt-kebab" aria-hidden>⋮</span>
      </div>
    </article>
  );
}
