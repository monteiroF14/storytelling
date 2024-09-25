import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const storyline = sqliteTable("storyline", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	title: text("title").notNull(),
	steps: text("steps"), // json array with all storyline data
	totalSteps: integer("total_steps"), // number of steps a storyline has
	status: text("status").default("ongoing"),
	created: text("created")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updated: text("updated")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export const user = sqliteTable("user", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	email: text("email"),
	username: text("username"),
	currentStorylineId: integer("current_storyline_id").references(() => storyline.id),
	currentStorylineStep: integer("current_storyline_step"),
	completedStorylines: text("completed_storylines").default("[]"), // json array with storyline id's
});
