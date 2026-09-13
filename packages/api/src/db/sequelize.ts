import { Sequelize } from "sequelize";
import { config } from "../config/index.js";

/**
 * The single Sequelize instance for the app. Models register against this and
 * services use it; nothing else should open a database connection. `logging` is
 * off by default to keep dev output readable — flip it on when debugging SQL.
 */
export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: "postgres",
  logging: false,
});

/** Verify the database is reachable; rejects if it isn't. */
export async function assertDatabaseConnection(): Promise<void> {
  await sequelize.authenticate();
}
