import "dotenv/config";

/**
 * Application config, read once from the environment at startup so the rest of
 * the code depends on a typed object rather than reaching into `process.env`.
 */
export interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  /** Require TLS to the database — needed by most managed Postgres (Neon, a
   *  provider's public URL). Off by default for local/private-network Postgres. */
  dbSsl: boolean;
  clientOrigin: string;
}

/** Read a required variable, failing fast at startup if it's missing. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  dbSsl: (process.env.DATABASE_SSL ?? "false").toLowerCase() === "true",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
};
