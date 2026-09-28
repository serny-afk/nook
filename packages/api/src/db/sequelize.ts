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
  // Managed Postgres (Neon, a provider's public URL) terminates TLS with a chain
  // Node won't verify by default; require SSL without rejecting it. Opt in with
  // DATABASE_SSL=true — local/private-network Postgres stays plaintext.
  dialectOptions: config.dbSsl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
});

/** Verify the database is reachable; rejects if it isn't. */
export async function assertDatabaseConnection(): Promise<void> {
  await sequelize.authenticate();
}
