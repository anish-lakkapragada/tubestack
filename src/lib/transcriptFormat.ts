import { TranscriptSegment } from "./youtube";

export type TranscriptMode = "essay" | "podcast";

// YouTube auto-captions (ASR) come back lowercase, unpunctuated, and littered
// with [music]/[applause] annotations. We reconstruct prose by:
//   1. stripping bracket annotations and speaker tags (">>")
//   2. fixing lone "i" -> "I" and contractions
//   3. inferring sentence breaks from timestamp gaps between segments
//   4. capitalizing the first letter of each inferred sentence
//   5. grouping ~4 sentences into each paragraph
const BRACKET_NOISE = /\[(?:music|applause|laughter|cheering|background [^\]]*|inaudible|noise|silence|pause|sigh|sighs|coughing)\]/gi;
const SOFT_SENTENCE_START = /\b(?:okay|ok|so|well|now|today|thanks|thank you|just a quick announcement|anything you want to add|let's|lets|if you have questions|coming up|you can sign up|we have|we're|were|you describe yourself|you got|you went on|which firm|very close|no no)\b/i;
const HARD_SENTENCE_END = /[.?!]["')\]]?$/;
const WEAK_SENTENCE_END = /\b(?:a|an|and|are|as|at|because|but|by|for|from|if|in|into|is|like|not|of|on|only|or|so|that|the|their|then|this|to|very|was|were|which|who|with|without|you|your)\.?["')\]]?$/i;
const CONTINUATION_START = /^(?:and|as|because|but|for|from|in|into|of|on|only|or|so|that|then|to|when|where|which|who|with|without|your)\b/i;
const SPEAKER_START = /^(?:[-–]\s*)?(?:\[[^\]]+\]|[a-z][a-z .'-]{1,34}:)\s*/i;
const RESPONSE_START = /^(?:absolutely|correct|exactly|great|i agree|i mean|no|okay|right|sure|thank you|thanks|that's right|totally|well|yeah|yes|yep)\b/i;
const DISCOURSE_BOUNDARY = /^(?:after graduation|as i got|as i've|but as|finally|first|from a young age|i remember|i purposely|i think|i'm now|in college|in fact|ironically|knowing|last year|my parents|not knowing|of course|recently|second|the first|the second|the third|third|ultimately|when the reporter|while it would)\b/i;
const CLAUSE_BOUNDARY = /^(?:every|i|it|my|not|that|the|there|these|this|we|when|which|you)\b/i;

function cleanSegment(text: string): string {
  let t = text.replace(BRACKET_NOISE, " ").replace(/>>+/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  t = t.replace(/\b(um|uh|erm|hmm)\b/gi, " ");
  t = t.replace(/\bi\b/g, "I");
  t = t.replace(/\bi('|\u2019)(m|ve|ll|d|s|re)\b/gi, (_, apo, suffix) => "I" + apo + suffix.toLowerCase());
  return t.replace(/\s+/g, " ").trim();
}

function isBadBreakBoundary(currentText: string, nextText: string): boolean {
  if (!nextText) return false;
  if (WEAK_SENTENCE_END.test(currentText)) return true;
  if (CONTINUATION_START.test(nextText)) return true;
  return /^[a-z]/.test(nextText);
}

function repairBadJoins(text: string): string {
  return text.replace(
    /\b(a|an|and|are|as|at|because|but|by|for|from|if|in|into|is|like|not|of|on|only|or|so|that|the|their|then|this|to|very|was|were|which|who|with|without|you|your)\. ([A-Z][a-z])/g,
    "$1 $2",
  );
}

function finishSentence(text: string): string {
  const t = text
    .replace(/\s+([.?!,;:])/g, "$1")
    .replace(/([.?!])\s*([.?!])+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return "";
  const finished = HARD_SENTENCE_END.test(t) ? t : `${t}.`;
  return repairBadJoins(finished);
}

function splitLongSentence(sentence: string, mode: TranscriptMode): string[] {
  const words: string[] = sentence.match(/\S+/g) ?? [];
  const maxWords = mode === "podcast" ? 34 : 58;
  const minWords = mode === "podcast" ? 10 : 18;
  if (words.length <= maxWords) return [sentence];

  const chunks: string[] = [];
  let remaining = words;

  while (remaining.length > maxWords) {
    let best = -1;
    let bestScore = -Infinity;
    const upper = Math.min(remaining.length - 6, maxWords + 18);

    for (let i = minWords; i <= upper; i += 1) {
      const next = remaining.slice(i, i + 7).join(" ").toLowerCase().replace(/^[^a-z0-9]+/, "");
      const prev = remaining[i - 1]?.toLowerCase().replace(/[^a-z0-9']+$/g, "") ?? "";
      let score = 0;

      if (i <= maxWords) score += 4;
      else score += Math.max(0, 8 - (i - maxWords));
      if (DISCOURSE_BOUNDARY.test(next)) score += 12;
      if (i >= maxWords - 8 && CLAUSE_BOUNDARY.test(next)) score += 5;
      if (/^(?:and|because|but|or|so|that|to|with|without|of|in|on|for|from)$/.test(prev)) score -= 10;
      if (CONTINUATION_START.test(next) && !DISCOURSE_BOUNDARY.test(next)) score -= 5;
      if (/[,:;]$/.test(remaining[i - 1] ?? "")) score += 3;

      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }

    if (best < 0 || bestScore < 4) best = maxWords;
    chunks.push(finishSentence(remaining.slice(0, best).join(" ")));
    remaining = remaining.slice(best);
  }

  if (remaining.length > 0) chunks.push(finishSentence(remaining.join(" ")));
  return chunks.filter(Boolean);
}

function groupEssaySentences(sentences: string[]): string[] {
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

function groupPodcastSentences(sentences: string[]): string[] {
  const paragraphs: string[] = [];
  let current: string[] = [];
  let words = 0;

  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length;
    const startsSpeaker = SPEAKER_START.test(sentence);
    const startsResponse = RESPONSE_START.test(sentence);
    if (
      current.length > 0 &&
      (
        startsSpeaker ||
        startsResponse ||
        current.length >= 2 ||
        words + sentenceWords > 46 ||
        /[?]["')\]]?$/.test(current[current.length - 1])
      )
    ) {
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

function buildSentences(transcript: TranscriptSegment[], mode: TranscriptMode): string[] {
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
    const badBoundary = isBadBreakBoundary(text, nextText);
    const maxWords = mode === "podcast" ? 20 : 28;
    const softGap = mode === "podcast" ? 320 : 420;
    const hardGap = mode === "podcast" ? 700 : 850;
    const shouldBreak =
      !next ||
      (!badBoundary && HARD_SENTENCE_END.test(text)) ||
      (!badBoundary && gap > hardGap) ||
      (!badBoundary && wordCount >= maxWords) ||
      (!badBoundary && wordCount >= 10 && gap > softGap && SOFT_SENTENCE_START.test(nextText)) ||
      (mode === "podcast" && !badBoundary && (SPEAKER_START.test(nextText) || RESPONSE_START.test(nextText)));

    if (shouldBreak) {
      sentences.push(...splitLongSentence(finishSentence(current.join(" ")), mode));
      current = [];
      wordCount = 0;
    }
  }

  if (current.length > 0) sentences.push(...splitLongSentence(finishSentence(current.join(" ")), mode));

  return sentences
    .map((s) => s.replace(/\s+([.?!,;:])/g, "$1").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

export function toEssayParagraphs(transcript: TranscriptSegment[]): string[] {
  const cleaned = buildSentences(transcript, "essay");
  if (cleaned.length === 0) return [];
  return groupEssaySentences(cleaned);
}

export function toPodcastParagraphs(transcript: TranscriptSegment[]): string[] {
  const cleaned = buildSentences(transcript, "podcast");
  if (cleaned.length === 0) return [];
  return groupPodcastSentences(cleaned);
}

export function formatTranscript(transcript: TranscriptSegment[], mode: TranscriptMode): string[] {
  return mode === "podcast" ? toPodcastParagraphs(transcript) : toEssayParagraphs(transcript);
}

export function toParagraphs(transcript: TranscriptSegment[]): string[] {
  return toEssayParagraphs(transcript);
}

export function firstWords(text: string, limit: number): string {
  let seen = 0;
  let end = text.length;

  for (const match of text.matchAll(/\S+/g)) {
    seen += 1;
    if (seen > limit) {
      end = match.index ?? text.length;
      break;
    }
  }

  return text.slice(0, end).trimEnd();
}
