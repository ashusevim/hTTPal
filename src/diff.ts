/**
 * Produce a human-readable diff between two response bodies.
 * JSON bodies are compared structurally (key paths); everything else
 * falls back to a line-based text diff.
 */
export function diffBodies(previous: string, current: string): string {
  const a = tryParse(previous);
  const b = tryParse(current);
  if (a !== undefined && b !== undefined) {
    const lines = diffJson(a, b, "");
    return lines.length ? lines.join("\n") : "(no changes)";
  }
  return diffText(previous, current);
}

function tryParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

function diffJson(a: unknown, b: unknown, path: string): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (isObject(a) && isObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const out: string[] = [];
    for (const k of keys) {
      const p = path ? `${path}.${k}` : k;
      if (!(k in a)) out.push(`+ ${p}: ${format(b as Record<string, unknown>)[k]}`);
      else if (!(k in b)) out.push(`- ${p}: ${format(a as Record<string, unknown>)[k]}`);
      else out.push(...diffJson((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], p));
    }
    return out;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const out: string[] = [];
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (i >= a.length) out.push(`+ ${path}[${i}]: ${JSON.stringify(b[i])}`);
      else if (i >= b.length) out.push(`- ${path}[${i}]: ${JSON.stringify(a[i])}`);
      else out.push(...diffJson(a[i], b[i], `${path}[${i}]`));
    }
    return out;
  }
  return [`~ ${path || "(root)"}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function format(v: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) out[k] = JSON.stringify(val);
  return out;
}

function diffText(a: string, b: string): string {
  const la = a.split("\n");
  const lb = b.split("\n");
  const out: string[] = [];
  const max = Math.max(la.length, lb.length);
  for (let i = 0; i < max; i++) {
    if (la[i] === lb[i]) out.push(`  ${la[i] ?? ""}`);
    else {
      if (la[i] !== undefined) out.push(`- ${la[i]}`);
      if (lb[i] !== undefined) out.push(`+ ${lb[i]}`);
    }
  }
  return out.join("\n");
}
