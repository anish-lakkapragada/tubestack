import { Fragment, MouseEvent, ReactNode } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";

type MarkdownArticleProps = {
  markdown: string;
  slots?: Record<string, ReactNode>;
};

type InlineToken =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "em"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string }
  | { type: "icon"; name: string };

const INLINE_RE = /(`([^`]+)`)|(\{\{code:([^}]+)\}\})|(\{\{icon:([a-z0-9-]+)\}\})|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/g;

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ type: "text", text: text.slice(lastIndex, index) });
    }

    if (match[2]) {
      tokens.push({ type: "code", text: match[2] });
    } else if (match[4]) {
      tokens.push({ type: "code", text: match[4] });
    } else if (match[6]) {
      tokens.push({ type: "icon", name: match[6] });
    } else if (match[8]) {
      tokens.push({ type: "strong", text: match[8] });
    } else if (match[10]) {
      tokens.push({ type: "em", text: match[10] });
    } else if (match[12] && match[13]) {
      tokens.push({ type: "link", text: match[12], href: match[13] });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", text: text.slice(lastIndex) });
  }

  return tokens;
}

function isExternalHref(href: string) {
  return /^(https?:|mailto:)/i.test(href);
}

function MarkdownLink({ href, children }: { href: string; children: ReactNode }) {
  async function openExternal(e: MouseEvent<HTMLAnchorElement>) {
    if (!isExternalHref(href)) return;
    e.preventDefault();
    try {
      await openUrl(href);
    } catch {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <a href={href} onClick={openExternal}>
      {children}
    </a>
  );
}

function InlineMarkdown({ text, slots }: { text: string; slots: Record<string, ReactNode> }) {
  return (
    <>
      {parseInline(text).map((token, index) => {
        if (token.type === "strong") {
          return <strong key={index}>{token.text}</strong>;
        }
        if (token.type === "em") {
          return <em key={index}>{token.text}</em>;
        }
        if (token.type === "code") {
          return <code key={index}>{token.text}</code>;
        }
        if (token.type === "link") {
          return (
            <MarkdownLink key={index} href={token.href}>
              {token.text}
            </MarkdownLink>
          );
        }
        if (token.type === "icon") {
          return (
            <span key={index} className="markdown-inline-icon">
              {slots[token.name] ?? null}
            </span>
          );
        }
        return <Fragment key={index}>{token.text}</Fragment>;
      })}
    </>
  );
}

export default function MarkdownArticle({ markdown, slots = {} }: MarkdownArticleProps) {
  const blocks = markdown
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <article className="markdown-article">
      {blocks.map((block, index) => {
        if (block.startsWith("# ")) {
          return (
            <h1 key={index}>
              <InlineMarkdown text={block.slice(2)} slots={slots} />
            </h1>
          );
        }

        if (block.startsWith("## ")) {
          return (
            <h2 key={index}>
              <InlineMarkdown text={block.slice(3)} slots={slots} />
            </h2>
          );
        }

        const slotMatch = block.match(/^\{\{diagram:([a-z0-9-]+)\}\}$/);
        if (slotMatch) {
          return (
            <div key={index} className="markdown-slot">
              {slots[slotMatch[1]] ?? null}
            </div>
          );
        }

        return (
          <p key={index}>
            <InlineMarkdown text={block.replace(/\n/g, " ")} slots={slots} />
          </p>
        );
      })}
    </article>
  );
}
