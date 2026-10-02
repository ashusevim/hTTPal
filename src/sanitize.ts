/**
 * Strip ANSI escape sequences and dangerous control characters from
 * untrusted response bodies before printing them. A malicious server can
 * otherwise inject escape sequences that rewrite your terminal (this was
 * HTTPie issue #1812). Normal whitespace (\n, \t, \r) is preserved.
 */
export function sanitizeBody(input: string): string {
  return input
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "") // CSI sequences
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "") // OSC sequences
    .replace(/\x1b[@-Z\\-_]/g, "") // remaining escape sequences
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, ""); // control chars
}
