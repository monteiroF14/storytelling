import type { Storyline } from "@storytelling/types";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { storyline } from "../db/schema";
import { logger } from "../logger";

export class StorylineService {
	async update({ storyline: newStoryline }: { storyline: Storyline }) {
		try {
			return await db
				.update(storyline)
				.set({
					...newStoryline,
					steps: JSON.stringify(newStoryline.steps),
					updated: Date.now(),
				})
				.where(eq(storyline.id, newStoryline.id))
				.returning()
				.get();
		} catch (e) {
			logger({
				message:
					e instanceof Error ? e.message : "error while updating storyline",
				type: "ERROR",
			});
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
	}: { userId?: number; limit?: number; offset?: number }): Promise<
		Storyline[] | undefined
	> {
		try {
			const result = await db
				.select()
				.from(storyline)
				.where(userId ? eq(storyline.userId, userId) : undefined)
				.limit(limit)
				.offset(offset)
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
