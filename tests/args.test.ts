import { describe, it, expect } from "vitest";
import { parseArgs } from "../src/args.js";

const base = ["node", "httpal"];

describe("parseArgs", () => {
  it("parses a bare URL with defaults", () => {
    const r = parseArgs([...base, "https://example.com"]);
    expect(r.error).toBeUndefined();
    expect(r.options?.method).toBe("GET");
    expect(r.options?.timeout).toBe(30000);
    expect(r.options?.followRedirects).toBe(true);
  });

  it("requires a URL", () => {
    const r = parseArgs([...base]);
    expect(r.error).toMatch(/Missing <url>/);
  });

  it("parses method, headers, data, timeout", () => {
    const r = parseArgs([
      ...base,
      "-X", "PUT",
      "-H", "Accept: application/json",
      "-H", "X-Token: abc",
      "-d", "hello",
      "-t", "5000",
      "--fail",
      "https://example.com",
    ]);
    expect(r.options?.method).toBe("PUT");
    expect(r.options?.headers).toEqual({ Accept: "application/json", "X-Token": "abc" });
    expect(r.options?.body).toBe("hello");
    expect(r.options?.timeout).toBe(5000);
    expect(r.options?.fail).toBe(true);
  });

  it("defaults to POST when a body is given", () => {
    const r = parseArgs([...base, "--json", '{"a":1}', "https://example.com"]);
    expect(r.options?.method).toBe("POST");
    expect(r.options?.headers["Content-Type"]).toBe("application/json");
  });

  it("does not override an explicit Content-Type with --json", () => {
    const r = parseArgs([
      ...base,
      "-H", "Content-Type: custom/json",
      "--json", "{}",
      "https://example.com",
    ]);
    expect(r.options?.headers["Content-Type"]).toBe("custom/json");
  });

  it("rejects malformed headers", () => {
    const r = parseArgs([...base, "-H", "no-colon", "https://example.com"]);
    expect(r.error).toMatch(/Invalid header/);
  });

  it("rejects unknown options", () => {
    const r = parseArgs([...base, "--bogus", "https://example.com"]);
    expect(r.error).toMatch(/Unknown option/);
  });

  it("rejects invalid timeout", () => {
    const r = parseArgs([...base, "-t", "abc", "https://example.com"]);
    expect(r.error).toMatch(/Invalid timeout/);
  });

  it("supports --key=value forms", () => {
    const r = parseArgs([
      ...base,
      "--method=DELETE",
      "--header=X-A: 1",
      "--timeout=1000",
      "--output=f.txt",
      "https://example.com",
    ]);
    expect(r.options?.method).toBe("DELETE");
    expect(r.options?.headers["X-A"]).toBe("1");
    expect(r.options?.timeout).toBe(1000);
    expect(r.options?.output).toBe("f.txt");
  });

  it("--no-follow disables redirects", () => {
    const r = parseArgs([...base, "-L", "https://example.com"]);
    expect(r.options?.followRedirects).toBe(false);
  });

  it("--timing enables timing waterfall", () => {
    const r = parseArgs([...base, "--timing", "https://example.com"]);
    expect(r.options?.timing).toBe(true);
    expect(parseArgs([...base, "https://example.com"]).options?.timing).toBe(false);
  });

  it("supports --target <url> as an alternative to positional URL", () => {
    const r = parseArgs([...base, "--target", "https://example.com"]);
    expect(r.options?.url).toBe("https://example.com");
    const r2 = parseArgs([...base, "--target=https://example.com"]);
    expect(r2.options?.url).toBe("https://example.com");
  });

  it("unknown option error suggests --target", () => {
    const r = parseArgs([...base, "--bogus", "https://example.com"]);
    expect(r.error).toMatch(/--target/);
  });

  it("handles --help and --version without URL", () => {
    expect(parseArgs([...base, "--help"]).help).toBe(true);
    expect(parseArgs([...base, "--version"]).version).toBe(true);
  });
});
