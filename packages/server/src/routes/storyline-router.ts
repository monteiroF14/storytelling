import type { StorylineController } from "controllers/storyline-controller";
import { Hono } from "hono";

export const createStorylineRouter = (controller: StorylineController) => {
	const storylineRouter = new Hono();

	storylineRouter.get("/", controller.getStorylines);
	storylineRouter.get("/:storylineId", controller.getStoryline);
	storylineRouter.post("/", controller.createStoryline);

	storylineRouter.patch("/:id/visibility");
	storylineRouter.patch("/:id/steps");
	storylineRouter.patch("/:id/status");

	// TODO: prefetch this route on storyline load
	// storylineRouter.post("/generate", controller.generateChoices);

	return storylineRouter;
};
