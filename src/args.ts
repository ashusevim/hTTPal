export interface CliOptions {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  verbose: boolean;
  includeHeaders: boolean;
  timeout: number;
  output?: string;
  followRedirects: boolean;
  fail: boolean;
  timing: boolean;
  /** Sanitize untrusted response bodies before printing (default true). */
  sanitize: boolean;
  /** Re-run the request every N ms and show what changed. 0 = off. */
  watchMs: number;
  /** Snapshot mode: off, save (record), or diff (compare to saved). */
  snapshot: "off" | "save" | "diff";
}

export interface ParsedArgs {
  options: CliOptions | null;
  help: boolean;
  version: boolean;
  error?: string;
}

const HELP = `HTTPal - a lightweight command-line HTTP client

Usage: httpal [options] <url>   (or: httpal [options] --target <url>)

Options:
  -X, --method <method>   HTTP method (default: GET, or POST when --data is set)
  -H, --header <header>   Add a header, e.g. -H "Accept: application/json" (repeatable)
  -d, --data <body>       Request body; sent as-is (use --json for JSON)
      --json <body>       Request body, sets Content-Type: application/json if unset
  -v, --verbose           Print request and response headers
  -i, --include           Include response headers in the output
  -t, --timeout <ms>      Request timeout in milliseconds (default: 30000)
  -o, --output <file>     Write the response body to a file
      --timing            Show the timing waterfall (DNS, connect, TLS, TTFB, download)
      --watch <ms>        Re-run the request every N ms and show what changed
      --snapshot <mode>   'save' records the response, 'diff' compares against it
      --raw               Print the raw response body (no ANSI/control sanitization)
  -L, --no-follow         Do not follow redirects (redirects are followed by default)
      --fail              Exit with code 1 on HTTP error status (>= 400)
  -h, --help              Show this help
      --version           Show version

Examples:
  httpal https://api.github.com/users/google
  httpal -X POST https://example.com/api --json '{"a":1}'
  httpal -v https://httpbin.org/status/200
`;

export function getHelp(): string {
  return HELP;
}

function splitHeader(raw: string): [string, string] | null {
  const idx = raw.indexOf(":");
  if (idx === -1) return null;
  const name = raw.slice(0, idx).trim();
  const value = raw.slice(idx + 1).trim();
  if (!name) return null;
  return [name, value];
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const result: ParsedArgs = {
    options: null,
    help: false,
    version: false,
  };

  let method: string | undefined;
  let body: string | undefined;
  let jsonBody: string | undefined;
  let verbose = false;
  let includeHeaders = false;
  let timeout = 30000;
  let output: string | undefined;
  let followRedirects = true;
  let fail = false;
  let timing = false;
  let sanitize = true;
  let watchMs = 0;
  let snapshot: "off" | "save" | "diff" = "off";
  const headers: Record<string, string> = {};
  let url: string | undefined;
  const setUrl = (u: string) => {
    if (url !== undefined) return { error: `Unexpected extra argument: ${u}` };
    url = u;
    return null;
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = () => {
      if (i + 1 >= args.length) throw new Error(`Option ${arg} requires a value`);
      return args[++i];
    };
    try {
      switch (arg) {
        case "-h":
        case "--help":
          result.help = true;
          break;
        case "--version":
          result.version = true;
          break;
        case "-X":
        case "--method":
          method = next().toUpperCase();
          break;
        case "-H":
        case "--header": {
          const pair = splitHeader(next());
          if (!pair) return { ...result, error: `Invalid header: ${args[i]} (expected "Name: value")` };
          headers[pair[0]] = pair[1];
          break;
        }
        case "-d":
        case "--data":
          body = next();
          break;
        case "--json":
          jsonBody = next();
          break;
        case "-v":
        case "--verbose":
          verbose = true;
          break;
        case "-i":
        case "--include":
          includeHeaders = true;
          break;
        case "-t":
        case "--timeout": {
          const raw = next();
          const n = Number(raw);
          if (!Number.isFinite(n) || n <= 0) return { ...result, error: `Invalid timeout: ${raw}` };
          timeout = n;
          break;
        }
        case "-o":
        case "--output":
          output = next();
          break;
        case "-L":
        case "--no-follow":
          followRedirects = false;
          break;
        case "--fail":
          fail = true;
          break;
        case "--timing":
          timing = true;
          break;
        case "--target": {
          const err = setUrl(next());
          if (err) return { ...result, error: err.error };
          break;
        }
        case "--raw":
          sanitize = false;
          break;
        case "--watch": {
          const raw = next();
          const n = Number(raw);
          if (!Number.isFinite(n) || n < 100)
            return { ...result, error: `Invalid watch interval: ${raw} (min 100ms)` };
          watchMs = n;
          break;
        }
        case "--snapshot": {
          const mode = next();
          if (mode !== "save" && mode !== "diff")
            return { ...result, error: `--snapshot expects 'save' or 'diff', got: ${mode}` };
          snapshot = mode;
          break;
        }
        default:
          if (arg.startsWith("--method=")) method = arg.slice(9).toUpperCase();
          else if (arg.startsWith("--header=")) {
            const pair = splitHeader(arg.slice(9));
            if (!pair) return { ...result, error: `Invalid header: ${arg.slice(9)}` };
            headers[pair[0]] = pair[1];
          } else if (arg.startsWith("--data=")) body = arg.slice(7);
          else if (arg.startsWith("--json=")) jsonBody = arg.slice(7);
          else if (arg.startsWith("--timeout=")) {
            const n = Number(arg.slice(10));
            if (!Number.isFinite(n) || n <= 0) return { ...result, error: `Invalid timeout: ${arg.slice(10)}` };
            timeout = n;
          } else if (arg.startsWith("--output=")) output = arg.slice(9);
          else if (arg.startsWith("--target=")) {
            const err = setUrl(arg.slice(9));
            if (err) return { ...result, error: err.error };
          } else if (arg.startsWith("-") && arg !== "-")
            return {
              ...result,
              error: `Unknown option: ${arg}. Pass the URL directly or via --target <url>. Run 'httpal --help' for usage.`,
            };
          else {
            const err = setUrl(arg);
            if (err) return { ...result, error: err.error };
          }
      }
    } catch (err) {
      return { ...result, error: err instanceof Error ? err.message : String(err) };
    }
  }

  if (result.help || result.version) return result;
  if (!url) return { ...result, error: "Missing <url>. Run 'httpal --help' for usage." };
  if (method !== undefined && !/^[A-Z]+$/.test(method)) return { ...result, error: `Invalid method: ${method}` };
  if (jsonBody !== undefined) {
    body = jsonBody;
    if (!Object.keys(headers).some((h) => h.toLowerCase() === "content-type")) {
      headers["Content-Type"] = "application/json";
    }
  }

  result.options = {
    url,
    method: method ?? (body !== undefined ? "POST" : "GET"),
    headers,
    body,
    verbose,
    includeHeaders,
    timeout,
    output,
    followRedirects,
    fail,
    timing,
    sanitize,
    watchMs,
    snapshot,
  };
  return result;
}
