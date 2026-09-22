import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

/**
 * Central error handler, mounted last. Express 5 forwards errors thrown in
 * handlers (including rejected async ones) here automatically, so routes and
 * services stay thin and never format error responses themselves.
 *
 * A deliberate {@link ApiError} maps to its own status; 4xx are normal client
 * mistakes and aren't logged as server faults. Anything else is unexpected — it
 * is logged and returned as an opaque 500 so internals never leak to the client.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    if (err.status >= 500) {
      logger.error("request failed", { status: err.status, message: err.message });
    }
    res.status(err.status).json({ error: err.message });
    return;
  }

  logger.error("unhandled error", {
    message: err instanceof Error ? err.message : String(err),
  });
  res.status(500).json({ error: "Internal Server Error" });
}
