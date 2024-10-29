import type { JwtPayload, User } from "@storytelling/types";
import { env } from "app/env";
import type { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import jwt from "jsonwebtoken";
import { type AuthService, authService } from "services/auth-service";
import { type UserService, userService } from "services/user-service";

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

		return c.redirect(url);
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

	generateAccessToken = async (c: Context) => {
		try {
			// add user validation, maybe zod
			const user = c.get("user") as User;

			const userId = user.id;
			if (Number.isNaN(userId)) {
				throw new HTTPException(401, {
					message: "Failed to get a valid userId in URL",
				});
			}

			const refreshTokenFromDb = await this.userService.getUserRefreshToken({
				userId,
			});
			const refreshToken = refreshTokenFromDb
				? refreshTokenFromDb
				: getCookie(c, "refreshToken");

			if (!refreshToken) {
				throw new HTTPException(401, {
					message: "Refresh token not provided.",
				});
			}

			const decoded = jwt.verify(refreshToken, env.JWT_SECRET!) as JwtPayload;

			const accessToken = this.authService.createJwtToken({
				id: decoded.id,
				email: decoded.email,
				role: decoded.role,
				expiration: env.ACCESS_TOKEN_EXPIRATION,
			});

			const oneDayFromNow = new Date(Date.now() + 86400000).toUTCString();

			c.res.headers.set("Authorization", `Bearer ${accessToken}`);
			setCookie(c, "accessToken", accessToken, {
				httpOnly: true,
				sameSite: "None",
				secure: true,
				path: "/",
				domain: "localhost",
				expires: new Date(oneDayFromNow),
			});

			return c.redirect("http://localhost:5173/");
		} catch (err) {
			if (err instanceof jwt.TokenExpiredError) {
				throw new HTTPException(401, { message: "Refresh token has expired." });
			}
			if (err instanceof jwt.JsonWebTokenError) {
				throw new HTTPException(401, { message: "Invalid refresh token." });
			}

			throw new HTTPException(500, {
				message:
					err instanceof HTTPException
						? err.message
						: err instanceof Error
							? err.message
							: (err as string),
			});
		}
	};
}

export const authController = new AuthController({ authService, userService });
