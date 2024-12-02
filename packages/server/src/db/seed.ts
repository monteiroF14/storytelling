import { Database } from "bun:sqlite";
import path from "node:path";
import { faker } from "@faker-js/faker";
import chalk from "chalk";
import { storyline } from "db/schema";
import { drizzle } from "drizzle-orm/bun-sqlite";

const dbPath = path.join(__dirname, "../../sqlite.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function seedDatabase() {
	const storylines = Array.from({ length: 20 }).map(() => {
		return {
			userId: 1,
			title: faker.lorem.sentence(),
			chapters: JSON.stringify([
				{
					choice: {
						synopsis: faker.lorem.sentence(),
						text: faker.lorem.text(),
					},
					description: faker.lorem.paragraphs(),
				},
			]),
			totalSteps: 8,
			status: faker.helpers.arrayElement(["ongoing", "completed"]),
			visibility: faker.helpers.arrayElement(["public", "private"]),
			created: Math.floor(Date.now() / 1000),
			updated: Math.floor(Date.now() / 1000),
		};
	});

	await Promise.all(
		storylines.map(async (storylineData) => {
			await db.insert(storyline).values(storylineData);
		}),
	);

	chalk.bgGreenBright("Seeding completed!");
}

seedDatabase()
	.then(() => {
		sqlite.close();
	})
	.catch((error) => {
		console.error("Seeding failed:", error);
		sqlite.close();
	});
