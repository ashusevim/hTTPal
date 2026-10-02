# Changelog

## 1.0.0 (2026-10-02)

- TypeScript CLI HTTP client: methods, headers, `--json`/`--data`, `--verbose`, `--timeout`, `--fail`, `--output`
- `--timing` waterfall (DNS/TCP/TLS/TTFB/download)
- `--watch` poll mode with JSON-aware diffs
- `--snapshot save|diff` baseline regression checks (exit 1 on drift)
- Response body sanitization by default (ANSI/control stripped); `--raw` to opt out
- `httpal ui` local web UI: history sidebar, tabs, JSON highlighting, timing bar
- `httpal tui` interactive mode
- vitest suite (unit + client integration + CLI end-to-end + UI server), GitHub Actions CI on Node 18/20/22
