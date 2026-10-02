import http from "node:http";
import { sendRequest } from "./client.js";
import type { CliOptions } from "./args.js";
import { saveSnapshot, loadSnapshot } from "./snapshot.js";
import { diffBodies } from "./diff.js";
import { PAGE } from "./ui-page.js";


export function startUiServer(port = 4242): Promise<http.Server> {
  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(PAGE);
      return;
    }
    if (req.method === "POST" && req.url === "/api/request") {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", async () => {
        try {
          const input = JSON.parse(data) as { url: string; method?: string; headers?: Record<string, string>; body?: string };
          const options: CliOptions = {
            url: input.url,
            method: input.method ?? "GET",
            headers: input.headers ?? {},
            body: input.body,
            verbose: false,
            includeHeaders: true,
            timeout: 30000,
            followRedirects: true,
            fail: false,
            timing: true,
            sanitize: true,
            watchMs: 0,
            snapshot: "off",
          };
          const result = await sendRequest(options);
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
      });
      return;
    }
    if (req.method === "POST" && req.url === "/api/snapshot") {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", async () => {
        try {
          const input = JSON.parse(data) as {
            mode: "save" | "diff";
            url: string;
            method?: string;
            headers?: Record<string, string>;
            body?: string;
          };
          const options: CliOptions = {
            url: input.url,
            method: input.method ?? "GET",
            headers: input.headers ?? {},
            body: input.body,
            verbose: false,
            includeHeaders: true,
            timeout: 30000,
            followRedirects: true,
            fail: false,
            timing: true,
            sanitize: true,
            watchMs: 0,
            snapshot: input.mode,
          };
          const result = await sendRequest(options);
          if (input.mode === "save") {
            const file = saveSnapshot(options, result);
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true, file, status: result.status }));
            return;
          }
          const prev = loadSnapshot(options);
          const changed = !prev || prev.body !== result.body || prev.status !== result.status;
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({
            changed,
            hasSnapshot: prev !== null,
            diff: prev ? (changed ? diffBodies(prev.body, result.body) : "(no changes)") : null,
            status: result.status,
            previousStatus: prev?.status ?? null,
          }));
        } catch (error) {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
      });
      return;
    }
    res.writeHead(404);
    res.end("not found");
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}
