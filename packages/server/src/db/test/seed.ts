import type { Storyline } from "@storytelling/types";
import { testDb } from ".";
import { storyline, user } from "../schema";
import { faker } from "@faker-js/faker";

export const PROFILE_FAKE_URL =
	"https://i.pinimg.com/564x/ee/e8/88/eee888fe96ee35e0d0e56b04d086b667.jpg";

export async function seedUserTestDatabase() {
	await testDb.delete(user).run();
	await testDb
		.insert(user)
		.values([
			{
				id: 1,
				username: "testuser1",
				email: "test1@example.com",
				picture: PROFILE_FAKE_URL,
			},
			{
				id: 2,
				username: "testuser2",
				email: "test2@example.com",
				picture: PROFILE_FAKE_URL,
			},
		])
		.run();
}

export async function seedStorylineTestDatabase() {
	const newStorylines = Array.from({
		length: 10,
	}).map(() => {
		return {
			userId: faker.helpers.arrayElement([1, 2]),
			title: faker.lorem.words(),
			chapters: JSON.stringify([
				{
					choice: {
						synopsis: faker.lorem.sentence(),
						text: faker.lorem.text(),
					},
					description: faker.lorem.paragraphs(),
				},
			] satisfies Storyline["chapters"]),
			totalSteps: 8,
			status: faker.helpers.arrayElement(["ongoing", "completed"]),
			visibility: faker.helpers.arrayElement(["public", "private"]),
			created: Date.now(),
			updated: Date.now(),
		};
	});

	await testDb.delete(storyline).run();
	await testDb.insert(storyline).values(newStorylines).run();
}
