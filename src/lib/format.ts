export function formatPercent(pct: number, decimals = 1): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(decimals)}`;
}

/**
 * Strips Markdown syntax to plain text for compact previews (insight cards, etc.).
 * Removes headings, emphasis, code fences/spans, links, blockquotes, list markers,
 * and collapses whitespace so a 2-line clamp never cuts mid-token.
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")          // fenced code blocks
    .replace(/`([^`]+)`/g, "$1")               // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")     // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")   // links -> text
    .replace(/^#{1,6}\s+/gm, "")               // headings
    .replace(/^\s*>\s?/gm, "")                 // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "")             // bullet markers
    .replace(/^\s*\d+\.\s+/gm, "")             // ordered list markers
    .replace(/(\*\*|__)(.*?)\1/g, "$2")        // bold
    .replace(/(\*|_)(.*?)\1/g, "$2")           // italic
    .replace(/~~(.*?)~~/g, "$2")               // strikethrough
    .replace(/\s+/g, " ")                       // collapse whitespace/newlines
    .trim();
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
