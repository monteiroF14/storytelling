import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { logger } from "../logger";
import { type AuthService, authService } from "../services/auth-service";
import { type UserService, userService } from "../services/user-service";

const GoogleTokensSchema = z.object({
	access_token: z.string().min(1, { message: "Access token is required" }),
	refresh_token: z.string().min(1, { message: "Refresh token is required" }),
	scope: z.string().min(1, { message: "Scope is required" }),
	token_type: z.string().min(1, { message: "Token type is required" }),
	id_token: z.string().min(1, { message: "ID token is required" }),
	expiry_date: z
		.number()
		.int()
		.positive({ message: "Expiry date must be a positive integer" }),
});

class UserController {
	readonly userService: UserService;
	readonly authService: AuthService;

	constructor({
		authService,
		userService,
	}: {
		authService: AuthService;
		userService: UserService;
	}) {
		this.authService = authService;
		this.userService = userService;
	}

	handleUser = async (c: Context, next: Next) => {
		const tokens = c.get("tokens");
		GoogleTokensSchema.parse(tokens);

		const { data } = await this.authService.getUserInfo({
			access_token: c.get("tokens").access_token,
		});

		if (
			!data ||
			!data.email ||
			!data.name ||
			!data.picture ||
			!data.given_name
		) {
			throw new HTTPException(400, {
				message: "Error while fetching google data",
			});
		}

		const user = await this.userService.exists(data.email);
		if (user) {
			c.set("user", user);
			return await next();
		}

		try {
			const newUser = await this.userService.create({
				email: data.email,
				username: data.given_name || data.name,
				picture: data.picture,
			});

			const refreshToken = await this.authService.createJwtToken({
				id: newUser.id,
				email: data.email,
				role: "APPLICATION_USER",
			});

			const updatedUser = await this.userService.setRefreshToken({
				refreshToken,
				userId: newUser.id,
			});

			return c.set("user", updatedUser);
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.handleUser.name} -> Error creating user: ${e}`,
				type: "ERROR",
			});
			throw new HTTPException(500, { message: e as string });
		}
	};

	getUser = async (c: Context, next: Next) => {
		try {
			let user = c.get("user");
			if (user) return c.json({ user });

			const userId = c.req.param("id");
			if (!userId) return await next();

			user = await userService.read(Number.parseInt(userId));

			return c.json({ user });
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.handleUser.name} -> Error fetching user: ${e}`,
				type: "ERROR",
			});
			throw new HTTPException(500, { message: e as string });
		}
	};
}

export const userController = new UserController({ authService, userService });
