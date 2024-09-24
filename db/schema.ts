import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: integer("id").primaryKey(),
	username: text("username").unique(),
});

export const story = sqliteTable("story", {
	id: integer("id").primaryKey(),
	userId: text("user_id").references(() => user.id),
	title: text("title").notNull(),
	content: text("content").notNull(),
	created: text("created")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updated: text("updated")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});
