#!/usr/bin/env node
import fs from "node:fs";
import { parseArgs, getHelp } from "./args.js";
import { sendRequest } from "./client.js";
import { renderResult, renderTiming, statusLine, formatBody } from "./format.js";
import { diffBodies } from "./diff.js";
import { saveSnapshot, loadSnapshot } from "./snapshot.js";
import { startUiServer } from "./ui-server.js";
import { runTui } from "./tui.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function getVersion(): string {
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(path.join(here, "..", "package.json"), "utf8"));
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runOnce(options: NonNullable<ReturnType<typeof parseArgs>["options"]>): Promise<number> {
  const result = await sendRequest(options);

  if (options.output) {
    fs.writeFileSync(options.output, result.body);
    console.log(`Saved ${result.body.length} bytes to ${options.output}`);
  }

  if (options.snapshot === "save") {
    const file = saveSnapshot(options, result);
    console.log(`Snapshot saved to ${file}`);
    console.log(renderResult(result, options));
    return 0;
  }

  if (options.snapshot === "diff") {
    const prev = loadSnapshot(options);
    if (!prev) {
      console.error(`No snapshot found for ${options.method} ${options.url}. Run with --snapshot save first.`);
      return 2;
    }
    const changed = prev.body !== result.body || prev.status !== result.status;
    console.log(renderResult(result, options));
    if (changed) {
      console.log(`\n--- diff vs snapshot from ${prev.savedAt} ---`);
      if (prev.status !== result.status) console.log(`status: ${prev.status} -> ${result.status}`);
      console.log(diffBodies(prev.body, result.body));
      return 1;
    }
    console.log("\nNo changes vs snapshot.");
    return 0;
  }

  console.log(renderResult(result, options));
  if (options.fail && result.status >= 400) return 1;
  return 0;
}

async function main(): Promise<number> {
  // Subcommands: `httpal ui [--port N]` and `httpal tui`
  const sub = process.argv[2];
  if (sub === "ui") {
    const idx = process.argv.indexOf("--port");
    const port = idx !== -1 ? Number(process.argv[idx + 1]) : 4242;
    if (!Number.isFinite(port) || port <= 0) {
      console.error("Invalid --port value");
      return 2;
    }
    await startUiServer(port);
    console.log(`HTTPal UI running at http://localhost:${port} (Ctrl+C to stop)`);
    return await new Promise(() => {}); // keep running
  }
  if (sub === "tui") {
    await runTui();
    return 0;
  }

  const parsed = parseArgs(process.argv);
  if (parsed.help) {
    console.log(getHelp());
    return 0;
  }
  if (parsed.version) {
    console.log(getVersion());
    return 0;
  }
  if (parsed.error || !parsed.options) {
    console.error(parsed.error ?? "Invalid arguments");
    return 2;
  }

  try {
    new URL(parsed.options.url);
  } catch {
    console.error(`Invalid URL: ${parsed.options.url}`);
    return 2;
  }

  const options = parsed.options;

  try {
    if (options.watchMs > 0) {
      let previous: string | null = null;
      for (;;) {
        const result = await sendRequest(options);
        console.log(statusLine(result));
        if (options.timing) console.log(renderTiming(result));
        if (previous === null) {
          console.log(formatBody(result, 0, options.sanitize));
        } else if (previous !== result.body) {
          console.log(diffBodies(previous, result.body));
        } else {
          console.log("(no changes)");
        }
        previous = result.body;
        console.log(`--- next run in ${options.watchMs}ms (Ctrl+C to stop) ---\n`);
        await sleep(options.watchMs);
      }
    }
    return await runOnce(options);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
