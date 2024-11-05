import { storylineController } from "controllers/storyline-controller";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "routes/auth-router";
import { createStorylineRouter } from "routes/storyline-router";
import { userController } from "./controllers/user-controller";
import { apiModelService } from "./services/api-model-service";

const app = new Hono({ strict: false });

app.use(
	cors({
		credentials: true,
		origin: "http://localhost:5173",
		allowMethods: ["POST", "GET", "PATCH"],
	}),
);

app.get("/", (c: Context) => {
	return c.json({ status: "running" });
});

app.get("/me", userController.getUser);

app.route("/auth", authRouter);
app.route("/storylines", createStorylineRouter(storylineController));

await apiModelService.initializeModel();

export default app;
