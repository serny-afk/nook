import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { assertDatabaseConnection, sequelize } from "./db/sequelize.js";
import { logger } from "./lib/logger.js";

/** Connect to the database (fail fast if it's down), then start listening. */
async function start(): Promise<void> {
  await assertDatabaseConnection();
  logger.info("database connected");

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info("api listening", { port: config.port, env: config.nodeEnv });
  });

  // Graceful shutdown: stop accepting connections, then close the DB pool.
  const shutdown = (signal: string) => {
    logger.info("shutting down", { signal });
    server.close(() => {
      void sequelize.close().finally(() => process.exit(0));
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  logger.error("failed to start", {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
