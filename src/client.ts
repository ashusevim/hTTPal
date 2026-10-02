import { PerformanceObserver, PerformanceResourceTiming } from "node:perf_hooks";
import type { CliOptions } from "./args.js";

export interface TimingInfo {
  /** DNS lookup */
  dns: number;
  /** TCP connect (incl. TLS handshake total; secure is the TLS portion) */
  connect: number;
  /** TLS handshake, 0 for plain HTTP */
  secure: number;
  /** Wait / time-to-first-byte from request start */
  ttfb: number;
  /** Download of the response body */
  download: number;
  /** End-to-end wall time */
  total: number;
}

export interface HttpResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  durationMs: number;
  redirected: boolean;
  timing: TimingInfo | null;
}

// Node's runtime entry carries responseStart, but @types/node omits it.
type ResourceTimingEntry = PerformanceResourceTiming & { responseStart: number };

function captureTiming(): { promise: Promise<ResourceTimingEntry | null> } {
  let resolveEntry!: (e: ResourceTimingEntry | null) => void;
  const promise = new Promise<ResourceTimingEntry | null>((resolve) => {
    resolveEntry = resolve;
  });
  const timer = setTimeout(() => {
    obs.disconnect();
    resolveEntry(null);
  }, 3000);
  const obs = new PerformanceObserver((list) => {
    const entries = list.getEntries().filter((e) => e.entryType === "resource");
    if (entries.length > 0) {
      clearTimeout(timer);
      obs.disconnect();
      resolveEntry(entries[entries.length - 1] as ResourceTimingEntry);
    }
  });
  obs.observe({ entryTypes: ["resource"] });
  return { promise };
}

function toTiming(e: ResourceTimingEntry): TimingInfo {
  return {
    dns: round(e.domainLookupEnd - e.domainLookupStart),
    connect: round(e.connectEnd - e.connectStart),
    secure: e.secureConnectionStart ? round(e.connectEnd - e.secureConnectionStart) : 0,
    ttfb: round(e.responseStart - e.requestStart),
    download: round(e.responseEnd - e.responseStart),
    total: round(e.responseEnd - e.startTime),
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

export async function sendRequest(options: CliOptions): Promise<HttpResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout);
  const start = performance.now();
  const timingProbe = captureTiming();
  try {
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      redirect: options.followRedirects ? "follow" : "manual",
      signal: controller.signal,
    });
    const durationMs = Math.round(performance.now() - start);
    const body = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const entry = await Promise.race([
      timingProbe.promise,
      new Promise<null>((r) => setTimeout(() => r(null), 500)),
    ]);
    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      contentType: response.headers.get("content-type") ?? "",
      durationMs,
      redirected: response.redirected,
      timing: entry ? toTiming(entry) : null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${options.timeout}ms`);
    }
    if (error instanceof Error) {
      const cause = error.cause instanceof Error ? `: ${error.cause.message}` : "";
      throw new Error(`Request failed: ${error.message}${cause}`);
    }
    throw new Error(`Request failed: ${String(error)}`);
  } finally {
    clearTimeout(timer);
  }
}
