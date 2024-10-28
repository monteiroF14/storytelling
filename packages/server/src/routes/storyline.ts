import { Hono } from "hono";
import { storylineController } from "../controllers/storyline-controller";

export const storyline = new Hono();

storyline.get("/", storylineController.getStorylines);
storyline.get("/:storylineId", storylineController.getStoryline);
storyline.post("/", storylineController.createStoryline);
storyline.put("/:id", storylineController.updateStoryline);

storyline.post("/generate", storylineController.generateChoices);
