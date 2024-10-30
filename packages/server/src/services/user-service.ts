import type { User } from "@storytelling/types";
import { logger } from "app/logger";
import { db } from "db";
import { user } from "db/schema";
import { eq } from "drizzle-orm";

export class UserService {
	async getUserRefreshToken({ userId }: { userId: number }) {
		try {
			const result = await db
				.select()
				.from(user)
				.where(eq(user.id, userId))
				.get();

			if (!result || !result.refreshToken || result.refreshToken === null) {
				return;
			}

			return result.refreshToken;
		} catch (e) {
			logger({
				message:
					e instanceof Error
						? e.message
						: "error while reading user refresh token",
				type: "ERROR",
			});
		}
	}

	async read(userId: number): Promise<User | undefined> {
		try {
			const result = await db
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
			const result = await db
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
			const result = await db
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

	async setRefreshToken({
		userId,
		refreshToken,
	}: {
		userId: number;
		refreshToken: string;
	}): Promise<User> {
		try {
			const result = await db
				.update(user)
				.set({
					refreshToken,
				})
				.where(eq(user.id, userId))
				.returning()
				.get();

			if (!result) {
				throw new Error(`User with id ${userId} doesn't exist`);
			}

			return result;
		} catch (e) {
			logger({
				message:
					e instanceof Error
						? e.message
						: "error while updating user refresh token",
				type: "ERROR",
			});
			throw e;
		}
	}
}

export const userService = new UserService();
