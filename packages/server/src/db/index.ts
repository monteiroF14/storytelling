import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import path from "path";

const dbPath = path.join(__dirname, "../../sqlite.db");
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);
