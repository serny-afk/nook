import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

/**
 * Central error handler, mounted last. Express 5 forwards errors thrown in
 * handlers (including rejected async ones) here automatically, so routes and
 * services stay thin and never format error responses themselves. A richer
 * typed error (with status codes) arrives when we build the first resources.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error("unhandled error", {
    message: err instanceof Error ? err.message : String(err),
  });
  res.status(500).json({ error: "Internal Server Error" });
}
