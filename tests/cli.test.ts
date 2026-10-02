import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AddressInfo } from "node:net";

const run = promisify(execFile);
let server: http.Server;
let base: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end('{"hello":"world"}');
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function cli(args: string[]) {
  try {
    const { stdout, stderr } = await run("node", ["dist/index.js", ...args], { cwd: process.cwd() });
    return { code: 0, stdout, stderr };
  } catch (err: any) {
    return { code: err.code ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

describe("CLI", () => {
  it("prints pretty JSON for a URL", async () => {
    const r = await cli([base]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("HTTP 200");
    expect(r.stdout).toContain('"hello": "world"');
  });

  it("--help exits 0", async () => {
    const r = await cli(["--help"]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("Usage: httpal");
  });

  it("missing URL exits 2", async () => {
    const r = await cli([]);
    expect(r.code).toBe(2);
  });

  it("invalid URL exits 2", async () => {
    const r = await cli(["notaurl"]);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain("Invalid URL");
  });

  it("--fail exits 1 on 404", async () => {
    const s = http.createServer((_req, res) => res.writeHead(404).end());
    await new Promise<void>((r) => s.listen(0, r));
    const port = (s.address() as AddressInfo).port;
    const r = await cli(["--fail", `http://127.0.0.1:${port}/`]);
    expect(r.code).toBe(1);
    await new Promise((r2) => s.close(r2));
  });
});
