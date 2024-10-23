import { Database } from "bun:sqlite";
import path from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";

const dbPath = path.join(__dirname, "../../sqlite.db");
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);
