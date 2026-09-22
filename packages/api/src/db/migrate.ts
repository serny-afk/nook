import { migrator } from "./migrator.js";

// Thin CLI entry: `tsx src/db/migrate.ts <up|down|pending|executed>`. Umzug
// parses argv, runs the command, prints the result, and exits the process.
void migrator.runAsCLI();
