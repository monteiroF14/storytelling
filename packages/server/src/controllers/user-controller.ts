import type { JwtPayload } from "@storytelling/types";
import { env } from "app/env";
import { logger } from "app/logger";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import jwt from "jsonwebtoken";
import { type UserService, userService } from "services/user-service";

class UserController {
	constructor(private userService: UserService) {}

	getUser = async (c: Context) => {
		try {
			const authCookie = getCookie(c, "auth");
			if (!authCookie) {
				throw new HTTPException(400, {
					message: "Missing auth cookie",
				});
			}

			const payload = (await jwt.verify(
				authCookie,
				env.JWT_SECRET!,
			)) as JwtPayload;

			const user = await this.userService.read(payload.id);

			if (!user) {
				throw new HTTPException(404, {
					message: "User not found",
				});
			}

			return c.json({ user });
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.getUser.name} -> Error fetching user: ${e}`,
				type: "ERROR",
			});
			throw new HTTPException(500, { message: e as string });
		}
	};
}

export const userController = new UserController(userService);
