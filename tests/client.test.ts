import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { sendRequest } from "../src/client.js";
import { formatBody, statusLine, renderTiming } from "../src/format.js";
import type { CliOptions } from "../src/args.js";

let server: http.Server;
let base: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === "/json") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end('{"ok":true,"n":1}');
    } else if (req.url === "/text") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("hello world");
    } else if (req.url === "/status/404") {
      res.writeHead(404, { "content-type": "application/json" });
      res.end('{"error":"nope"}');
    } else if (req.url === "/redirect") {
      res.writeHead(302, { location: "/json" });
      res.end();
    } else if (req.url === "/slow") {
      setTimeout(() => res.end("late"), 2000);
    } else if (req.url === "/echo" && req.method === "POST") {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ body: data, ct: req.headers["content-type"] }));
      });
    } else {
      res.writeHead(200);
      res.end("ok");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function opts(overrides: Partial<CliOptions>): CliOptions {
  return {
    url: `${base}/json`,
    method: "GET",
    headers: {},
    verbose: false,
    includeHeaders: false,
    timeout: 5000,
    followRedirects: true,
    fail: false,
    timing: false,
    ...overrides,
  };
}

describe("sendRequest", () => {
  it("GET returns parsed result", async () => {
    const r = await sendRequest(opts({}));
    expect(r.status).toBe(200);
    expect(JSON.parse(r.body)).toEqual({ ok: true, n: 1 });
    expect(r.contentType).toContain("application/json");
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("POST sends body and content-type", async () => {
    const r = await sendRequest(
      opts({ url: `${base}/echo`, method: "POST", body: '{"x":2}', headers: { "Content-Type": "application/json" } }),
    );
    const parsed = JSON.parse(r.body);
    expect(parsed.body).toBe('{"x":2}');
    expect(parsed.ct).toBe("application/json");
  });

  it("follows redirects by default", async () => {
    const r = await sendRequest(opts({ url: `${base}/redirect` }));
    expect(r.redirected).toBe(true);
    expect(r.status).toBe(200);
  });

  it("does not follow redirects with manual mode", async () => {
    const r = await sendRequest(opts({ url: `${base}/redirect`, followRedirects: false }));
    expect(r.status).toBe(302);
    expect(r.redirected).toBe(false);
  });

  it("times out slow requests", async () => {
    await expect(sendRequest(opts({ url: `${base}/slow`, timeout: 200 }))).rejects.toThrow(/timed out/);
  });

  it("captures timing phases", async () => {
    const r = await sendRequest(opts({}));
    expect(r.timing).not.toBeNull();
    expect(r.timing!.ttfb).toBeGreaterThanOrEqual(0);
    expect(r.timing!.download).toBeGreaterThanOrEqual(0);
    expect(r.timing!.total).toBeGreaterThanOrEqual(0);
  });

  it("wraps connection errors", async () => {
    await expect(sendRequest(opts({ url: "http://127.0.0.1:1/" }))).rejects.toThrow(/Request failed/);
  });
});

describe("formatBody", () => {
  it("pretty-prints JSON", () => {
    const out = formatBody({ status: 200, statusText: "OK", headers: {}, body: '{"a":1}', contentType: "application/json", durationMs: 1, redirected: false, timing: null });
    expect(out).toBe('{\n  "a": 1\n}');
  });

  it("passes through non-JSON", () => {
    const out = formatBody({ status: 200, statusText: "OK", headers: {}, body: "plain", contentType: "text/plain", durationMs: 1, redirected: false, timing: null });
    expect(out).toBe("plain");
  });

  it("falls back to raw on invalid JSON content-type", () => {
    const out = formatBody({ status: 200, statusText: "OK", headers: {}, body: "not json", contentType: "application/json", durationMs: 1, redirected: false, timing: null });
    expect(out).toBe("not json");
  });
});

describe("renderTiming", () => {
  it("renders all phases with bars", () => {
    const out = renderTiming({
      status: 200, statusText: "OK", headers: {}, body: "", contentType: "",
      durationMs: 100, redirected: false,
      timing: { dns: 1, connect: 10, secure: 5, ttfb: 40, download: 9, total: 60 },
    });
    expect(out).toContain("DNS lookup");
    expect(out).toContain("TLS handshake");
    expect(out).toContain("Wait (TTFB)");
    expect(out).toContain("Download");
    expect(out).toContain("total 60ms");
    expect(out).toContain("█");
  });

  it("handles missing timing", () => {
    const out = renderTiming({
      status: 200, statusText: "OK", headers: {}, body: "", contentType: "",
      durationMs: 1, redirected: false, timing: null,
    });
    expect(out).toContain("unavailable");
  });
});

describe("statusLine", () => {
  it("formats status and duration", () => {
    const line = statusLine({ status: 404, statusText: "Not Found", headers: {}, body: "", contentType: "", durationMs: 12, redirected: false, timing: null });
    expect(line).toContain("404");
    expect(line).toContain("Not Found");
    expect(line).toContain("12ms");
  });
});
