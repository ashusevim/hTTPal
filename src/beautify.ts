const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr",
]);

/** A small dependency-free HTML/XML pretty-printer. */
export function formatHtml(input: string): string {
  const trimmed = input.trim();
  const tokens = trimmed.replace(/>\s+</g, "><").split(/(<[^>]+>)/g).filter((t) => t.length > 0);
  let depth = 0;
  const out: string[] = [];
  for (const token of tokens) {
    if (token.startsWith("</")) {
      depth = Math.max(depth - 1, 0);
      out.push("  ".repeat(depth) + token.trim());
    } else if (token.startsWith("<")) {
      const tag = token.slice(1, token.indexOf(" ") > 0 ? token.indexOf(" ") : token.indexOf(">")).replace(/\/$/, "").toLowerCase();
      const selfCloses = token.endsWith("/>") || VOID.has(tag);
      const isDecl = token.startsWith("<!") || token.startsWith("<?");
      out.push("  ".repeat(depth) + token.trim());
      if (!selfCloses && !isDecl && !token.startsWith("<!--")) depth++;
    } else {
      const text = token.trim();
      if (text) out.push("  ".repeat(depth) + text);
    }
  }
  return out.join("\n");
}

export function isHtmlLike(contentType: string): boolean {
  return /\b(html|xml|xhtml|svg)\b/i.test(contentType);
}
