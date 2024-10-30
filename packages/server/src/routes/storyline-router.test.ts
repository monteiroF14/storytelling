import { describe, expect, it } from "bun:test";
import type { Storyline } from "@storytelling/types";
import { env } from "app/env";
import app from "app/server";

describe("Storyline API", () => {
	describe("GET /storylines", () => {
		it("should fetch all storylines", async () => {
			const res = await app.request(`${env.API_URL}/storylines`);
			expect(res.ok).toBeTrue();
			expect(res.status).toBe(200);
		});
	});

	describe("GET /storylines with orderBy", () => {
		it("should fetch storylines with a valid orderBy field", async () => {
			const res = await app.request(
				`${env.API_URL}/storylines?orderBy=created&order=desc`,
			);
			expect(res.ok).toBeTrue();
			expect(res.status).toBe(200);
		});

		it("should fail if an invalid orderBy field is provided", async () => {
			const res = await app.request(
				`${env.API_URL}/storylines?orderBy=invalidField&order=desc`,
			);
			expect(res.ok).toBeFalse();
			expect(res.status).toBe(400);
		});

		it("should fetch storylines with a order direction", async () => {
			const res = await app.request(
				`${env.API_URL}/storylines?orderBy=created&order=asc`,
			);
			expect(res.ok).toBeTrue();
			expect(res.status).toBe(200);
		});
	});

	describe("POST /storylines", () => {
		it("should create a new storyline", async () => {
			const newStoryline = {
				title: "New Story",
				userId: 1,
				totalSteps: 10,
			};

			const res = await app.request(`${env.API_URL}/storylines`, {
				method: "POST",
				body: JSON.stringify(newStoryline),
				headers: { "Content-Type": "application/json" },
			});

			expect(res.ok).toBeTrue();
			expect(res.status).toBe(201);
		});

		it("should fail if invalid data is passed", async () => {
			const invalidData = {
				title: "",
				userId: -1,
				totalSteps: -5,
			};

			const res = await app.request(`${env.API_URL}/storylines`, {
				method: "POST",
				body: JSON.stringify(invalidData),
				headers: { "Content-Type": "application/json" },
			});

			expect(res.ok).toBeFalse();
			expect(res.status).toBe(400);
		});

		it("should fail if required fields are missing", async () => {
			const res = await app.request(`${env.API_URL}/storylines`, {
				method: "POST",
				body: JSON.stringify({ userId: 1 }), // missing title and totalSteps
				headers: { "Content-Type": "application/json" },
			});
			expect(res.ok).toBeFalse();
			expect(res.status).toBe(400);
		});

		it("should fail if userId is not a number", async () => {
			const res = await app.request(`${env.API_URL}/storylines`, {
				method: "POST",
				body: JSON.stringify({
					title: "New Story",
					userId: "abc",
					totalSteps: 10,
				}),
				headers: { "Content-Type": "application/json" },
			});
			expect(res.ok).toBeFalse();
			expect(res.status).toBe(400);
		});
	});

	describe("PATCH /storylines/:id/visibility", () => {
		it("should update the visibility of an existing storyline", async () => {
			const updatedVisibility = {
				visibility: "public",
			};

			const res = await app.request(`${env.API_URL}/storylines/1/visibility`, {
				method: "PATCH",
				body: JSON.stringify(updatedVisibility),
				headers: { "Content-Type": "application/json" },
			});

			expect(res.ok).toBeTrue();
			expect(res.status).toBe(200);
		});

		it("should fail if invalid visibility is provided", async () => {
			const invalidVisibility = {
				visibility: "invalidValue",
			};

			const res = await app.request(`${env.API_URL}/storylines/1/visibility`, {
				method: "PATCH",
				body: JSON.stringify(invalidVisibility),
				headers: { "Content-Type": "application/json" },
			});

			expect(res.ok).toBeFalse();
			expect(res.status).toBe(400);
		});
	});

	describe("PATCH /storylines/:id/steps", () => {
		it("should update the steps of an existing storyline", async () => {
			const updatedSteps = {
				steps: [
					{
						choice: "I go forward",
						description: "Your in the middle of nowhere, what do you do: ",
					},
				],
			};

			const res = await app.request(`${env.API_URL}/storylines/1/steps`, {
				method: "PATCH",
				body: JSON.stringify(updatedSteps),
				headers: { "Content-Type": "application/json" },
			});

			expect(res.ok).toBeTrue();
			expect(res.status).toBe(200);
		});

		it("should fail if steps are not provided", async () => {
			const res = await app.request(`${env.API_URL}/storylines/1/steps`, {
				method: "PATCH",
				body: JSON.stringify({}),
				headers: { "Content-Type": "application/json" },
			});

			expect(res.ok).toBeFalse();
			expect(res.status).toBe(400);
		});
	});

	describe("PATCH /storylines/:id/status", () => {
		it("should update the status of an existing storyline", async () => {
			const updatedStatus = {
				status: "completed",
			};

			const res = await app.request(`${env.API_URL}/storylines/1/status`, {
				method: "PATCH",
				body: JSON.stringify(updatedStatus),
				headers: { "Content-Type": "application/json" },
			});

			expect(res.ok).toBeTrue();
			expect(res.status).toBe(200);
			// Additional checks can be done here if necessary
		});

		it("should fail if an invalid status is provided", async () => {
			const invalidStatus = {
				status: "invalidStatus",
			};

			const res = await app.request(`${env.API_URL}/storylines/1/status`, {
				method: "PATCH",
				body: JSON.stringify(invalidStatus),
				headers: { "Content-Type": "application/json" },
			});

			expect(res.ok).toBeFalse();
			expect(res.status).toBe(400);
		});
	});

	describe("Error Handling", () => {
		it("should fail if the HTTP method is incorrect", async () => {
			const newStoryline = {
				title: "New Story",
				userId: 1,
				totalSteps: 10,
			};

			const res = await app.request(`${env.API_URL}/storylines/test`, {
				method: "POST",
				body: JSON.stringify(newStoryline),
				headers: { "Content-Type": "application/json" },
			});

			expect(res.ok).toBeFalse();
			expect(res.status).toBe(404);
		});

		it("should fail to generate choices and a description", async () => {
			const storyline = {
				title: "Updated Story",
				id: 1,
				created: Date.now(),
				status: "ongoing",
				steps: [],
				totalSteps: 10,
				updated: Date.now(),
				userId: 1,
				visibility: "private",
			} satisfies Storyline;

			const res = await app.request(`${env.API_URL}/storylines/generate`, {
				method: "POST",
				body: JSON.stringify(storyline),
				headers: { "Content-Type": "application/json" },
			});

			expect(res.ok).toBeFalse();
			expect(res.status).toBe(503);
		});
	});

	describe("GET /storylines/:id", () => {
		it("should fetch a storyline", async () => {
			const res = await app.request(`${env.API_URL}/storylines/1`);
			expect(res.ok).toBeTrue();
			expect(res.status).toBe(200);
		});
	});

	// TODO: make this work
	// it("should generate choices and a description", async () => {

	// 	apiModelService.isModelAvailable = true;

	// 	const storyline = {
	// 		title: "Updated Story",
	// 		id: 1,
	// 		created: Date.now(),
	// 		status: "ongoing",
	// 		steps: [],
	// 		totalSteps: 10,
	// 		updated: Date.now(),
	// 		userId: 1,
	// 		visibility: "private",
	// 	} satisfies Storyline;

	// 	const res = await app.request(`${env.API_URL}/storylines/generate`, {
	// 		method: "POST",
	// 		body: JSON.stringify(storyline),
	// 		headers: { "Content-Type": "application/json" },
	// 	});

	// 	expect(res.ok).toBeTrue();
	// 	expect(res.status).toBe(200);
	// });
});
