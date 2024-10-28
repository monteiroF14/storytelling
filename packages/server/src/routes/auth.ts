import { Hono } from "hono";
import { authController } from "../controllers/auth-controller";
import { userController } from "../controllers/user-controller";

export const auth = new Hono();

auth.get("/google/", authController.login);
auth.get(
	"/google/callback",
	authController.getTokens,
	userController.handleUser,
	authController.generateAccessToken,
);
