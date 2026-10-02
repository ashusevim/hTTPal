export const PAGE = `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>HTTPal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root[data-theme="light"] {
    --bg:#FAFAF7; --sidebar:#F3F2EB; --card:#F3F1EA; --border:#E2E0D5; --border2:#D6D4C8;
    --fg:#16171A; --muted-fg:#6B6E66; --ink:#16171A; --ink-fg:#FAFAF7;
    --ok:#1A7F37; --warn:#9A6700; --err:#CF222E; --accent:#0057D8;
    --t-dns:#0057D8; --t-tcp:#1A7F37; --t-tls:#9A6700; --t-ttfb:#8250DF; --t-dl:#CF222E;
    color-scheme: light;
  }
  :root[data-theme="dark"] {
    --bg:#111214; --sidebar:#16181C; --card:#17191F; --border:#262932; --border2:#343845;
    --fg:#E8E9EC; --muted-fg:#9BA0A8; --ink:#E8E9EC; --ink-fg:#111214;
    --ok:#3FB950; --warn:#D29922; --err:#F85149; --accent:#6E9BFF;
    --t-dns:#6E9BFF; --t-tcp:#3FB950; --t-tls:#D29922; --t-ttfb:#A78BFA; --t-dl:#F85149;
    color-scheme: dark;
  }
  * { box-sizing: border-box; scrollbar-width: thin; scrollbar-color: var(--border2) transparent; }
  [hidden] { display: none !important; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border: 3px solid transparent; background-clip: padding-box; border-radius: 999px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--muted-fg); background-clip: padding-box; }
  ::selection { background: color-mix(in srgb, var(--accent) 25%, transparent); }
  html, body { height: 100%; }
  body { margin: 0; background: var(--bg); color: var(--fg); font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; overflow: hidden; }
  h1,h2,h3,.mono { font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace; letter-spacing: -.01em; }
  #url, #respBody, #respHeaders, #snapPre, #headers, #body { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; }
  input, select, textarea, button { font: inherit; color: var(--fg); background: var(--bg); border: 1px solid var(--border); padding: .5rem .7rem; border-radius: 4px; }
  input:hover, select:hover, textarea:hover { border-color: var(--border2); }
  input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent); }
  button { cursor: pointer; transition: border-color 120ms, background 120ms, color 120ms, opacity 120ms; }
  button:active { opacity: .8; }
  ::placeholder { color: var(--muted-fg); opacity: .75; }
  input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
  input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  label { font-size: .78rem; color: var(--muted-fg); margin-bottom: .25rem; display: block; }

  /* history rail */
  #sidebar { width: 208px; background: var(--sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: .9rem; }
  .brand { padding-bottom: .7rem; border-bottom: 1px solid var(--border); }
  .brand h1 { font-size: 1rem; margin: 0; }
  .brand .tag { display: block; color: var(--muted-fg); font-size: .68rem; margin-top: .2rem; font-family: 'IBM Plex Sans', sans-serif; letter-spacing: 0; }
  #railHead { display: flex; justify-content: space-between; align-items: center; padding: .75rem 0 .3rem; }
  #railHead span { font-size: .72rem; color: var(--muted-fg); }
  #clearHist { background: transparent; border: none; color: var(--muted-fg); font-size: .72rem; padding: .15rem .3rem; border-radius: 3px; }
  #clearHist:hover { color: var(--err); }
  #history { flex: 1; min-height: 0; overflow-y: auto; }
  .hist-item { padding: .45rem .35rem; cursor: pointer; border-bottom: 1px solid var(--border); border-radius: 3px; }
  .hist-item:hover { background: var(--bg); }
  .hist-item:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
  .hist-top { display: flex; justify-content: space-between; align-items: baseline; }
  .hist-item .m { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: .76rem; }
  .hist-item .s { font-family: 'JetBrains Mono', monospace; font-size: .72rem; font-weight: 600; }
  .hist-item .u { display: block; color: var(--muted-fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: .15rem; font-size: .74rem; }
  .hist-item .u .h { color: var(--fg); font-weight: 500; }
  .railEmpty { color: var(--muted-fg); font-size: .74rem; line-height: 1.5; padding: .4rem .1rem; }

  /* main column: topbar -> request -> status -> timing -> results */
  main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

  #topbar { display: flex; align-items: center; gap: .5rem; padding: .7rem 1.25rem; border-bottom: 1px solid var(--border); }
  #method { width: auto; }
  #url { flex: 1; min-width: 0; max-width: 560px; font-size: .88rem; }
  #midCluster { display: flex; align-items: center; gap: .5rem; margin: 0 auto; }
  #watchMs { width: 72px; padding: .5rem .55rem; font-size: .85rem; }
  #watchToggle:hover { border-color: var(--muted-fg); }
  #watchToggle.active { background: var(--ink); color: var(--ink-fg); border-color: var(--ink); }
  #kbdHint { font-family: 'JetBrains Mono', monospace; font-size: .7rem; color: var(--muted-fg); border: 1px solid var(--border); background: var(--card); border-radius: 3px; padding: .2rem .4rem; user-select: none; pointer-events: none; }
  #send { background: var(--ink); color: var(--ink-fg); border-color: var(--ink); font-weight: 600; padding: .5rem 1.3rem; min-width: 82px; display: inline-flex; align-items: center; justify-content: center; }
  #send .spinner { border-color: var(--ink-fg); border-top-color: transparent; }
  #send:hover { opacity: .88; }
  #send:disabled { opacity: .6; cursor: wait; }
  #themeToggle { background: transparent; padding: .5rem .55rem; display: inline-flex; align-items: center; justify-content: center; }
  #themeToggle:hover { border-color: var(--border2); }
  [data-theme="light"] .ico-sun { display: none; }
  [data-theme="dark"] .ico-moon { display: none; }

  #reqRow { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; padding: .7rem 1.25rem; border-bottom: 1px solid var(--border); }
  #reqRow textarea { height: 72px; min-height: 48px; max-height: 40vh; resize: vertical; background: var(--card); font-size: .8rem; width: 100%; }

  #statusBar { display: flex; align-items: center; gap: .6rem; padding: .5rem 1.25rem; border-bottom: 1px solid var(--border); min-height: 44px; }
  #status { display: flex; align-items: center; gap: .5rem; min-width: 0; }
  .hint { color: var(--muted-fg); font-size: .78rem; }
  .pill { border: 1px solid currentColor; font-family: 'JetBrains Mono', monospace; font-size: .8rem; font-weight: 600; padding: .1rem .5rem; }
  .ok { color: var(--ok); } .warn { color: var(--warn); } .err { color: var(--err); }
  #actions { margin-left: auto; display: flex; gap: .4rem; align-items: center; }
  #actions button { padding: .25rem .6rem; font-size: .75rem; background: transparent; }
  #actions button:hover { border-color: var(--muted-fg); }
  #snapMsg { font-size: .75rem; color: var(--muted-fg); max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  #timingWrap { padding: .4rem 1.25rem .55rem; border-bottom: 1px solid var(--border); }
  .timing-bar { display: flex; height: 10px; overflow: hidden; margin: 0 0 .35rem; border-radius: 2px; }
  .timing-bar .seg { display: block; height: 100%; }
  .seg-dns { background: var(--t-dns); } .seg-tcp { background: var(--t-tcp); } .seg-tls { background: var(--t-tls); }
  .seg-ttfb { background: var(--t-ttfb); } .seg-dl { background: var(--t-dl); }
  .legend { display: flex; gap: .9rem; flex-wrap: wrap; font-size: .72rem; color: var(--muted-fg); }
  .legend i { display: inline-block; width: 8px; height: 8px; margin-right: 3px; border-radius: 1px; }
  .sw-dns { background: var(--t-dns); } .sw-tcp { background: var(--t-tcp); } .sw-tls { background: var(--t-tls); }
  .sw-ttfb { background: var(--t-ttfb); } .sw-dl { background: var(--t-dl); }

  #snapOutLayer { padding: .5rem 1.25rem; border-bottom: 1px solid var(--border); }
  #snapPre { max-height: 120px; }
  #error { margin: .6rem 1.25rem; border: 1px solid var(--err); color: var(--err); padding: .6rem .8rem; }
  #emptyState { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--muted-fg); font-size: .85rem; }

  #resPanels { flex: 1; min-height: 0; display: grid; grid-template-columns: 3fr 2fr; }
  .resp { min-height: 0; display: flex; flex-direction: column; padding: .7rem 1.25rem; }
  .resp:first-child { border-right: 1px solid var(--border); }
  .resp h3 { margin: 0 0 .4rem; font-size: .78rem; color: var(--muted-fg); font-weight: 600; }
  pre { background: var(--card); border: 1px solid var(--border); padding: .8rem; margin: 0; overflow: auto;
        font-family: 'JetBrains Mono', monospace; font-size: .8rem; white-space: pre-wrap; word-break: break-word; }
  pre:hover { border-color: var(--border2); }
  #respBody, #respHeaders { flex: 1; min-height: 0; }

  .j-key { color: #0550AE; } .j-str { color: #116329; } .j-num { color: #953800; } .j-bool { color: #8250DF; } .j-null { color: #6B6E66; }
  [data-theme="dark"] .j-key { color: #79C0FF; } [data-theme="dark"] .j-str { color: #7EE787; } [data-theme="dark"] .j-num { color: #FFA657; } [data-theme="dark"] .j-bool { color: #FF7B72; } [data-theme="dark"] .j-null { color: #9BA0A8; }
  .spinner { display: inline-block; width: 13px; height: 13px; border: 2px solid var(--fg); border-top-color: transparent; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: -2px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } * { transition: none !important; } }
  @media (max-width: 1024px) { #kbdHint { display: none; } }
  @media (max-width: 820px) {
    body { flex-direction: column; overflow: auto; }
    #sidebar { width: 100%; max-height: 40vh; border-right: none; border-bottom: 1px solid var(--border); }
    #reqRow, #resPanels { display: block; }
    .resp { height: 45vh; border-right: none; }
    #url { max-width: none; }
    main { overflow: visible; }
  }
</style>
</head>
<body>
<aside id="sidebar">
  <div class="brand">
    <h1>HTTPal</h1>
    <span class="tag">zero-dependency HTTP client</span>
  </div>
  <div id="railHead"><span>History</span><button id="clearHist" hidden>Clear</button></div>
  <div id="history" aria-live="polite"></div>
</aside>

<main>
  <div id="topbar">
    <select id="method" aria-label="HTTP method"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option><option>HEAD</option><option>OPTIONS</option></select>
    <input id="url" aria-label="Request URL" placeholder="https://api.github.com/users/google?flag=true" autocomplete="off" spellcheck="false" />
    <div id="midCluster">
      <input id="watchMs" type="number" min="200" step="100" value="2000" aria-label="Watch interval ms" title="Watch interval (ms)">
      <button id="watchToggle" aria-pressed="false" title="Poll this URL repeatedly">Watch</button>
    </div>
    <kbd id="kbdHint" aria-hidden="true"></kbd>
    <button id="send" title="Send (Ctrl+Enter)">Send</button>
    <button id="themeToggle" title="Toggle dark/light" aria-label="Toggle theme">
      <svg class="ico-moon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      <svg class="ico-sun" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    </button>
  </div>

  <div id="reqRow">
    <div><label for="headers">Headers</label><textarea id="headers" placeholder="Accept: application/json" spellcheck="false"></textarea></div>
    <div><label for="body">Body</label><textarea id="body" placeholder='{"key": "value"}' spellcheck="false"></textarea></div>
  </div>

  <div id="error" role="alert" hidden></div>

  <div id="statusBar">
    <span id="status"><span class="hint">No response yet</span></span>
    <div id="actions">
      <button id="saveSnap">Save snapshot</button>
      <button id="diffSnap">Diff vs snapshot</button>
      <span id="snapMsg"></span>
    </div>
  </div>

  <div id="timingWrap" hidden></div>
  <div id="snapOutLayer" hidden><pre id="snapPre"></pre></div>

  <div id="emptyState">Send a request — the response body and headers show up here.</div>

  <section id="resPanels" hidden>
    <div class="resp"><h3>Body</h3><pre id="respBody"></pre></div>
    <div class="resp"><h3>Headers</h3><pre id="respHeaders"></pre></div>
  </section>
</main>

<script>
const $ = (id) => document.getElementById(id);
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
$('kbdHint').textContent = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘↵' : 'Ctrl↵';

/* theme */
const savedTheme = localStorage.getItem('httpal-theme');
const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', savedTheme || (prefersDark ? 'dark' : 'light'));
$('themeToggle').onclick = () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('httpal-theme', next);
};

/* history */
function getHistory() { try { return JSON.parse(localStorage.getItem('httpal-history') || '[]'); } catch { return []; } }
function pushHistory(entry) {
  const h = [entry, ...getHistory().filter(x => x.url !== entry.url || x.method !== entry.method)].slice(0, 30);
  localStorage.setItem('httpal-history', JSON.stringify(h));
  renderHistory();
}
function renderHistory() {
  const items = getHistory();
  $('clearHist').hidden = !items.length;
  $('history').innerHTML = items.length ? items.map((h, i) => {
    let host = h.url, path = '';
    try { const u = new URL(h.url); host = u.host; path = u.pathname + u.search; } catch {}
    const cls = h.status < 300 ? 'ok' : h.status < 400 ? 'warn' : 'err';
    return '<div class="hist-item" data-i="' + i + '" tabindex="0" title="' + esc(h.url) + '">' +
      '<div class="hist-top"><span class="m">' + esc(h.method) + '</span><span class="s ' + cls + '">' + h.status + '</span></div>' +
      '<span class="u"><span class="h">' + esc(host) + '</span>' + (path && path !== '/' ? esc(path) : '') + '</span>' +
      '</div>';
  }).join('') : '<div class="railEmpty">No requests yet — responses you send will be listed here.</div>';
  document.querySelectorAll('.hist-item').forEach(el => {
    const load = () => {
      const h = getHistory()[+el.dataset.i];
      $('url').value = h.url; $('method').value = h.method;
    };
    el.onclick = load;
    el.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); load(); } };
  });
}
$('clearHist').onclick = () => { localStorage.removeItem('httpal-history'); renderHistory(); };
renderHistory();

/* helpers */
function highlight(json) {
  return json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/("(\\\\.|[^"\\\\])*")(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(\\.\\d+)?([eE][+-]?\\d+)?/g, m => {
    let cls = 'j-num';
    if (m.startsWith('"')) cls = m.endsWith(':') ? 'j-key' : 'j-str';
    else if (/true|false/.test(m)) cls = 'j-bool';
    else if (/null/.test(m)) cls = 'j-null';
    if (cls === 'j-key') return '<span class="j-key">' + m.replace(/:$/, '') + '</span>:';
    return '<span class="' + cls + '">' + m + '</span>';
  });
}
function currentRequestBody() {
  const headers = {};
  for (const line of $('headers').value.split('\\n')) {
    const i = line.indexOf(':');
    if (i > 0) headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { url: $('url').value, method: $('method').value, headers, body: $('body').value || undefined };
}
function renderTiming(t) {
  const parts = [['DNS', t.dns, 'dns'], ['TCP', Math.max(t.connect - t.secure, 0), 'tcp'], ['TLS', t.secure, 'tls'], ['TTFB', t.ttfb, 'ttfb'], ['Download', t.download, 'dl']];
  $('timingWrap').innerHTML =
    '<div class="timing-bar">' + parts.map(([l, v, k]) => '<span class="seg seg-' + k + '" title="' + l + ' ' + v + 'ms" style="width:' + Math.max(v / t.total * 100, .5) + '%"></span>').join('') + '</div>' +
    '<div class="legend">' + parts.map(([l, v, k]) => '<span><i class="sw sw-' + k + '"></i>' + l + ' ' + v + 'ms</span>').join('') + '</div>';
}
function renderResult(j, extra) {
  const cls = j.status < 300 ? 'ok' : j.status < 400 ? 'warn' : 'err';
  const text = j.statusText ? ' ' + j.statusText : '';
  $('status').innerHTML = '<span class="pill ' + cls + '">HTTP ' + j.status + esc(text) + '</span>' +
    '<span style="color:var(--muted-fg);font-size:.78rem">' + j.durationMs + 'ms' + (extra || '') + '</span>';
  if (j.timing) { renderTiming(j.timing); $('timingWrap').hidden = false; } else { $('timingWrap').hidden = true; }
  $('respHeaders').textContent = Object.entries(j.headers).map(([k, v]) => k + ': ' + v).join('\\n');
  let body = j.formatted || j.body, isJson = false;
  try { body = JSON.stringify(JSON.parse(body), null, 2); isJson = true; } catch {}
  $('respBody').innerHTML = isJson ? highlight(body) : body.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  $('emptyState').hidden = true;
  $('resPanels').hidden = false;
}

async function send() {
  if ($('send').disabled) return;
  $('send').disabled = true;
  $('send').innerHTML = '<span class="spinner"></span>';
  $('error').hidden = true;
  try {
    const r = await fetch('/api/request', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(currentRequestBody()),
    });
    const j = await r.json();
    if (j.error) { $('error').textContent = j.error; $('error').hidden = false; return; }
    pushHistory({ url: $('url').value, method: $('method').value, status: j.status });
    renderResult(j);
  } catch (e) { $('error').textContent = e.message; $('error').hidden = false; }
  finally { $('send').disabled = false; $('send').textContent = 'Send'; }
}
$('send').onclick = send;
$('url').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send(); });

/* snapshot */
$('saveSnap').onclick = async () => {
  $('snapMsg').textContent = 'Saving...';
  const r = await fetch('/api/snapshot', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'save', ...currentRequestBody() }) });
  const j = await r.json();
  $('snapMsg').textContent = j.error ? j.error : ('Saved (HTTP ' + j.status + ')');
};
$('diffSnap').onclick = async () => {
  $('snapMsg').textContent = 'Comparing...';
  const r = await fetch('/api/snapshot', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'diff', ...currentRequestBody() }) });
  const j = await r.json();
  if (j.error) { $('snapMsg').textContent = j.error; return; }
  if (!j.hasSnapshot) { $('snapMsg').textContent = 'No snapshot saved yet.'; return; }
  $('snapMsg').textContent = j.changed ? 'Changed (status ' + j.previousStatus + ' -> ' + j.status + ')' : 'No changes';
  $('snapOutLayer').hidden = false;
  $('snapPre').textContent = j.diff;
};

/* watch */
let watchTimer = null;
$('watchToggle').onclick = () => {
  const btn = $('watchToggle');
  if (watchTimer) {
    clearInterval(watchTimer); watchTimer = null;
    btn.textContent = 'Watch'; btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false');
    return;
  }
  const ms = Math.max(Number($('watchMs').value) || 2000, 200);
  btn.textContent = 'Stop'; btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
  let prev = null;
  watchTimer = setInterval(async () => {
    const r = await fetch('/api/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(currentRequestBody()) });
    const j = await r.json();
    if (j.error) return;
    renderResult(j, prev !== null ? (prev !== j.body ? '  · changed' : '  · no change') : '');
    prev = j.body;
  }, ms);
};
</script>
</body>
</html>`;
