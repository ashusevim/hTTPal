# Contributing

Thanks for helping improve HTTPal. Small, focused PRs are welcome.

## Setup

```bash
git clone https://github.com/ashusevim/httpal.git
cd httpal
npm install
npm run build
npm test
```

## Rules

- Every feature ships with tests in the same PR (`npm test` must stay green).
- Keep zero runtime dependencies. Dev tooling is fine.
- `npm run typecheck` must pass.
- Match existing module structure: `src/args.ts` (parsing), `src/client.ts` (fetch), `src/format.ts` (render), etc. UI strings live in `src/ui-page.ts`.
- Commit messages: short imperative summary of what and why.

## Reporting bugs

Open an issue with: Node version (`node -v`), OS, the exact command, expected vs actual output, and response headers/body if relevant.
