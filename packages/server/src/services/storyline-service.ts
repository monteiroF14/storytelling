import {
	type Storyline,
	StorylineSchema,
	UpdateStatusSchema,
	UpdateStepsSchema,
	UpdateVisibilitySchema,
} from "@storytelling/types";
import { ValidationError } from "app/error";
import { logger } from "app/logger";
import { db } from "db";
import { storyline } from "db/schema";
import { asc, desc, eq } from "drizzle-orm";

export class StorylineService {
	async updateVisibility({
		id,
		visibility,
	}: Pick<Storyline, "id" | "visibility">) {
		try {
			const query = await db
				.update(storyline)
				.set({
					visibility,
					updated: Date.now(),
				})
				.where(eq(storyline.id, id))
				.returning()
				.get();

			const { status } = UpdateStatusSchema.parse(query.status);
			const { steps } = UpdateStepsSchema.parse(query.steps);

			return {
				...query,
				steps,
				status,
				visibility,
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

	async updateSteps({ id, steps }: Pick<Storyline, "id" | "steps">) {
		try {
			const query = await db
				.update(storyline)
				.set({
					steps: JSON.stringify(steps),
					updated: Date.now(),
				})
				.where(eq(storyline.id, id))
				.returning()
				.get();

			const { status } = UpdateStatusSchema.parse(query.status);
			const { visibility } = UpdateVisibilitySchema.parse(query.visibility);

			return {
				...query,
				steps,
				status,
				visibility,
			};
		} catch (e) {
			logger({
				message: e instanceof Error ? e.message : "error while updating steps",
				type: "ERROR",
			});
			throw e;
		}
	}

	async updateStatus({
		id,
		status,
	}: Pick<Storyline, "id" | "status">): Promise<Storyline> {
		try {
			const query = await db
				.update(storyline)
				.set({
					status,
					updated: Date.now(),
				})
				.where(eq(storyline.id, id))
				.returning()
				.get();

			const { steps } = UpdateStepsSchema.parse(query.steps);
			const { visibility } = UpdateVisibilitySchema.parse(query.visibility);

			return {
				...query,
				steps,
				status,
				visibility,
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
		try {
			const result = await db
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
			console.error(`Failed to create storyline: ${e}`);
			logger({
				message:
					e instanceof Error ? e.message : "error while creating storyline",
				type: "ERROR",
			});
		}
	}

	async read(storylineId: number) {
		try {
			const result = await db
				.select()
				.from(storyline)
				.where(eq(storyline.id, storylineId))
				.get();

			if (!result || !result.steps || result.steps === null) {
				return;
			}

			return {
				...result,
				steps: JSON.parse(result.steps) as Storyline["steps"],
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

			const result = await db
				.select()
				.from(storyline)
				.where(userId ? eq(storyline.userId, userId) : undefined)
				.limit(limit)
				.offset(offset)
				.orderBy(orderByQuery)
				.all();

			return result.map((storyline) => ({
				...storyline,
				steps: JSON.parse(storyline.steps) as Storyline["steps"],
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
		}
	}
}

export const storylineService = new StorylineService();
