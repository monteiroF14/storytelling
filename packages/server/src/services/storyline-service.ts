import { eq } from "drizzle-orm";
import { storyline } from "../db/schema";
import { logger } from "../logger";
import { db } from "../db";
import type { Storyline } from "@storytelling/types";

class StorylineService {
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
				message: e instanceof Error ? e.message : "error while updating storyline",
				type: "ERROR",
			});
		}
	}

	async create({ title, totalSteps, userId }: Pick<Storyline, "title" | "totalSteps" | "userId">) {
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
				return;
			}

			return result;
		} catch (e) {
			logger({
				message: e instanceof Error ? e.message : "error while creating storyline",
				type: "ERROR",
			});
		}
	}

	async read(storylineId: number) {
		try {
			const result = await db.select().from(storyline).where(eq(storyline.id, storylineId)).get();

			if (!result || !result.steps || result.steps === null) {
				return;
			}

			return {
				...result,
				steps: JSON.parse(result.steps) as Storyline["steps"],
			} as Storyline;
		} catch (e) {
			logger({
				message: e instanceof Error ? e.message : "error while reading storyline",
				type: "ERROR",
			});
		}
	}

	async getUserStorylines({ userId }: { userId: number }): Promise<Storyline[] | undefined> {
		try {
			const result = await db.select().from(storyline).where(eq(storyline.userId, userId)).all();
			if (!result) return;

			return result.map((storyline) => ({
				...storyline,
				steps: JSON.parse(storyline.steps) as Storyline["steps"],
			}));
		} catch (e) {
			logger({
				message: e instanceof Error ? e.message : "error while fetching user storylines",
				type: "ERROR",
			});
		}
	}
}

export const storylineService = new StorylineService();
