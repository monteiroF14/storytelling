import { cleanupTestDatabase, testDb } from "app/db/test";
import {
	seedUserTestDatabase,
	seedStorylineTestDatabase,
} from "app/db/test/seed";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { StorylineService } from "./storyline-service";
import { faker } from "@faker-js/faker";

const storylineService = new StorylineService(testDb);

// TODO: add edge cases tests for field validations (negatives, zeros, large strings and invalid types)

beforeAll(async () => {
	await seedUserTestDatabase();
	await seedStorylineTestDatabase();
});

afterAll(async () => {
	cleanupTestDatabase();
});

describe("StorylineService", () => {
	describe("create", () => {
		it("should create a new storyline", async () => {
			const newStoryline = await storylineService.create({
				title: "New Adventure",
				totalSteps: 10,
				userId: 1,
			});

			expect(newStoryline).toBeDefined();
			expect(newStoryline).toMatchObject({
				id: expect.any(Number),
				title: "New Adventure",
				totalSteps: 10,
				userId: 1,
				visibility: "public",
				status: "ongoing",
				created: expect.any(Number),
				updated: expect.any(Number),
			});
		});

		it("should throw an error if required fields are missing", async () => {
			await expect(
				// @ts-ignore
				storylineService.create({
					totalSteps: 8,
					userId: 1,
				}),
			).rejects.toThrow();
		});

		it("should throw an error for negative totalSteps value", async () => {
			await expect(
				storylineService.create({
					title: "Adventure",
					totalSteps: 21,
					userId: 1,
				}),
			).rejects.toThrowError(/totalSteps must be 20 or less/);
		});

		it("should throw an error for totalSteps above 20", async () => {
			await expect(
				storylineService.create({
					title: "Adventure",
					totalSteps: -5,
					userId: 1,
				}),
			).rejects.toThrowError(/totalSteps must be a positive value/);
		});
	});

	describe("read", () => {
		it("should return a storyline by ID", async () => {
			const newStoryline = await storylineService.create({
				title: "New Adventure",
				totalSteps: 10,
				userId: 1,
			});

			const storyline = await storylineService.read(newStoryline.id);

			expect(storyline).toBeDefined();
			expect(newStoryline).toMatchObject({
				id: expect.any(Number),
				title: "New Adventure",
				totalSteps: 10,
				userId: 1,
				visibility: "public",
				status: "ongoing",
				created: expect.any(Number),
				updated: expect.any(Number),
			});
		});

		it("should return undefined for a non-existent storyline", async () => {
			const storyline = await storylineService.read(999); // Non-existent ID
			expect(storyline).toBeUndefined();
		});

		it("should fetch all storylines for a user with default pagination", async () => {
			const storylines = await storylineService.getStorylines({
				userId: 1,
			});

			expect(storylines).toBeDefined();
			expect(storylines?.length).toBeGreaterThan(0);
			expect(storylines?.[0]).toEqual(
				expect.objectContaining({
					userId: 1,
					chapters: expect.any(Array),
					status: expect.any(String),
					visibility: expect.any(String),
				}),
			);
		});

		it("should fetch all storylines sorted by created date in descending order", async () => {
			const storylines = await storylineService.getStorylines({
				userId: 1,
				orderBy: "created",
				order: "DESC",
			});

			expect(storylines).toBeDefined();

			if (storylines && storylines.length > 1) {
				const firstCreated = storylines[0]?.created;
				const lastCreated = storylines[storylines.length - 1]?.created;

				if (firstCreated !== lastCreated) {
					expect(firstCreated).toBeGreaterThan(lastCreated!);
				}
			}
		});

		it("should fetch all storylines sorted by created date in ascending order", async () => {
			const storylines = await storylineService.getStorylines({
				userId: 1,
				orderBy: "created",
				order: "ASC",
			});

			expect(storylines).toBeDefined();

			if (storylines && storylines.length > 1) {
				const firstCreated = storylines[0]?.created;
				const lastCreated = storylines[storylines.length - 1]?.created;

				if (firstCreated !== lastCreated) {
					expect(firstCreated).toBeLessThan(lastCreated!);
				}
			}
		});

		it("should throw a validation error for invalid orderBy field", async () => {
			await expect(
				storylineService.getStorylines({
					userId: 1,
					orderBy: "invalidField",
				}),
			).rejects.toThrowError(/Invalid orderBy field:/);
		});
	});

	describe("update", async () => {
		const newStoryline = await storylineService.create({
			title: faker.lorem.words(),
			totalSteps: 10,
			userId: 1,
		});

		describe("visibility", () => {
			it("should update visibility of a storyline", async () => {
				const updatedStoryline = await storylineService.updateVisibility({
					id: newStoryline.id,
					visibility:
						newStoryline.visibility === "private" ? "public" : "private",
				});

				expect(updatedStoryline).toEqual(
					expect.objectContaining({
						id: newStoryline.id,
						visibility:
							newStoryline.visibility === "private" ? "public" : "private",
						chapters: expect.any(Array),
					}),
				);
			});

			it("should throw an error if visibility value is missing", async () => {
				await expect(
					// @ts-ignore
					storylineService.updateVisibility({
						id: newStoryline.id,
					}),
				).rejects.toThrowError();
			});
		});

		describe("chapters", () => {
			it("should update chapters of a storyline", async () => {
				const updatedStoryline = await storylineService.updateChapters({
					id: newStoryline.id,
					chapters: [
						...JSON.parse(newStoryline.chapters),
						{
							choice: {
								synopsis: "fake-synopsis",
								text: "fake-text",
							},
							description: "fake-description",
						},
					],
				});

				expect(updatedStoryline).toEqual(
					expect.objectContaining({
						id: newStoryline.id,
						chapters: [
							...JSON.parse(newStoryline.chapters),
							{
								choice: {
									synopsis: "fake-synopsis",
									text: "fake-text",
								},
								description: "fake-description",
							},
						],
					}),
				);
			});

			it("should throw an error for invalid chapters format", async () => {
				await expect(
					storylineService.updateChapters({
						id: newStoryline.id,
						// @ts-ignore
						chapters: null,
					}),
				).rejects.toThrowError();
			});
		});

		describe("status", async () => {
			it("should update status of a storyline", async () => {
				const updatedStoryline = await storylineService.updateStatus({
					id: newStoryline.id,
					status: newStoryline.status === "completed" ? "ongoing" : "completed",
				});

				expect(updatedStoryline).toEqual(
					expect.objectContaining({
						id: newStoryline.id,
						status:
							newStoryline.status === "completed" ? "ongoing" : "completed",
						chapters: expect.any(Array),
					}),
				);
			});

			it("should throw an error if status field is missing", async () => {
				await expect(
					// @ts-ignore
					storylineService.updateStatus({
						id: 1,
					}),
				).rejects.toThrowError();
			});
		});
	});
});
