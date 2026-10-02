import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AddressInfo } from "node:net";
import { startUiServer } from "../src/ui-server.js";

const run = promisify(execFile);
let server: http.Server;
let base: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end('{"hello":"world"}');
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function cli(args: string[]) {
  try {
    const { stdout, stderr } = await run("node", ["dist/index.js", ...args], { cwd: process.cwd() });
    return { code: 0, stdout, stderr };
  } catch (err: any) {
    return { code: err.code ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

describe("CLI", () => {
  it("prints pretty JSON for a URL", async () => {
    const r = await cli([base]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("HTTP 200");
    expect(r.stdout).toContain('"hello": "world"');
  });

  it("--help exits 0", async () => {
    const r = await cli(["--help"]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("Usage: httpal");
  });

  it("missing URL exits 2", async () => {
    const r = await cli([]);
    expect(r.code).toBe(2);
  });

  it("invalid URL exits 2", async () => {
    const r = await cli(["notaurl"]);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain("Invalid URL");
  });

  it("--timing prints the waterfall", async () => {
    const r = await cli(["--timing", base]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("Timing");
    expect(r.stdout).toContain("TTFB");
  });

  it("--fail exits 1 on 404", async () => {
    const s = http.createServer((_req, res) => res.writeHead(404).end());
    await new Promise<void>((r) => s.listen(0, r));
    const port = (s.address() as AddressInfo).port;
    const r = await cli(["--fail", `http://127.0.0.1:${port}/`]);
    expect(r.code).toBe(1);
    await new Promise((r2) => s.close(r2));
  });

  it("snapshot save then diff reports changes", async () => {
    let n = 0;
    const s = http.createServer((_req, res) => {
      n++;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(`{"n":${n}}`);
    });
    await new Promise<void>((r) => s.listen(0, r));
    const port = (s.address() as AddressInfo).port;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "httpal-cli-snap-"));
    const env = { ...process.env, HTTPAL_SNAPSHOT_DIR: dir };
    const { execFile } = await import("node:child_process");
    const exec = (args: string[]) =>
      new Promise<{ code: number; stdout: string }>((resolve) => {
        execFile("node", ["dist/index.js", ...args], { env }, (err, stdout) => {
          resolve({ code: err ? (err as any).code ?? 1 : 0, stdout: stdout ?? "" });
        });
      });
    const target = `http://127.0.0.1:${port}/x`;
    const save = await exec(["--snapshot", "save", target]);
    expect(save.code).toBe(0);
    expect(save.stdout).toContain("Snapshot saved");
    const diff = await exec(["--snapshot", "diff", target]);
    expect(diff.code).toBe(1);
    expect(diff.stdout).toContain("diff vs snapshot");
    await new Promise((r2) => s.close(r2));
  });

  it("ui server serves the page and proxies requests", async () => {
    const ui = await startUiServer(0);
    const addr = ui.address() as AddressInfo;
    try {
      const page = await fetch(`http://127.0.0.1:${addr.port}/`);
      expect(page.status).toBe(200);
      expect(await page.text()).toContain("<title>HTTPal</title>");

      const api = await fetch(`http://127.0.0.1:${addr.port}/api/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: base, method: "GET" }),
      });
      const j = await api.json();
      expect(j.status).toBe(200);
      expect(j.body).toContain("hello");
      expect(j.timing).toBeTruthy();

      const err = await fetch(`http://127.0.0.1:${addr.port}/api/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: "http://127.0.0.1:1/" }),
      });
      const jerr = await err.json();
      expect(jerr.error).toMatch(/Request failed/);
    } finally {
      ui.close();
    }
  });
});
