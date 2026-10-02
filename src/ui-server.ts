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
  :root {
    --bg: #0F172A; --card: #1B2336; --muted: #272F42; --border: #475569;
    --fg: #F8FAFC; --muted-fg: #94A3B8; --accent: #22C55E; --danger: #EF4444;
    --warn: #EAB308; --info: #3B82F6;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem; background: var(--bg); color: var(--fg);
    font-family: 'IBM Plex Sans', system-ui, sans-serif; line-height: 1.5;
  }
  h1, h2, h3 { font-family: 'JetBrains Mono', monospace; margin: 0 0 .75rem; }
  h1 { font-size: 1.4rem; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
  .row { display: flex; gap: .5rem; flex-wrap: wrap; }
  label { display: block; font-size: .8rem; color: var(--muted-fg); margin-bottom: .25rem; }
  input, select, textarea, button {
    background: var(--muted); color: var(--fg); border: 1px solid var(--border);
    border-radius: 6px; padding: .5rem .75rem; font: inherit; transition: border-color 150ms ease, box-shadow 150ms ease;
  }
  input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible {
    outline: 2px solid var(--info); outline-offset: 2px; border-color: var(--info);
  }
  input[name=url] { flex: 1; min-width: 200px; font-family: 'JetBrains Mono', monospace; }
  textarea { width: 100%; min-height: 70px; font-family: 'JetBrains Mono', monospace; font-size: .85rem; }
  button { background: var(--accent); border-color: var(--accent); color: #0F172A; font-weight: 600; cursor: pointer; }
  button:hover { filter: brightness(1.1); }
  button:disabled { opacity: .5; cursor: not-allowed; }
  pre {
    white-space: pre-wrap; word-break: break-word; background: var(--bg); border: 1px solid var(--border);
    border-radius: 6px; padding: 1rem; max-height: 45vh; overflow: auto;
    font-family: 'JetBrains Mono', monospace; font-size: .85rem;
  }
  .status-ok { color: var(--accent); } .status-warn { color: var(--warn); } .status-err { color: var(--danger); }
  .pill { display: inline-block; padding: .1rem .5rem; border-radius: 999px; font-size: .8rem; font-weight: 600; }
  .timing-bar { display: flex; height: 12px; border-radius: 4px; overflow: hidden; margin: .5rem 0; }
  .timing-bar span { display: block; height: 100%; }
  .legend { display: flex; gap: 1rem; flex-wrap: wrap; font-size: .75rem; color: var(--muted-fg); }
  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
  [role="alert"] { border-color: var(--danger); color: var(--danger); padding: .75rem 1rem; border-radius: 6px; margin-top: 1rem; }
  .grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  @media (min-width: 900px) { .grid { grid-template-columns: 1fr 1fr; } }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
</head>
<body>
<h1>HTTPal</h1>

<div class="card">
  <div class="row">
    <div>
      <label for="method">Method</label>
      <select id="method" aria-label="HTTP method">
        <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option><option>HEAD</option><option>OPTIONS</option>
      </select>
    </div>
    <div style="flex:1">
      <label for="url">URL</label>
      <input id="url" name="url" placeholder="https://api.github.com/users/google" aria-label="Request URL" />
    </div>
    <div>
      <label>&nbsp;</label>
      <button id="send">Send</button>
    </div>
  </div>
  <div style="margin-top:.75rem">
    <label for="headers">Headers (one per line)</label>
    <textarea id="headers" placeholder="Accept: application/json"></textarea>
  </div>
  <div style="margin-top:.75rem">
    <label for="body">Body</label>
    <textarea id="body" placeholder='{"key": "value"}'></textarea>
  </div>
  <div id="error" role="alert" hidden></div>
</div>

<div class="card" id="result" hidden>
  <h2 id="status"></h2>
  <div id="timing"></div>
  <div class="grid" style="margin-top:1rem">
    <div>
      <h3>Response headers</h3>
      <pre id="respHeaders"></pre>
    </div>
    <div>
      <h3>Body</h3>
      <pre id="respBody"></pre>
    </div>
  </div>
</div>

<script>
const $ = (id) => document.getElementById(id);
const COLORS = { DNS: "#3B82F6", TCP: "#22C55E", TLS: "#EAB308", TTFB: "#A78BFA", Download: "#F472B6" };

async function send() {
  const headers = {};
  for (const line of $("headers").value.split("\\n")) {
    const i = line.indexOf(":");
    if (i > 0) headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  $("send").disabled = true;
  $("error").hidden = true;
  try {
    const r = await fetch("/api/request", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: $("url").value, method: $("method").value, headers, body: $("body").value || undefined }),
    });
    const j = await r.json();
    if (j.error) {
      $("error").textContent = j.error;
      $("error").hidden = false;
      $("result").hidden = true;
      return;
    }
    $("result").hidden = false;
    const cls = j.status < 300 ? "status-ok" : j.status < 400 ? "status-warn" : "status-err";
    $("status").innerHTML = '<span class="' + cls + '"></span> <span style="color:var(--muted-fg);font-size:.8rem">(' + j.durationMs + 'ms)</span>';
    $("status").firstChild.textContent = "HTTP " + j.status + " " + j.statusText;
    $("respHeaders").textContent = Object.entries(j.headers).map(([k, v]) => k + ": " + v).join("\\n");
    let body = j.body;
    try { body = JSON.stringify(JSON.parse(body), null, 2); } catch {}
    $("respBody").textContent = body;
    if (j.timing) {
      const t = j.timing;
      const parts = [["DNS", t.dns], ["TCP", Math.max(t.connect - t.secure, 0)], ["TLS", t.secure], ["TTFB", t.ttfb], ["Download", t.download]];
      $("timing").innerHTML =
        '<h3 style="margin-top:0">Timing — ' + t.total + 'ms total</h3>' +
        '<div class="timing-bar">' + parts.map(([l, v]) =>
          '<span title="' + l + ' ' + v + 'ms" style="width:' + (v / t.total * 100) + '%;background:' + COLORS[l] + '"></span>').join("") + '</div>' +
        '<div class="legend">' + parts.map(([l, v]) =>
          '<span><i style="background:' + COLORS[l] + '"></i>' + l + ' ' + v + 'ms</span>').join("") + '</div>';
    }
  } catch (e) {
    $("error").textContent = e.message;
    $("error").hidden = false;
  } finally {
    $("send").disabled = false;
  }
}
$("send").onclick = send;
$("url").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
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
