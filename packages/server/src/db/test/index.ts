import { Database } from "bun:sqlite";
import path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { unlink } from "node:fs";

const dbPath = path.join(__dirname, "../../../test.db");
const sqlite = new Database(dbPath);

export const testDb = drizzle(sqlite);

/**
 * Removes the test database file.
 */
export function cleanupTestDatabase() {
	unlink(dbPath, (err) => {
		if (err) throw err;
		console.log(`${dbPath} was deleted!`);
	});
}
