import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import chalk from "chalk";
import { db } from ".";

await migrate(db, { migrationsFolder: "./drizzle" });
console.log(chalk.greenBright("Migrations applied successfully!"));
