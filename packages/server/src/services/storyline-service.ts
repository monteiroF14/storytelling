import { type Storyline, StorylineSchema } from "@storytelling/types";
import { ValidationError } from "app/error";
import { logger } from "app/logger";
import { db } from "db";
import { storyline } from "db/schema";
import { asc, desc, eq } from "drizzle-orm";
import assert from "node:assert";

// ? should I really assert here?

export class StorylineService {
	constructor(private database: typeof db) {}

	async updateVisibility({
		id,
		visibility,
	}: Pick<Storyline, "id" | "visibility">): Promise<Storyline> {
		// fix the db schema, make sure it sets to the default value
		assert(visibility, "Visibility must not be undefined");

		try {
			const existingStoryline = await this.database
				.select()
				.from(storyline)
				.where(eq(storyline.id, id))
				.get();
			assert(existingStoryline, `Storyline with id ${id} must exist.`);

			const query = await this.database
				.update(storyline)
				.set({
					visibility,
					updated: Date.now(),
				})
				.where(eq(storyline.id, id))
				.returning()
				.get();

			// @ts-expect-error
			return {
				...query,
				chapters: JSON.parse(query.chapters),
			};
		} catch (e) {
			logger({
				message:
					e instanceof Error ? e.message : "error while updating visibility",
				type: "ERROR",
			});
			throw e;
		}
	}

	async updateChapters({ id, chapters }: Pick<Storyline, "id" | "chapters">) {
		// fix the db schema, make sure it sets to the default value
		assert(chapters, "chapters must not be undefined");

		try {
			const query = await this.database
				.update(storyline)
				.set({
					chapters: JSON.stringify(chapters),
					updated: Date.now(),
				})
				.where(eq(storyline.id, id))
				.returning()
				.get();

			return {
				...query,
				chapters: JSON.parse(query.chapters),
			};
		} catch (e) {
			logger({
				message:
					e instanceof Error ? e.message : "error while updating chapters",
				type: "ERROR",
			});
			throw e;
		}
	}

	async updateStatus({
		id,
		status,
	}: Pick<Storyline, "id" | "status">): Promise<Storyline> {
		// fix the db schema, make sure it sets to the default value
		assert(status, "status must not be undefined");

		try {
			const query = await this.database
				.update(storyline)
				.set({
					status,
					updated: Date.now(),
				})
				.where(eq(storyline.id, id))
				.returning()
				.get();

			// @ts-expect-error
			return {
				...query,
				chapters: JSON.parse(query.chapters),
			};
		} catch (e) {
			logger({
				message: e instanceof Error ? e.message : "error while updating status",
				type: "ERROR",
			});
			throw e;
		}
	}

	async create({
		title,
		totalSteps = 8,
		userId,
	}: Pick<Storyline, "title" | "totalSteps" | "userId">) {
		assert(totalSteps && totalSteps > 0, "totalSteps must be a positive value");
		assert(totalSteps <= 20, "totalSteps must be 20 or less");

		try {
			const result = await this.database
				.insert(storyline)
				.values({
					title,
					userId,
					totalSteps,
				})
				.returning()
				.get();

			if (!result) {
				throw new Error("failed to create storyline");
			}

			return result;
		} catch (e) {
			logger({
				message:
					e instanceof Error ? e.message : "error while creating storyline",
				type: "ERROR",
			});
			throw e;
		}
	}

	async read(storylineId: number) {
		try {
			const result = await this.database
				.select()
				.from(storyline)
				.where(eq(storyline.id, storylineId))
				.get();

			if (!result || !result.chapters || result.chapters === null) {
				return;
			}

			return {
				...result,
				chapters: JSON.parse(result.chapters) as Storyline["chapters"],
			} as Storyline;
		} catch (e) {
			logger({
				message:
					e instanceof Error ? e.message : "error while reading storyline",
				type: "ERROR",
			});
		}
	}

	async getStorylines({
		userId,
		limit = 12,
		offset = 0,
		orderBy = "created",
		order = "ASC",
	}: {
		userId?: number;
		limit?: number;
		offset?: number;
		orderBy?: string;
		order?: string;
	}): Promise<Storyline[] | undefined> {
		function isOrderByKey(orderBy: string): orderBy is keyof Storyline {
			return orderBy in StorylineSchema.shape;
		}

		if (!isOrderByKey(orderBy)) {
			throw new ValidationError(
				`Invalid orderBy field: ${orderBy}. Allowed fields are: id, userId, title, created, updated, status, visibility.`,
			);
		}

		try {
			const orderByQuery =
				order === "ASC" ? asc(storyline[orderBy]) : desc(storyline[orderBy]);

			const result = await this.database
				.select()
				.from(storyline)
				.where(userId ? eq(storyline.userId, userId) : undefined)
				.limit(limit)
				.offset(offset)
				.orderBy(orderByQuery)
				.all();

			return result.map((storyline) => ({
				...storyline,
				chapters: JSON.parse(storyline.chapters) as Storyline["chapters"],
				visibility: storyline.visibility as "public" | "private",
				status: storyline.status as "ongoing" | "completed",
			}));
		} catch (e) {
			logger({
				message:
					e instanceof Error
						? e.message
						: "error while fetching user storylines",
				type: "ERROR",
			});
			console.log("error: ", e);
			throw e;
		}
	}
}

export const storylineService = new StorylineService(db);
