import {
	CreateStorylineSchema,
	type GenerateStorylineChapter,
	StorylineSchema,
	UpdateChaptersSchema,
	UpdateStatusSchema,
	UpdateVisibilitySchema,
} from "@storytelling/types";
import { ValidationError } from "app/error";
import { logger } from "app/logger";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import {
	type ApiModelService,
	apiModelService,
} from "../services/api-model-service";
import {
	type StorylineService,
	storylineService,
} from "../services/storyline-service";

export class StorylineController {
	constructor(
		private storylineService: StorylineService,
		private apiModelService: ApiModelService,
	) {}

	createStoryline = async (c: Context) => {
		try {
			const body = await c.req.json();
			const validatedData = CreateStorylineSchema.parse(body);

			const newStoryline = await this.storylineService.create(validatedData);
			if (!newStoryline) {
				throw new HTTPException(400, { message: "Error creating storyline" });
			}

			c.status(201);
			return c.json({ storyline: newStoryline });
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.createStoryline.name} -> Error creating storyline: ${e}`,
				type: "ERROR",
			});

			if (e instanceof z.ZodError) {
				throw new HTTPException(400, {
					message: e.message,
				});
			}

			throw new HTTPException(500, {
				message: e instanceof Error ? e.message : "Internal Server Error",
			});
		}
	};

	updateVisibility = async (c: Context) => {
		try {
			const { id } = c.req.param();
			const parsedId = Number.parseInt(id);

			const body = await c.req.json();
			const validatedData = UpdateVisibilitySchema.parse(body);

			const updatedStoryline = await this.storylineService.updateVisibility({
				id: parsedId,
				visibility: validatedData.visibility,
			});

			if (!updatedStoryline) {
				throw new HTTPException(422, {
					message: "Error updating visibility",
				});
			}

			c.status(200);
			return c.json({ storyline: updatedStoryline });
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.updateVisibility.name} -> Error updating visibility: ${e}`,
				type: "ERROR",
			});

			if (e instanceof z.ZodError) {
				throw new HTTPException(400, { message: e.message });
			}

			throw new HTTPException(500, {
				message: e instanceof Error ? e.message : "Internal Server Error",
			});
		}
	};

	updateStatus = async (c: Context) => {
		try {
			const { id } = c.req.param();
			const parsedId = Number.parseInt(id);

			const body = await c.req.json();
			const validatedData = UpdateStatusSchema.parse(body);

			const updatedStoryline = await this.storylineService.updateStatus({
				id: parsedId,
				status: validatedData.status,
			});

			if (!updatedStoryline) {
				throw new HTTPException(422, { message: "Error updating status" });
			}

			c.status(200);
			return c.json({ storyline: updatedStoryline });
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.updateStatus.name} -> Error updating steps: ${e}`,
				type: "ERROR",
			});

			if (e instanceof z.ZodError) {
				throw new HTTPException(400, { message: e.message });
			}

			throw new HTTPException(500, {
				message: e instanceof Error ? e.message : "Internal Server Error",
			});
		}
	};

	updateChapters = async (c: Context) => {
		try {
			const { id } = c.req.param();
			const parsedId = Number.parseInt(id);

			const body = await c.req.json();

			const { chapters } = UpdateChaptersSchema.parse(body);

			const updatedStoryline = await this.storylineService.updateChapters({
				id: parsedId,
				chapters,
			});

			if (!updatedStoryline) {
				throw new HTTPException(422, { message: "Error updating steps" });
			}

			c.status(200);
			return c.json({ storyline: updatedStoryline });
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.updateChapters.name} -> Error updating steps: ${e}`,
				type: "ERROR",
			});

			if (e instanceof z.ZodError) {
				throw new HTTPException(400, { message: e.message });
			}

			throw new HTTPException(500, {
				message: e instanceof Error ? e.message : "Internal Server Error",
			});
		}
	};

	getStoryline = async (c: Context) => {
		try {
			const storylineId = c.req.param("storylineId");
			if (!storylineId) {
				throw new HTTPException(400, { message: "Storyline ID is required" });
			}

			const storyline = await this.storylineService.read(
				Number.parseInt(storylineId),
			);

			if (!storyline) {
				throw new HTTPException(404, { message: "Storyline not found" });
			}

			return c.json({ storyline });
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.getStoryline.name} -> Error fetching storyline: ${e}`,
				type: "ERROR",
			});
			throw new HTTPException(500, {
				message: e instanceof Error ? e.message : "Internal Server Error",
			});
		}
	};

	getStorylines = async (c: Context) => {
		try {
			const userId = c.req.query("userId");
			const limit = c.req.query("limit");
			const offset = c.req.query("offset");
			const orderBy = c.req.query("orderBy");
			const order = c.req.query("order");

			const options = {
				userId: userId ? Number.parseInt(userId) : undefined,
				limit: limit ? Number.parseInt(limit) : undefined,
				offset: offset ? Number.parseInt(offset) : undefined,
				orderBy,
				order: order === "DESC" ? "DESC" : "ASC",
			};

			const storylines = await this.storylineService.getStorylines(options);

			return c.json({ storylines });
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.getStorylines.name} -> Error fetching user storylines: ${e}`,
				type: "ERROR",
			});

			if (e instanceof ValidationError) {
				throw new HTTPException(400, {
					message: e.message,
				});
			}

			throw new HTTPException(500, {
				message: e instanceof Error ? e.message : "Internal Server Error",
			});
		}
	};

	generate = async (c: Context) => {
		if (!this.apiModelService.isModelAvailable) {
			c.status(503);
			return c.json({ message: "Ollama Model unavailable" });
		}

		try {
			const body = await c.req.json();
			const parsedBody = StorylineSchema.parse(body.storyline);

			if (parsedBody.totalSteps === null) {
				c.status(400);
				return c.json({
					message: "Bad request, missing totalSteps cannot be null",
				});
			}

			const currentStoryline: GenerateStorylineChapter = {
				title: parsedBody.title,
				chapters: parsedBody.chapters,
			};

			const prompt = this.apiModelService.buildPrompt(currentStoryline);
			const { data, status } = await this.apiModelService.fetchResponse<{
				model: string;
				created_at: Date;
				response: string;
				done: boolean;
				done_reason: string;
				context: number[];
			}>(prompt);

			if (status !== 200) {
				throw new Error("bad request, res not 200");
			}

			const parsedResponse = JSON.parse(data.response);

			return c.json(parsedResponse);
		} catch (error) {
			logger({
				message: `Error calling LLaMA: ${error}`,
				type: "ERROR",
			});
			return c.json({ error: "Failed to get response from LLaMA" }, 503);
		}
	};
}

export const storylineController = new StorylineController(
	storylineService,
	apiModelService,
);
