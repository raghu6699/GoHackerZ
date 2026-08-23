/**
 * Structured JSON logger — one line per event so Vercel/Docker log drains
 * can index fields directly. When you add Sentry later, pipe these events
 * into it from a single place.
 */
export type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (event: string, data?: Record<string, unknown>) => log("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => log("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => log("error", event, data),
};
