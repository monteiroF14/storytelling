import type { StorylineController } from "controllers/storyline-controller";
import { Hono } from "hono";

export const createStorylineRouter = (controller: StorylineController) => {
	const storylineRouter = new Hono();

	storylineRouter.get("/", controller.getStorylines);
	storylineRouter.get("/:storylineId", controller.getStoryline);
	storylineRouter.post("/", controller.createStoryline);

	storylineRouter.patch("/:id/visibility", controller.updateVisibility);
	storylineRouter.patch("/:id/steps", controller.updateSteps);
	storylineRouter.patch("/:id/status", controller.updateStatus);

	// TODO: prefetch this route on storyline load
	storylineRouter.post("/generate", controller.generate);

	return storylineRouter;
};
