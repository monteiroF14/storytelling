import { testDb } from "app/db/test";
import { UserService } from "./user-service";
import { PROFILE_FAKE_URL, seedUserTestDatabase } from "app/db/test/seed";
import { beforeEach, describe, expect, it } from "bun:test";

const userService = new UserService(testDb);

beforeEach(async () => {
	await seedUserTestDatabase();
});

describe("UserService", () => {
	describe("read", () => {
		it("should return a user by ID", async () => {
			const user = await userService.read(1);
			expect(user).toEqual({
				id: 1,
				username: "testuser1",
				email: "test1@example.com",
				picture: PROFILE_FAKE_URL,
				refreshToken: null,
			});
		});

		it("should return undefined for a non-existing user", async () => {
			const user = await userService.read(999); // Non-existent ID
			expect(user).toBeUndefined();
		});

		it("should return a user by email", async () => {
			const user = await userService.exists("test1@example.com");
			expect(user).toEqual({
				id: 1,
				username: "testuser1",
				email: "test1@example.com",
				picture: PROFILE_FAKE_URL,
				refreshToken: null,
			});
		});

		it("should return undefined for a non-existing email", async () => {
			const user = await userService.exists("nonexistent@example.com");
			expect(user).toBeUndefined();
		});
	});

	describe("create", () => {
		it("should insert a new user and return it", async () => {
			const newUser = await userService.create({
				username: "testuser3",
				email: "test3@example.com",
				picture: PROFILE_FAKE_URL,
			});

			expect(newUser).toEqual({
				id: expect.any(Number),
				username: "testuser3",
				email: "test3@example.com",
				picture: PROFILE_FAKE_URL,
				refreshToken: null,
			});

			const createdUser = await userService.exists("test3@example.com");
			expect(createdUser).toEqual(newUser);
		});

		it("should fail when required fields are missing", async () => {
			await expect(
				userService.create({
					username: null as unknown as string,
					email: "invalid@example.com",
					picture: PROFILE_FAKE_URL,
				}),
			).rejects.toThrowError("NOT NULL constraint failed: user.username");
		});

		it("should fail when a duplicate email is used", async () => {
			await expect(
				userService.create({
					username: "duplicateUser",
					email: "test1@example.com",
					picture: PROFILE_FAKE_URL,
				}),
			).rejects.toThrowError("UNIQUE constraint failed: user.email");
		});
	});
});
