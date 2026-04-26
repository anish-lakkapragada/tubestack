import BackButton from "../components/BackButton";

const SKETCH_FONT = "'Kalam', 'Comic Sans MS', 'Marker Felt', cursive";

function Diagram1() {
  // before → after: a busy video thumbnail collapses into a clean paragraph.
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "auto" }} fill="none" stroke="currentColor">
      {/* busy "video" rectangle on the left with chaotic lines inside */}
      <path d="M20,30 L200,28 L202,155 L18,158 Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32,52 Q80,45 120,58 T195,50" strokeWidth="1.5" opacity="0.55" />
      <path d="M28,80 Q60,90 100,78 T190,88" strokeWidth="1.5" opacity="0.55" />
      <path d="M30,108 Q80,100 130,115 T190,105" strokeWidth="1.5" opacity="0.55" />
      <path d="M32,132 Q70,140 110,130 T190,140" strokeWidth="1.5" opacity="0.55" />
      <circle cx="110" cy="95" r="22" strokeWidth="2.5" />
      <path d="M101,82 L101,108 L124,95 Z" strokeWidth="2" fill="currentColor" />
      <text x="110" y="184" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="14" stroke="none" fill="currentColor" opacity="0.7">video. noisy. addictive.</text>

      {/* arrow */}
      <path d="M230,95 L330,95" strokeWidth="2" strokeLinecap="round" />
      <path d="M320,86 L332,95 L320,104" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="280" y="82" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="13" stroke="none" fill="currentColor" opacity="0.7">tubestack</text>

      {/* calm paragraph block on the right */}
      <path d="M360,30 L540,30 L540,158 L360,158 Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M375,55 L525,55" strokeWidth="1.4" opacity="0.6" />
      <path d="M375,72 L520,72" strokeWidth="1.4" opacity="0.6" />
      <path d="M375,89 L500,89" strokeWidth="1.4" opacity="0.6" />
      <path d="M375,115 L525,115" strokeWidth="1.4" opacity="0.6" />
      <path d="M375,132 L510,132" strokeWidth="1.4" opacity="0.6" />
      <text x="450" y="184" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="14" stroke="none" fill="currentColor" opacity="0.7">just words. you + them.</text>
    </svg>
  );
}

function Diagram2() {
  // Data flow: webview → rust → innertube. the trick.
  return (
    <svg viewBox="0 0 560 220" style={{ width: "100%", height: "auto" }} fill="none" stroke="currentColor">
      {/* webview box */}
      <path d="M20,50 Q16,48 18,42 L145,40 Q152,42 150,50 L152,130 Q150,136 145,135 L20,137 Q14,133 18,128 Z" strokeWidth="2" />
      <text x="85" y="78" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="15" stroke="none" fill="currentColor">webview</text>
      <text x="85" y="100" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="11" stroke="none" fill="currentColor" opacity="0.65">(react ui)</text>
      <text x="85" y="118" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="11" stroke="none" fill="currentColor" opacity="0.65">blocked by cors</text>

      <path d="M155,88 L225,88" strokeWidth="2" strokeLinecap="round" />
      <path d="M215,80 L227,88 L215,96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="190" y="76" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="12" stroke="none" fill="currentColor" opacity="0.7">call</text>

      {/* rust box */}
      <path d="M230,50 Q228,48 231,42 L355,40 Q362,42 360,50 L362,130 Q360,136 355,135 L230,137 Q225,133 230,128 Z" strokeWidth="2" />
      <text x="295" y="78" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="15" stroke="none" fill="currentColor">rust (tauri)</text>
      <text x="295" y="100" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="11" stroke="none" fill="currentColor" opacity="0.65">pretends to be</text>
      <text x="295" y="118" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="11" stroke="none" fill="currentColor" opacity="0.65">youtube.com</text>

      <path d="M365,88 L435,88" strokeWidth="2" strokeLinecap="round" />
      <path d="M425,80 L437,88 L425,96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="400" y="76" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="12" stroke="none" fill="currentColor" opacity="0.7">fetch</text>

      {/* innertube box */}
      <path d="M440,50 Q438,48 441,42 L540,40 Q547,42 545,50 L547,130 Q545,136 540,135 L440,137 Q435,133 440,128 Z" strokeWidth="2" />
      <text x="493" y="78" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="15" stroke="none" fill="currentColor">innertube</text>
      <text x="493" y="100" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="11" stroke="none" fill="currentColor" opacity="0.65">(yt's private</text>
      <text x="493" y="118" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="11" stroke="none" fill="currentColor" opacity="0.65">api. no key.)</text>

      <text x="280" y="180" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="13" stroke="none" fill="currentColor" opacity="0.7">0 quota. 0 $. 0 api key.</text>
      <path d="M170,195 Q260,210 370,195" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}

function Diagram3() {
  // lock loop: click 5:00 → fullscreen + no backspace → countdown → unlock
  return (
    <svg viewBox="0 0 560 200" style={{ width: "100%", height: "auto" }} fill="none" stroke="currentColor">
      <circle cx="70" cy="100" r="44" strokeWidth="2" />
      <text x="70" y="96" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="13" stroke="none" fill="currentColor">click</text>
      <text x="70" y="114" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="13" stroke="none" fill="currentColor">lock</text>

      <path d="M118,100 L195,100" strokeWidth="2" strokeLinecap="round" />
      <path d="M186,92 L197,100 L186,108" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M210,60 L340,60 L340,140 L210,140 Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="275" y="92" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="14" stroke="none" fill="currentColor">5:00 → 0:00</text>
      <text x="275" y="112" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="11" stroke="none" fill="currentColor" opacity="0.65">fullscreen · no esc</text>
      <text x="275" y="128" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="11" stroke="none" fill="currentColor" opacity="0.65">no backspace · no cmd+w</text>

      <path d="M355,100 L430,100" strokeWidth="2" strokeLinecap="round" />
      <path d="M421,92 L432,100 L421,108" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      <circle cx="490" cy="100" r="44" strokeWidth="2" />
      <text x="490" y="96" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="13" stroke="none" fill="currentColor">you</text>
      <text x="490" y="114" textAnchor="middle" fontFamily={SKETCH_FONT} fontSize="13" stroke="none" fill="currentColor">read</text>
    </svg>
  );
}

export default function About() {
  return (
    <main style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px", paddingTop: "64px", paddingBottom: "120px" }}>
      <BackButton />

      <h1 style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginTop: "40px", marginBottom: "24px", lineHeight: 1.15 }}>
        images fry our brain.
      </h1>

      <p style={{ fontSize: "1.0625rem", color: "var(--text)", lineHeight: 1.75, marginBottom: "16px" }}>
        youtube is the biggest single-location attention sink ever built. thumbnails engineered by teams
        of people to hijack your glance. autoplay. infinite scroll. the algorithm doesn't serve you —
        you serve it.
      </p>
      <p style={{ fontSize: "1.0625rem", color: "var(--text)", lineHeight: 1.75, marginBottom: "32px" }}>
        tubestack strips all of that. you search. you read. no recs, no thumbnails, no faces staring back,
        no autoplay. a youtube video becomes what it always could've been: a blog post.
      </p>

      <h2 style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--muted)", marginBottom: "14px" }}>
        the idea
      </h2>
      <div style={{ color: "var(--text)", marginBottom: "44px" }}>
        <Diagram1 />
      </div>

      <h2 style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--muted)", marginBottom: "14px" }}>
        how it works
      </h2>
      <p style={{ fontSize: "1rem", color: "var(--text)", lineHeight: 1.7, marginBottom: "20px" }}>
        this app doesn't talk to youtube's official data api (which would need a key, an .env file, and
        a daily quota). it talks to <em style={{ fontStyle: "italic" }}>innertube</em> — the private
        api youtube's own mobile/web apps use. no auth, no quota.
      </p>
      <p style={{ fontSize: "1rem", color: "var(--text)", lineHeight: 1.7, marginBottom: "24px" }}>
        the trick: webview can't reach innertube directly (cors blocks it), so all http calls tunnel
        through the rust side of tauri. rust doesn't care about cors. it tells youtube "i'm
        youtube.com" and youtube believes it.
      </p>
      <div style={{ color: "var(--text)", marginBottom: "44px" }}>
        <Diagram2 />
      </div>

      <h2 style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--muted)", marginBottom: "14px" }}>
        the 5-minute lock
      </h2>
      <p style={{ fontSize: "1rem", color: "var(--text)", lineHeight: 1.7, marginBottom: "24px" }}>
        attention is a muscle and it's gotten weak. click <strong>lock 5:00</strong> at the bottom to
        force yourself to actually finish reading. fullscreen turns on. backspace, esc, cmd+w, cmd+left
        — all neutered. no exit until the timer hits zero. no cancel button. that's the whole point.
      </p>
      <div style={{ color: "var(--text)", marginBottom: "56px" }}>
        <Diagram3 />
      </div>

      <div style={{ paddingTop: "40px", borderTop: "1px solid var(--border)", fontSize: "0.9375rem", color: "var(--desc)", lineHeight: 1.7 }}>
        <p style={{ marginBottom: "8px" }}>built by anish. yale '27.</p>
        <p>
          contact:{" "}
          <a
            href="mailto:anish.lakkapragada@yale.edu"
            style={{ color: "var(--text)", textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            anish.lakkapragada@yale.edu
          </a>
        </p>
      </div>
    </main>
  );
}
