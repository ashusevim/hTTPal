import type { CliOptions } from "./args.js";

export interface HttpResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  durationMs: number;
  redirected: boolean;
}

export async function sendRequest(options: CliOptions): Promise<HttpResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout);
  const start = performance.now();
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
    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      contentType: response.headers.get("content-type") ?? "",
      durationMs,
      redirected: response.redirected,
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
