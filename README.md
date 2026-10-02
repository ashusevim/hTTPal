# HTTPal

[![CI](https://github.com/ashusevim/httpal/actions/workflows/ci.yml/badge.svg)](https://github.com/ashusevim/httpal/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@ashusevim/httpal.svg)](https://www.npmjs.com/package/@ashusevim/httpal)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

A lightweight, dependency-free command-line HTTP client built with TypeScript and Node 18+.

![HTTPal Web UI](docs/screenshot.png)

## Features

- GET, POST, PUT, DELETE, and any other HTTP method via `-X`
- Repeatable request headers (`-H`)
- Request bodies from the CLI (`-d`) or JSON (`--json`, auto-sets `Content-Type`)
- Pretty-printed JSON responses, plain-text passthrough for everything else
- Status line with color, timing in milliseconds, redirect detection
- `--timing` renders a dev-tools-style waterfall: DNS, TCP, TLS, TTFB, download
- `--verbose` request/response headers, `--include` for response headers only
- `--watch <ms>` re-runs the request and shows what changed since the previous run
- `--snapshot save|diff` records a baseline and diffs future runs (JSON-aware key diffs)
- Response bodies are sanitized by default (ANSI/control chars stripped) — `--raw` to disable
- `httpal ui` local web UI (request builder + response viewer with timing bar), `httpal tui` interactive mode
- `--timeout`, `--no-follow`, `--fail`, `--output` for saving bodies to disk
- Sensible exit codes: `0` success, `1` request/HTTP error, `2` bad arguments
- No runtime dependencies — just `node:fetch` under the hood

## Installation

```bash
npm install -g @ashusevim/httpal
# or run once without installing:
npx @ashusevim/httpal https://api.github.com/users/google
```

Requires Node.js 18 or newer. For development, clone the repo instead:

```bash
git clone https://github.com/ashusevim/httpal.git
cd HTTPal
npm install
npm run build
```

## Usage

```bash
httpal https://api.github.com/users/google
httpal -X POST https://example.com/api --json '{"name":"httpal"}'
httpal -v -H "Accept: application/json" https://httpbin.org/status/200
httpal --fail -o user.json https://example.com/user/42
httpal --watch 2000 https://httpbin.org/time    # re-run, show what changed
httpal --snapshot save https://example.com      # record baseline
httpal --snapshot diff https://example.com      # what changed since baseline?
httpal ui --port 4242                           # web UI at http://localhost:4242
httpal tui                                      # interactive terminal mode
```

Run `httpal --help` for the full option list.

### Output example

```
HTTP 200 OK (183ms)

{
  "login": "google",
  "id": 1342004,
  ...
}
```

### `--timing` waterfall

```
Timing (total 17.9ms):
  DNS lookup          0ms  █
  TCP connect         0ms  █
  TLS handshake       0ms  █
  Wait (TTFB)       5.3ms  ██████████████████████████████
  Download          4.8ms  ███████████████████████████
```

## Development

```bash
npm run build       # compile TypeScript to dist/
npm test            # run the vitest suite (unit + CLI end-to-end)
npm run typecheck   # strict type checking, no emit
npm start -- <url>  # run the built CLI
```

Project layout:

```
src/
  args.ts      argument parsing (no external deps)
  client.ts    fetch wrapper with timeout + error normalization
  format.ts    response rendering (status line, headers, JSON pretty-print)
  diff.ts      JSON-aware structural diff for --watch and --snapshot
  sanitize.ts  ANSI/control-char stripping for untrusted bodies
  snapshot.ts  baseline persistence
  ui-server.ts local web UI (zero framework, embedded page)
  tui.ts       interactive terminal mode
  index.ts     CLI entry point
tests/         vitest suites: unit, client integration, CLI end-to-end, UI server
```

## Roadmap

- [ ] Cookie jar support
- [ ] Config file (`~/.httpalrc`) for default headers
- [ ] Shell completions
- [ ] Response history / pretty diff between runs

## License

ISC — see [LICENSE](LICENSE).
