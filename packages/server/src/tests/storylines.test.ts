import { describe, expect, it } from "bun:test";
import { app } from "../server";
import { env } from "../env";

describe("Storyline API", () => {
	it("should fetch all storylines", async () => {
		const res = await app.request(`${env.API_URL}/storylines`);
		const body = await res.json();
		console.log("res: ", res);
		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
	});

	it("should create a new storyline", async () => {
		const newStoryline = { title: "New Story", prompt: "Once upon a time..." };
		const res = await app.request(`${env.API_URL}/storylines`, {
			method: "POST",
			body: JSON.stringify(newStoryline),
			headers: { "Content-Type": "application/json" },
		});
		const body = await res.json();
		expect(res.status).toBe(201);
		expect(body.storyline.title).toBe("New Story");
	});

	it("should fetch a storyline", async () => {
		const res = await app.request(`${env.API_URL}/storylines/1`);
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
	});

	it("should update an existing storyline", async () => {
		const updatedData = { title: "Updated Story" };
		const res = await app.request(`${env.API_URL}/storylines/1`, {
			method: "PATCH",
			body: JSON.stringify(updatedData),
			headers: { "Content-Type": "application/json" },
		});
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body.storyline.title).toBe("Updated Story");
	});
});
