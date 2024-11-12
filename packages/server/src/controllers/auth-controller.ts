import { env } from "app/env";
import { logger } from "app/logger";
import type { Context, Next } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import jwt from "jsonwebtoken";
import { type AuthService, authService } from "services/auth-service";
import { type UserService, userService } from "services/user-service";
import { z } from "zod";

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

class AuthController {
	readonly authService: AuthService;
	readonly userService: UserService;

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

	login = (c: Context) => {
		const auth = this.authService.createConnection();
		const url = this.authService.getConnectionUrl(auth);

		return c.redirect(url, 307);
	};

	getTokens = async (c: Context, next: Next) => {
		try {
			const code = c.req.query("code");
			if (!code) {
				throw new HTTPException(404, { message: "No code found in query!" });
			}

			const result = await this.authService.getTokens({
				code: code as string,
			});

			if (!result) {
				throw new HTTPException(400, { message: "Failed to obtain tokens" });
			}

			c.set("tokens", result);
		} catch (e) {
			throw new HTTPException(401, {
				message: "Failed to get tokens",
				cause: e,
			});
		}

		return await next();
	};

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
			throw new HTTPException(422, {
				message: "Error while fetching google data",
			});
		}

		const user = await this.userService.exists(data.email);

		if (user) {
			const payload = jwt.sign(
				JSON.stringify({
					id: user.id,
				}),
				env.JWT_SECRET!,
			);

			c.set("payload", payload);
			return await next();
		}

		try {
			const newUser = await this.userService.create({
				email: data.email,
				username: data.given_name || data.name,
				picture: data.picture,
			});

			const payload = jwt.sign(
				JSON.stringify({
					id: newUser.id,
				}),
				env.JWT_SECRET!,
			);

			c.set("payload", payload);
			return await next();
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.handleUser.name} -> Error creating user: ${e}`,
				type: "ERROR",
			});
			throw new HTTPException(500, { message: e as string });
		}
	};

	signIn = async (c: Context) => {
		const payload = c.get("payload");
		if (!payload) {
			throw new HTTPException(400, { message: "Payload missing" });
		}

		setCookie(c, "auth", payload, {
			httpOnly: true,
			path: "/",
			maxAge: 7 * 86400,
		});

		return c.redirect("http://localhost:5173/", 301);
	};

	signOut = (c: Context) => {
		deleteCookie(c, "auth", {
			httpOnly: true,
			path: "/",
		});

		c.set("user", null);

		return c.json({ status: "success", message: "Successfully signed out" });
	};
}

export const authController = new AuthController({ authService, userService });
