import { Hono } from "hono";
import { authController } from "../controllers/auth-controller";
import { userController } from "../controllers/user-controller";

export const authRouter = new Hono();

authRouter.get("/google/", authController.login);
authRouter.get(
	"/google/callback",
	authController.getTokens,
	userController.handleUser,
	authController.generateAccessToken,
);