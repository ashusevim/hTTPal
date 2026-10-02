#!/usr/bin/env node
import fs from "node:fs";
import { parseArgs, getHelp } from "./args.js";
import { sendRequest } from "./client.js";
import { renderResult } from "./format.js";
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

async function main(): Promise<number> {
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

  try {
    const result = await sendRequest(parsed.options);
    if (parsed.options.output) {
      fs.writeFileSync(parsed.options.output, result.body);
      console.log(`Saved ${result.body.length} bytes to ${parsed.options.output}`);
    }
    console.log(renderResult(result, parsed.options));
    if (parsed.options.fail && result.status >= 400) return 1;
    return 0;
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
