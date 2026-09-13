/**
 * Minimal JSON logger — a thin, consistent wrapper over `console` so call sites
 * don't format their own output and we can swap in a real logger (pino) later
 * without touching them.
 */
type Level = "info" | "warn" | "error";

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  console[level](JSON.stringify({ time: new Date().toISOString(), level, message, ...meta }));
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta),
};
