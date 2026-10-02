import type { HttpResult } from "./client.js";
import type { CliOptions } from "./args.js";

const isJson = (contentType: string) => /\bjson\b/i.test(contentType);

export function formatBody(result: HttpResult, maxLines = 0): string {
  const trimmed = result.body;
  let out: string;
  if (isJson(result.contentType)) {
    try {
      out = JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      out = trimmed;
    }
  } else {
    out = trimmed;
  }
  if (maxLines > 0) {
    const lines = out.split("\n");
    if (lines.length > maxLines) out = lines.slice(0, maxLines).join("\n") + "\n[truncated]";
  }
  return out;
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return "\x1b[32m"; // green
  if (status >= 300 && status < 400) return "\x1b[33m"; // yellow
  if (status >= 400 && status < 500) return "\x1b[31m"; // red
  return "\x1b[35m"; // magenta for 5xx/others
}

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

function useColor(): boolean {
  return process.stdout.isTTY === true && process.env["NO_COLOR"] === undefined;
}

export function statusLine(result: HttpResult): string {
  const color = useColor() ? statusColor(result.status) : "";
  const reset = useColor() ? RESET : "";
  const dim = useColor() ? DIM : "";
  let line = `${color}HTTP ${result.status} ${result.statusText}${reset} ${dim}(${result.durationMs}ms)${reset}`;
  if (result.redirected) line += ` ${dim}[redirected]${reset}`;
  return line;
}

export function renderHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function renderRequest(options: CliOptions): string {
  const lines = [`> ${options.method} ${options.url}`];
  for (const [k, v] of Object.entries(options.headers)) lines.push(`> ${k}: ${v}`);
  if (options.body) lines.push(`>`, `> ${options.body}`);
  return lines.join("\n");
}

export function renderResult(result: HttpResult, options: CliOptions): string {
  const parts: string[] = [];
  if (options.verbose) {
    parts.push(renderRequest(options), "");
  }
  parts.push(statusLine(result));
  if (options.verbose || options.includeHeaders) {
    parts.push(renderHeaders(result.headers));
  }
  parts.push("");
  if (!options.output) {
    parts.push(formatBody(result));
  }
  return parts.join("\n");
}
