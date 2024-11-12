import type { StorylineController } from "controllers/storyline-controller";
import { Hono } from "hono";

export const createStorylineRouter = (controller: StorylineController) => {
	const storylineRouter = new Hono();

	storylineRouter.get("/", controller.getStorylines);
	storylineRouter.get("/:storylineId", controller.getStoryline);
	storylineRouter.post("/", controller.createStoryline);

	storylineRouter.patch("/:id/visibility", controller.updateVisibility);
	storylineRouter.patch("/:id/chapters", controller.updateChapters);
	storylineRouter.patch("/:id/status", controller.updateStatus);

	storylineRouter.post("/generate", controller.generate);

	return storylineRouter;
};
