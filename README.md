# HTTPal

A lightweight, dependency-free command-line HTTP client built with TypeScript and Node 18+.

## Features

- GET, POST, PUT, DELETE, and any other HTTP method via `-X`
- Repeatable request headers (`-H`)
- Request bodies from the CLI (`-d`) or JSON (`--json`, auto-sets `Content-Type`)
- Pretty-printed JSON responses, plain-text passthrough for everything else
- Status line with color, timing in milliseconds, redirect detection
- `--verbose` request/response headers, `--include` for response headers only
- `--timeout`, `--no-follow`, `--fail`, `--output` for saving bodies to disk
- Sensible exit codes: `0` success, `1` request/HTTP error, `2` bad arguments
- No runtime dependencies — just `node:fetch` under the hood

## Installation

```bash
git clone https://github.com/codingashishdev/httpal.git
cd httpal
npm install
npm run build
npm link        # optional: puts `httpal` on your PATH
```

Requires Node.js 18 or newer.

## Usage

```bash
httpal https://api.github.com/users/google
httpal -X POST https://example.com/api --json '{"name":"httpal"}'
httpal -v -H "Accept: application/json" https://httpbin.org/status/200
httpal --fail -o user.json https://example.com/user/42
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
  index.ts     CLI entry point
tests/         vitest suites: unit, client integration, CLI end-to-end
```

## Roadmap

- [ ] Cookie jar support
- [ ] Config file (`~/.httpalrc`) for default headers
- [ ] Shell completions
- [ ] Response history / pretty diff between runs

## License

ISC — see [LICENSE](LICENSE).
