import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import type { CliOptions } from "./args.js";
import type { HttpResult } from "./client.js";

export interface Snapshot {
  url: string;
  method: string;
  status: number;
  savedAt: string;
  body: string;
}

/** Directory for snapshots; overridable via HTTPAL_SNAPSHOT_DIR (used in tests). */
export function snapshotDir(): string {
  return process.env["HTTPAL_SNAPSHOT_DIR"] ?? path.join(os.homedir(), ".httpal", "snapshots");
}

export function snapshotPath(options: CliOptions): string {
  const key = crypto
    .createHash("sha1")
    .update(`${options.method} ${options.url}`)
    .digest("hex")
    .slice(0, 16);
  const safeHost = (() => {
    try {
      return new URL(options.url).host.replace(/[^a-z0-9.-]/gi, "_");
    } catch {
      return "unknown";
    }
  })();
  return path.join(snapshotDir(), `${options.method.toLowerCase()}-${safeHost}-${key}.json`);
}

export function saveSnapshot(options: CliOptions, result: HttpResult): string {
  const file = snapshotPath(options);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const snap: Snapshot = {
    url: options.url,
    method: options.method,
    status: result.status,
    savedAt: new Date().toISOString(),
    body: result.body,
  };
  fs.writeFileSync(file, JSON.stringify(snap, null, 2));
  return file;
}

export function loadSnapshot(options: CliOptions): Snapshot | null {
  const file = snapshotPath(options);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Snapshot;
  } catch {
    return null;
  }
}
