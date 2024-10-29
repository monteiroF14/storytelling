import { authController } from "controllers/auth-controller";
import { userController } from "controllers/user-controller";
import { Hono } from "hono";

export const authRouter = new Hono();

authRouter.get("/google/", authController.login);
authRouter.get(
	"/google/callback",
	authController.getTokens,
	userController.handleUser,
	authController.generateAccessToken,
);
