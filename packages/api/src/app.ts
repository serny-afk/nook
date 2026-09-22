import express, { type Express } from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { assertDatabaseConnection } from "./db/sequelize.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { profilesRouter } from "./routes/profiles.js";

/**
 * Builds the Express application: middleware, routes, and the error handler.
 * Kept separate from server startup (see server.ts) so tests can exercise the
 * app without binding a port. Feature routes mount here as they come online.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json());

  // Readiness check: confirms the process is up and the database is reachable.
  // Unauthenticated and cheap. Any DB error bubbles to the error handler.
  app.get("/health", async (_req, res) => {
    await assertDatabaseConnection();
    res.json({ status: "ok", db: "connected" });
  });

  // Feature routes mount here (auth, … next).
  app.use("/profiles", profilesRouter);

  // Must be last: catches errors from every handler above.
  app.use(errorHandler);

  return app;
}
