import { eq } from "drizzle-orm";
import { storyline } from "../db/schema";
import { logger } from "../logger";
import { db } from "../db";
import type { Storyline } from "@storytelling/types";

class StorylineService {
	async update({ storylineId, steps }: { storylineId: number; steps: Storyline["steps"] }) {
		try {
			await db
				.update(storyline)
				.set({
					steps: JSON.stringify(steps),
				})
				.where(eq(storyline.id, storylineId));
		} catch (e) {
			logger({
				message: e instanceof Error ? e.message : "error while updating storyline",
				type: "ERROR",
			});
		}
	}

	async create(newStoryline: Storyline) {
		try {
			await db.insert(storyline).values({
				...newStoryline,
				steps: JSON.stringify(newStoryline.steps),
			});
		} catch (e) {
			logger({
				message: e instanceof Error ? e.message : "error while creating storyline",
				type: "ERROR",
			});
		}
	}

	async read({ storylineId }: { storylineId: number }) {
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
}

export const storylineService = new StorylineService();
