import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	email: text("email").notNull().unique(),
	username: text("username").notNull(),
	picture: text("picture"),
	refreshToken: text("refresh_token"),
});

export const storyline = sqliteTable("storyline", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: integer("userId")
		.notNull()
		.references(() => user.id),
	title: text("title").notNull(),
	steps: text("steps").notNull().default("[]"), // json array with all storyline data
	totalSteps: integer("total_steps"), // number of steps a storyline has
	status: text("status").default("ongoing").notNull(),
	visibility: text("visibility").default("public").notNull(),
	created: integer("created").notNull().default(sql`unixepoch('now')`),
	updated: integer("updated").notNull().default(sql`unixepoch('now')`),
});
