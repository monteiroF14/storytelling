import { env } from "app/env";
import { logger } from "app/logger";
import { storylineController } from "controllers/storyline-controller";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "routes/auth-router";
import { createStorylineRouter } from "routes/storyline-router";
import { apiModelService } from "services/api-model-service";

const app = new Hono({ strict: false });

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);

app.get("/", (c: Context) => {
	apiModelService.initializeModel();

	return c.json({ status: "running" });
});

app.route("/auth", authRouter);
app.route("/storylines", createStorylineRouter(storylineController));

logger({
	message: `server is running in ${env.API_URL}`,
	type: "INFO",
});

export default app;
