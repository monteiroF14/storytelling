import { authController } from "controllers/auth-controller";
import { Hono } from "hono";

export const authRouter = new Hono();

authRouter.get("/google", authController.login);

authRouter.get(
	"/google/callback",
	authController.getTokens,
	authController.handleUser,
	authController.signIn,
);

authRouter.post("/logout", authController.signOut);
