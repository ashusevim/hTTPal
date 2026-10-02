import { describe, it, expect } from "vitest";
import { sanitizeBody } from "../src/sanitize.js";
import { diffBodies } from "../src/diff.js";
import { formatHtml } from "../src/beautify.js";
import { formatBody } from "../src/format.js";
import { saveSnapshot, loadSnapshot, snapshotPath } from "../src/snapshot.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { CliOptions } from "../src/args.js";

describe("sanitizeBody", () => {
  it("strips ANSI color escapes", () => {
    expect(sanitizeBody("\x1b[31mred\x1b[0m")).toBe("red");
  });

  it("strips OSC sequences (window title injection)", () => {
    expect(sanitizeBody("a\x1b]0;evil\x07b")).toBe("ab");
  });

  it("strips control chars, keeps whitespace", () => {
    expect(sanitizeBody("a\x00b\x07c\td\ne")).toBe("abc\td\ne");
  });

  it("leaves clean text untouched", () => {
    expect(sanitizeBody('{"a": 1}\n')).toBe('{"a": 1}\n');
  });
});

describe("formatHtml", () => {
  it("indents nested tags and text", () => {
    const out = formatHtml("<html><body><h1>Hi</h1></body></html>");
    expect(out).toBe("<html>\n  <body>\n    <h1>\n      Hi\n    </h1>\n  </body>\n</html>");
  });

  it("does not indent void elements", () => {
    const out = formatHtml("<div><img src=x><br><span>a</span></div>");
    expect(out).toContain("  <img src=x>");
    expect(out).toContain("  <br>");
  });
});

describe("formatBody content-type routing", () => {
  const base = { status: 200, statusText: "OK", headers: {}, durationMs: 1, redirected: false, timing: null };
  it("formats html bodies", () => {
    const out = formatBody({ ...base, body: "<p>hi</p>", contentType: "text/html; charset=utf-8" });
    expect(out).toBe("<p>\n  hi\n</p>");
  });
  it("pretty-prints json and passes text through", () => {
    expect(formatBody({ ...base, body: '{"a":1}', contentType: "application/json" })).toBe('{\n  "a": 1\n}');
    expect(formatBody({ ...base, body: "plain", contentType: "text/plain" })).toBe("plain");
  });
});

describe("diffBodies", () => {
  it("reports no changes for identical JSON", () => {
    expect(diffBodies('{"a":1}', '{"a":1}')).toBe("(no changes)");
  });

  it("reports key-level JSON changes", () => {
    const out = diffBodies('{"a":1,"b":2}', '{"a":1,"b":3,"c":4}');
    expect(out).toContain("~ b: 2 -> 3");
    expect(out).toContain("+ c: 4");
  });

  it("reports removed and added keys", () => {
    const out = diffBodies('{"old":true}', "{}");
    expect(out).toContain("- old: true");
  });

  it("falls back to line diff for text", () => {
    const out = diffBodies("hello\nworld", "hello\nthere");
    expect(out).toContain("- world");
    expect(out).toContain("+ there");
  });
});

describe("snapshot", () => {
  const options: CliOptions = {
    url: "http://example.com/api",
    method: "GET",
    headers: {},
    verbose: false,
    includeHeaders: false,
    timeout: 1000,
    followRedirects: true,
    fail: false,
    timing: false,
    sanitize: true,
    watchMs: 0,
    snapshot: "off",
  };

  it("save and load roundtrip", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "httpal-snap-"));
    process.env["HTTPAL_SNAPSHOT_DIR"] = dir;
    try {
      const file = saveSnapshot(options, {
        status: 200, statusText: "OK", headers: {}, body: '{"ok":true}',
        contentType: "application/json", durationMs: 1, redirected: false, timing: null,
      });
      expect(fs.existsSync(file)).toBe(true);
      const loaded = loadSnapshot(options);
      expect(loaded?.body).toBe('{"ok":true}');
      expect(loaded?.status).toBe(200);
      expect(snapshotPath(options)).toBe(file);
    } finally {
      delete process.env["HTTPAL_SNAPSHOT_DIR"];
    }
  });

  it("load returns null when missing", () => {
    process.env["HTTPAL_SNAPSHOT_DIR"] = fs.mkdtempSync(path.join(os.tmpdir(), "httpal-empty-"));
    try {
      expect(loadSnapshot(options)).toBeNull();
    } finally {
      delete process.env["HTTPAL_SNAPSHOT_DIR"];
    }
  });
});
