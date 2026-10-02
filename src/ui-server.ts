import http from "node:http";
import { sendRequest } from "./client.js";
import type { CliOptions } from "./args.js";

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>HTTPal</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: ui-monospace, Menlo, monospace; background: #0d1117; color: #c9d1d9; margin: 0; padding: 2rem; }
  h1 { margin-top: 0; }
  .row { display: flex; gap: .5rem; margin-bottom: .75rem; }
  input, select, textarea, button { background: #161b22; color: #c9d1d9; border: 1px solid #30363d; border-radius: 6px; padding: .5rem; font: inherit; }
  input[name=url] { flex: 1; }
  button { cursor: pointer; background: #238636; border-color: #238636; color: white; }
  textarea { width: 100%; min-height: 80px; box-sizing: border-box; }
  pre { white-space: pre-wrap; word-break: break-word; background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 1rem; max-height: 50vh; overflow: auto; }
  .status { font-weight: bold; }
  .ok { color: #3fb950; } .warn { color: #d29922; } .err { color: #f85149; }
  .timing span { display: inline-block; height: 10px; margin-right: 1px; }
</style>
</head>
<body>
<h1>HTTPal</h1>
<div class="row">
  <select id="method"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option><option>HEAD</option><option>OPTIONS</option></select>
  <input id="url" name="url" placeholder="https://api.github.com/users/google" />
  <button id="send">Send</button>
</div>
<textarea id="headers" placeholder="Accept: application/json\nAuthorization: Bearer ..."></textarea>
<textarea id="body" placeholder='{"key": "value"}'></textarea>
<h2 id="status"></h2>
<div id="timing"></div>
<h3>Response headers</h3>
<pre id="respHeaders"></pre>
<h3>Body</h3>
<pre id="respBody"></pre>
<script>
const $ = (id) => document.getElementById(id);
$("send").onclick = async () => {
  const headers = {};
  for (const line of $("headers").value.split("\\n")) {
    const i = line.indexOf(":");
    if (i > 0) headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  $("status").textContent = "Sending...";
  try {
    const r = await fetch("/api/request", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: $("url").value, method: $("method").value, headers, body: $("body").value || undefined }),
    });
    const j = await r.json();
    if (j.error) { $("status").textContent = "Error: " + j.error; return; }
    const cls = j.status < 300 ? "ok" : j.status < 400 ? "warn" : "err";
    $("status").innerHTML = '<span class="status ' + cls + '"></span> (' + j.durationMs + 'ms)';
    $("status").firstChild.textContent = "HTTP " + j.status + " " + j.statusText;
    $("respHeaders").textContent = Object.entries(j.headers).map(([k, v]) => k + ": " + v).join("\\n");
    let body = j.body;
    try { body = JSON.stringify(JSON.parse(body), null, 2); } catch {}
    $("respBody").textContent = body;
    if (j.timing) {
      const t = j.timing;
      const parts = [["DNS", t.dns, "#58a6ff"], ["TCP", Math.max(t.connect - t.secure, 0), "#3fb950"], ["TLS", t.secure, "#d29922"], ["TTFB", t.ttfb, "#bc8cff"], ["Download", t.download, "#f778ba"]];
      const scale = 200 / Math.max(t.total, 1);
      $("timing").innerHTML = "<div class='timing'>" + parts.map(([l, v, c]) =>
        "<span title='" + l + " " + v + "ms' style='width:" + Math.max(v * scale, 2) + "px;background:" + c + "'></span>").join("") +
        "</div>Total " + t.total + "ms";
    }
  } catch (e) { $("status").textContent = "Error: " + e.message; }
};
</script>
</body>
</html>`;

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
    res.writeHead(404);
    res.end("not found");
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}
