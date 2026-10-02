import readline from "node:readline/promises";
import { sendRequest } from "./client.js";
import { renderResult } from "./format.js";
import type { CliOptions } from "./args.js";

/**
 * Minimal interactive terminal mode — a guided alternative to remembering
 * every flag. Not a full-screen TUI; a menu loop around the same engine.
 */
export async function runTui(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const options: CliOptions = {
    url: "",
    method: "GET",
    headers: {},
    verbose: false,
    includeHeaders: false,
    timeout: 30000,
    followRedirects: true,
    fail: false,
    timing: true,
    sanitize: true,
    watchMs: 0,
    snapshot: "off",
  };

  console.log("HTTPal interactive mode. Commands: url, method, header, body, show, send, reset, quit\n");
  try {
    for (;;) {
      const cmd = (await rl.question("httpal> ")).trim().toLowerCase();
      switch (cmd) {
        case "url": {
          options.url = (await rl.question("URL: ")).trim();
          break;
        }
        case "method": {
          options.method = ((await rl.question("Method [GET]: ")).trim() || "GET").toUpperCase();
          break;
        }
        case "header": {
          const line = await rl.question("Header (Name: value): ");
          const i = line.indexOf(":");
          if (i > 0) options.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
          else console.log("Invalid header, expected 'Name: value'");
          break;
        }
        case "body": {
          options.body = await rl.question("Body: ");
          if (options.method === "GET" && options.body) options.method = "POST";
          break;
        }
        case "show": {
          console.log(`${options.method} ${options.url}`);
          for (const [k, v] of Object.entries(options.headers)) console.log(`  ${k}: ${v}`);
          if (options.body) console.log(`  body: ${options.body}`);
          break;
        }
        case "send": {
          if (!options.url) {
            console.log("Set a URL first ('url')");
            break;
          }
          try {
            new URL(options.url);
          } catch {
            console.log(`Invalid URL: ${options.url}`);
            break;
          }
          try {
            const result = await sendRequest(options);
            console.log(renderResult(result, options));
          } catch (error) {
            console.log(error instanceof Error ? error.message : String(error));
          }
          break;
        }
        case "reset": {
          options.url = "";
          options.method = "GET";
          options.headers = {};
          options.body = undefined;
          console.log("Reset.");
          break;
        }
        case "quit":
        case "exit":
        case "q":
          return;
        default:
          console.log("Commands: url, method, header, body, show, send, reset, quit");
      }
    }
  } finally {
    rl.close();
  }
}
