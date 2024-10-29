import { Hono } from "hono";
import type { StorylineController } from "../controllers/storyline-controller";

export const createStorylineRouter = (controller: StorylineController) => {
	const storylineRouter = new Hono();

	storylineRouter.get("/", controller.getStorylines);
	storylineRouter.get("/:storylineId", controller.getStoryline);
	storylineRouter.post("/", controller.createStoryline);
	storylineRouter.put("/:id", controller.updateStoryline);

	// TODO: prefetch this route on storyline load
	storylineRouter.post("/generate", controller.generateChoices);

	return storylineRouter;
};
