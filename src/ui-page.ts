export const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>HTTPal</title>
<style>
  :root {
    --bg:#0F172A; --sidebar:#111A2E; --card:#1B2336; --muted:#272F42; --border:#33415C;
    --fg:#F1F5F9; --muted-fg:#94A3B8; --accent:#22C55E; --danger:#EF4444; --warn:#EAB308;
    --info:#60A5FA; --purple:#A78BFA; --pink:#F472B6;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { margin: 0; background: var(--bg); color: var(--fg); font-family: 'IBM Plex Sans', system-ui, sans-serif; display: flex; }
  h1,h2,h3,.mono { font-family: 'JetBrains Mono', monospace; }

  /* Sidebar */
  #sidebar { width: 260px; background: var(--sidebar); border-right: 1px solid var(--border); padding: 1rem; display: flex; flex-direction: column; gap: .5rem; }
  #sidebar h1 { font-size: 1.1rem; margin: 0 0 .5rem; }
  #history { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: .35rem; }
  .hist-item { padding: .5rem .6rem; border-radius: 6px; cursor: pointer; border: 1px solid transparent; font-size: .78rem; }
  .hist-item:hover { background: var(--muted); }
  .hist-item .m { font-family: 'JetBrains Mono', monospace; font-weight: 700; margin-right: .4rem; }
  .hist-item .u { color: var(--muted-fg); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hist-item .s { float: right; }
  #clearHist { background: transparent; border: 1px solid var(--border); color: var(--muted-fg); border-radius: 6px; padding: .35rem; cursor: pointer; font-size: .75rem; }
  #clearHist:hover { color: var(--danger); border-color: var(--danger); }

  main { flex: 1; padding: 1.5rem; max-width: 1100px; overflow-y: auto; }

  .sendbar { display: flex; gap: .5rem; align-items: flex-end; }
  .sendbar > div { display: flex; flex-direction: column; }
  label { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted-fg); margin-bottom: .3rem; }
  input, select, textarea, button {
    background: var(--muted); color: var(--fg); border: 1px solid var(--border); border-radius: 6px;
    padding: .55rem .75rem; font: inherit; transition: border-color 150ms, box-shadow 150ms;
  }
  input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible, .tab:focus-visible {
    outline: 2px solid var(--info); outline-offset: 1px; border-color: var(--info);
  }
  #url { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: .85rem; }
  .grow { flex: 1; }
  #send { background: var(--accent); border-color: var(--accent); color: #052e16; font-weight: 700; cursor: pointer; padding: .55rem 1.4rem; }
  #send:hover { filter: brightness(1.12); }
  #send:disabled { opacity: .5; cursor: wait; }

  .tabs { display: flex; gap: .25rem; margin: 1rem 0 .5rem; border-bottom: 1px solid var(--border); }
  .tab { background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--muted-fg); padding: .4rem .8rem; cursor: pointer; font-size: .85rem; }
  .tab.active { color: var(--fg); border-bottom-color: var(--accent); }
  .panel { display: none; }
  .panel.active { display: block; }
  .kv { display: grid; grid-template-columns: 1fr 1fr 2rem; gap: .4rem; margin-bottom: .4rem; }
  textarea { width: 100%; min-height: 110px; font-family: 'JetBrains Mono', monospace; font-size: .82rem; }

  .pill { display: inline-block; padding: .15rem .6rem; border-radius: 999px; font-weight: 700; font-family: 'JetBrains Mono', monospace; font-size: .85rem; }
  .ok { background: rgba(34,197,94,.15); color: var(--accent); }
  .warn { background: rgba(234,179,8,.15); color: var(--warn); }
  .err { background: rgba(239,68,68,.15); color: var(--danger); }

  #result { margin-top: 1.25rem; }
  pre { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; max-height: 48vh; overflow: auto;
        font-family: 'JetBrains Mono', monospace; font-size: .82rem; white-space: pre-wrap; word-break: break-word; }
  .timing-bar { display: flex; height: 14px; border-radius: 4px; overflow: hidden; margin: .4rem 0; }
  .legend { display: flex; gap: 1rem; flex-wrap: wrap; font-size: .72rem; color: var(--muted-fg); }
  .legend i { display: inline-block; width: 9px; height: 9px; border-radius: 2px; margin-right: 4px; vertical-align: baseline; }
  [role="alert"] { border: 1px solid var(--danger); color: var(--danger); padding: .75rem 1rem; border-radius: 6px; margin-top: 1rem; }
  .j-key { color: #7DD3FC; } .j-str { color: #86EFAC; } .j-num { color: #FBBF24; } .j-bool { color: #F472B6; } .j-null { color: #94A3B8; }
  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--accent); border-top-color: transparent; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: -2px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } * { transition: none !important; } }
  @media (max-width: 760px) { body { flex-direction: column; } #sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border); } }
</style>
</head>
<body>
<aside id="sidebar">
  <h1>HTTPal</h1>
  <div id="history" aria-live="polite"></div>
  <button id="clearHist">Clear history</button>
</aside>

<main>
  <div class="card sendbar" style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem">
    <div>
      <label for="method">Method</label>
      <select id="method"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option><option>HEAD</option><option>OPTIONS</option></select>
    </div>
    <div class="grow">
      <label for="url">URL</label>
      <input id="url" placeholder="https://api.github.com/users/google" autocomplete="off" />
    </div>
    <button id="send" title="Send (Ctrl+Enter)">Send</button>
  </div>

  <div class="tabs" role="tablist">
    <button class="tab active" data-tab="params">Params</button>
    <button class="tab" data-tab="headers">Headers</button>
    <button class="tab" data-tab="body">Body</button>
  </div>
  <div id="tab-params" class="panel active">
    <div id="params"></div>
    <button id="addParam" style="background:transparent;border:1px dashed var(--border);color:var(--muted-fg);width:100%;padding:.4rem;border-radius:6px;cursor:pointer">+ Add param</button>
  </div>
  <div id="tab-headers" class="panel">
    <textarea id="headers" placeholder="Accept: application/json"></textarea>
  </div>
  <div id="tab-body" class="panel">
    <textarea id="body" placeholder='{"key": "value"}'></textarea>
  </div>

  <div id="error" role="alert" hidden></div>

  <section id="result" hidden>
    <h2 id="status" style="margin:0 0 .5rem"></h2>
    <div id="timingWrap"></div>
    <div class="row" style="margin:.5rem 0;gap:.4rem;align-items:center">
      <button id="saveSnap" style="padding:.3rem .7rem;font-size:.78rem">Save snapshot</button>
      <button id="diffSnap" style="padding:.3rem .7rem;font-size:.78rem;background:var(--muted);color:var(--fg);border:1px solid var(--border)">Diff vs snapshot</button>
      <span id="watchWrap">
        <input id="watchMs" type="number" min="200" step="100" value="2000" style="width:90px;padding:.3rem .5rem;font-size:.78rem" aria-label="Watch interval ms">
        <button id="watchToggle" style="padding:.3rem .7rem;font-size:.78rem;background:var(--muted);color:var(--fg);border:1px solid var(--border)">Watch</button>
      </span>
      <span id="snapMsg" style="font-size:.78rem;color:var(--muted-fg)"></span>
    </div>
    <div id="snapOut" hidden><pre id="snapPre"></pre></div>
    <div class="tabs" role="tablist" style="margin-top:1rem">
      <button class="tab active" data-rtab="rbody">Body</button>
      <button class="tab" data-rtab="rheaders">Headers</button>
    </div>
    <div id="rtab-rbody" class="panel active"><pre id="respBody"></pre></div>
    <div id="rtab-rheaders" class="panel"><pre id="respHeaders"></pre></div>
  </section>
</main>

<script>
const $ = (id) => document.getElementById(id);
const COLORS = { DNS: "#60A5FA", TCP: "#22C55E", TLS: "#EAB308", TTFB: "#A78BFA", Download: "#F472B6" };

/* Tabs (request + response) */
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.panel[id^="tab-"]').forEach(p => p.classList.toggle('active', p.id === 'tab-' + b.dataset.tab));
});
document.querySelectorAll('[data-rtab]').forEach(b => b.onclick = () => {
  document.querySelectorAll('[data-rtab]').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.panel[id^="rtab-"]').forEach(p => p.classList.toggle('active', p.id === 'rtab-' + b.dataset.rtab));
});

/* Params rows */
function addParam(k = '', v = '') {
  const row = document.createElement('div');
  row.className = 'kv';
  row.innerHTML = '<input placeholder="key" value="' + k + '"><input placeholder="value" value="' + v + '"><button aria-label="remove" style="background:transparent;border:none;color:var(--muted-fg);cursor:pointer">✕</button>';
  row.lastChild.onclick = () => row.remove();
  $('params').appendChild(row);
}
$('addParam').onclick = () => addParam();
addParam();

function paramsQuery() {
  const parts = [];
  document.querySelectorAll('#params .kv').forEach(r => {
    const [k, v] = r.querySelectorAll('input');
    if (k.value) parts.push(encodeURIComponent(k.value) + '=' + encodeURIComponent(v.value));
  });
  return parts.length ? ('?' + parts.join('&')) : '';
}

/* History */
function getHistory() { try { return JSON.parse(localStorage.getItem('httpal-history') || '[]'); } catch { return []; } }
function pushHistory(entry) {
  const h = [entry, ...getHistory().filter(x => x.url !== entry.url || x.method !== entry.method)].slice(0, 30);
  localStorage.setItem('httpal-history', JSON.stringify(h));
  renderHistory();
}
function renderHistory() {
  $('history').innerHTML = getHistory().map((h, i) =>
    '<div class="hist-item" data-i="' + i + '"><span class="s pill ' + (h.status < 300 ? 'ok' : h.status < 400 ? 'warn' : 'err') + '" style="font-size:.68rem;padding:0 .4rem">' + h.status + '</span>' +
    '<span class="m">' + h.method + '</span><span class="u">' + h.url.replace(/^https?:\\/\\//, '') + '</span></div>').join('')
    || '<div style="color:var(--muted-fg);font-size:.8rem">No requests yet.</div>';
  document.querySelectorAll('.hist-item').forEach(el => el.onclick = () => {
    const h = getHistory()[+el.dataset.i];
    $('url').value = h.url; $('method').value = h.method;
  });
}
$('clearHist').onclick = () => { localStorage.removeItem('httpal-history'); renderHistory(); };
renderHistory();

/* JSON highlighting */
function highlight(json) {
  return json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/("(\\\\.|[^"\\\\])*")(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(\\.\\d+)?([eE][+-]?\\d+)?/g, m => {
    let cls = 'j-num';
    if (m.startsWith('"')) cls = m.endsWith(':') || /"\\s*:$/.test(m) ? 'j-key' : 'j-str';
    else if (/true|false/.test(m)) cls = 'j-bool';
    else if (/null/.test(m)) cls = 'j-null';
    if (cls === 'j-key') return '<span class="j-key">' + m.replace(/:$/, '') + '</span>:';
    return '<span class="' + cls + '">' + m + '</span>';
  });
}

async function send() {
  const headers = {};
  for (const line of $('headers').value.split('\\n')) {
    const i = line.indexOf(':');
    if (i > 0) headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const url = $('url').value + paramsQuery();
  $('send').disabled = true;
  $('send').innerHTML = '<span class="spinner"></span>';
  $('error').hidden = true;
  try {
    const r = await fetch('/api/request', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, method: $('method').value, headers, body: $('body').value || undefined }),
    });
    const j = await r.json();
    if (j.error) { $('error').textContent = j.error; $('error').hidden = false; $('result').hidden = true; return; }
    pushHistory({ url, method: $('method').value, status: j.status });
    $('result').hidden = false;
    const cls = j.status < 300 ? 'ok' : j.status < 400 ? 'warn' : 'err';
    $('status').innerHTML = '<span class="pill ' + cls + '">HTTP ' + j.status + ' ' + j.statusText + '</span> <span style="color:var(--muted-fg);font-size:.8rem">' + j.durationMs + 'ms</span>';
    $('respHeaders').textContent = Object.entries(j.headers).map(([k, v]) => k + ': ' + v).join('\\n');
    let body = j.body, isJson = false;
    try { body = JSON.stringify(JSON.parse(body), null, 2); isJson = true; } catch {}
    $('respBody').innerHTML = isJson ? highlight(body) : body.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    if (j.timing) {
      const t = j.timing;
      const parts = [['DNS', t.dns], ['TCP', Math.max(t.connect - t.secure, 0)], ['TLS', t.secure], ['TTFB', t.ttfb], ['Download', t.download]];
      $('timingWrap').innerHTML =
        '<div class="timing-bar">' + parts.map(([l, v]) => '<span title="' + l + ' ' + v + 'ms" style="width:' + Math.max(v / t.total * 100, .5) + '%;background:' + COLORS[l] + '"></span>').join('') + '</div>' +
        '<div class="legend">' + parts.map(([l, v]) => '<span><i style="background:' + COLORS[l] + '"></i>' + l + ' ' + v + 'ms</span>').join('') + '</div>';
    }
  } catch (e) { $('error').textContent = e.message; $('error').hidden = false; }
  finally { $('send').disabled = false; $('send').textContent = 'Send'; }
}
$('send').onclick = send;
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send(); });

/* Snapshot save / diff */
function currentRequestBody() {
  const headers = {};
  for (const line of $('headers').value.split('\\n')) {
    const i = line.indexOf(':');
    if (i > 0) headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { url: $('url').value + paramsQuery(), method: $('method').value, headers, body: $('body').value || undefined };
}
$('saveSnap').onclick = async () => {
  $('snapMsg').textContent = 'Saving...';
  const r = await fetch('/api/snapshot', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'save', ...currentRequestBody() }) });
  const j = await r.json();
  $('snapMsg').textContent = j.error ? j.error : ('Saved snapshot (HTTP ' + j.status + ') -> ' + j.file);
  $('snapOut').hidden = true;
};
$('diffSnap').onclick = async () => {
  $('snapMsg').textContent = 'Comparing...';
  const r = await fetch('/api/snapshot', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: 'diff', ...currentRequestBody() }) });
  const j = await r.json();
  if (j.error) { $('snapMsg').textContent = j.error; return; }
  if (!j.hasSnapshot) { $('snapMsg').textContent = 'No snapshot saved yet.'; return; }
  $('snapMsg').textContent = j.changed ? 'Changed since snapshot (status ' + j.previousStatus + ' -> ' + j.status + ')' : 'No changes vs snapshot.';
  $('snapOut').hidden = false;
  $('snapPre').textContent = j.diff;
};

/* Watch mode */
let watchTimer = null;
$('watchToggle').onclick = () => {
  if (watchTimer) {
    clearInterval(watchTimer); watchTimer = null;
    $('watchToggle').textContent = 'Watch';
    return;
  }
  const ms = Math.max(Number($('watchMs').value) || 2000, 200);
  $('watchToggle').textContent = 'Stop';
  let prev = null;
  watchTimer = setInterval(async () => {
    const r = await fetch('/api/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(currentRequestBody()) });
    const j = await r.json();
    if (j.error) return;
    const cls = j.status < 300 ? 'ok' : j.status < 400 ? 'warn' : 'err';
    $('status').innerHTML = '<span class="pill ' + cls + '">HTTP ' + j.status + ' ' + j.statusText + '</span> <span style="color:var(--muted-fg);font-size:.8rem">' + j.durationMs + 'ms' + (prev !== null && prev !== j.body ? ' · changed' : prev === j.body ? ' · no change' : '') + '</span>';
    prev = j.body;
  }, ms);
};
</script>
</body>
</html>`;
