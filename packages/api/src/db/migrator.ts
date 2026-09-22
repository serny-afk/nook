import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Sequelize, type QueryInterface } from "sequelize";
import { Umzug, SequelizeStorage } from "umzug";
import { sequelize } from "./sequelize.js";

/**
 * The migration runner. Schema changes are versioned files under `migrations/`
 * (never `sequelize.sync()`), so the exact schema is reproducible across dev and
 * production. Applied migrations are tracked in a `SequelizeMeta` table.
 *
 * Run via the CLI wrapper (`migrate.ts` → `npm run db:migrate`); the same
 * migrations run identically wherever `DATABASE_URL` points.
 */

/** What each migration receives: the schema-altering interface and the
 *  Sequelize constructor (for column data types). */
export interface MigrationContext {
  queryInterface: QueryInterface;
  Sequelize: typeof Sequelize;
}

// Absolute glob, forward-slashed — the matcher treats backslashes as escapes,
// so a raw Windows path would silently match nothing.
const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), "../migrations");

export const migrator = new Umzug<MigrationContext>({
  migrations: { glob: `${migrationsDir.replace(/\\/g, "/")}/*.ts` },
  context: {
    queryInterface: sequelize.getQueryInterface(),
    Sequelize,
  },
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

/** The shape of a migration module's `up`/`down` exports. */
export type Migration = typeof migrator._types.migration;
