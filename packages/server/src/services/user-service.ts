import type { User } from "@storytelling/types";
import { logger } from "app/logger";
import { db } from "db";
import { user } from "db/schema";
import { eq } from "drizzle-orm";

export class UserService {
	constructor(private database: typeof db) {}

	async read(userId: number): Promise<User | undefined> {
		try {
			const result = await this.database
				.select()
				.from(user)
				.where(eq(user.id, userId))
				.get();

			return result;
		} catch (e) {
			logger({
				message:
					e instanceof Error
						? e.message
						: "failed to get whether user exists or not",
				type: "ERROR",
			});
			console.error("failed to read user");
			return;
		}
	}

	async exists(email: string): Promise<User | undefined> {
		try {
			const result = await this.database
				.select()
				.from(user)
				.where(eq(user.email, email))
				.get();
			return result;
		} catch (e) {
			logger({
				message:
					e instanceof Error
						? e.message
						: "failed to get whether user exists or not",
				type: "ERROR",
			});
			console.error("failed to read user");
			return;
		}
	}

	async create({
		username,
		email,
		picture,
	}: Pick<User, "username" | "email" | "picture">): Promise<User> {
		try {
			const result = await this.database
				.insert(user)
				.values({ username, email, picture })
				.returning()
				.get();
			return result;
		} catch (e) {
			logger({
				message: e instanceof Error ? e.message : "error while creating user",
				type: "ERROR",
			});
			throw e;
		}
	}
}

export const userService = new UserService(db);
