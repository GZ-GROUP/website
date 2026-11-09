// Structured logs: one JSON object per line on stdout/stderr, which is what the
// container platform collects. Personal data and credentials never get logged.

type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const SENSITIVE_KEY = /pass|secret|token|cookie|authorization|email|session|body/i;
const MAX_TEXT = 1000;
const MAX_DEPTH = 4;

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

function sanitize(value: unknown, depth = 0): unknown {
  if (typeof value === "string") {
    // Database and library errors can quote the values that caused them.
    const text = value.replace(EMAIL, "[email]");
    return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}…` : text;
  }
  if (typeof value === "bigint") return value.toString();
  if (value === null || typeof value !== "object") return value;
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? "[redacted]" : sanitize(item, depth + 1)]),
  );
}

/** The parts of an error worth keeping; `digest` links it to the reference users see. */
export function serializeError(error: unknown): Fields {
  if (error instanceof Error) {
    const { digest } = error as Error & { digest?: string };
    return { name: error.name, message: error.message, stack: error.stack, digest };
  }
  return { message: String(error) };
}

function write(level: Level, event: string, fields: Fields) {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    event,
    ...(sanitize(fields) as Fields),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (event: string, fields: Fields = {}) => write("info", event, fields),
  warn: (event: string, fields: Fields = {}) => write("warn", event, fields),
  error: (event: string, fields: Fields = {}) => write("error", event, fields),
};
