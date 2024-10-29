import { type Context, Hono, type Next } from "hono";
import { cors } from "hono/cors";
import { env } from "./env";
import { logger } from "./logger";
import { authRouter } from "./routes/auth-router";
import { createStorylineRouter } from "./routes/storyline-router";
import { apiModelService } from "./services/api-model-service";
import { storylineController } from "./controllers/storyline-controller";

export const app = new Hono({ strict: false });

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

export default app;

logger({
	message: `server is running in ${env.API_URL}`,
	type: "INFO",
});
