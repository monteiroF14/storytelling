import { CreateStorylineSchema, StorylineSchema } from "@storytelling/types";
import axios from "axios";
import { env } from "bun";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { logger } from "../logger";
import {
	type StorylineService,
	storylineService,
} from "../services/storyline-service";
import {
	apiModelService,
	type ApiModelService,
} from "../services/api-model-service";

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

	updateStoryline = async (c: Context) => {
		try {
			const storylineId = c.req.param("id");
			if (!storylineId) {
				throw new HTTPException(400, { message: "Storyline ID is required" });
			}

			const body = await c.req.json();
			const parsedBody = StorylineSchema.parse(body);

			const updatedStoryline = await this.storylineService.update({
				storyline: {
					...parsedBody,
					id: Number.parseInt(storylineId),
				},
			});

			if (!updatedStoryline) {
				throw new HTTPException(404, { message: "Storyline not found" });
			}

			return c.json({ storyline: updatedStoryline });
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.updateStoryline.name} -> Error updating storyline: ${e}`,
				type: "ERROR",
			});
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
			const options = {
				userId: userId ? Number.parseInt(userId) : undefined,
				limit: limit ? Number.parseInt(limit) : undefined,
				offset: offset ? Number.parseInt(offset) : undefined,
			};

			const storylines = await this.storylineService.getStorylines(options);

			return c.json({ storylines });
		} catch (e) {
			logger({
				message: `${this.constructor.name} > ${this.getStorylines.name} -> Error fetching user storylines: ${e}`,
				type: "ERROR",
			});
			throw new HTTPException(500, {
				message: e instanceof Error ? e.message : "Internal Server Error",
			});
		}
	};

	generateChoices = async (c: Context) => {
		if (!this.apiModelService.isModelAvailable) {
			c.status(503);
			return c.json({ message: "Ollama Model unavailable" });
		}

		const body = await c.req.json();
		const parsedBody = StorylineSchema.parse(body);

		const prompt = this.apiModelService.buildPrompt(parsedBody);

		try {
			const responseStream = await axios({
				method: "POST",
				url: `${env.LLAMA_API_URL}/api/generate`,
				data: {
					model: apiModelService.OLLAMA_MODEL,
					prompt,
				},
				responseType: "stream",
			});

			const chunks: Buffer[] = [];

			await new Promise((resolve, reject) => {
				responseStream.data.on("data", (chunk: Buffer) => chunks.push(chunk));
				responseStream.data.on("end", () => {
					const response = Buffer.concat(
						chunks as unknown as Uint8Array[],
					).toString("utf8");
					resolve(response);
				});
				responseStream.data.on("error", reject);
			});

			const completeResponse = chunks.join("\n");

			if (!completeResponse) {
				throw new HTTPException(404, {
					message: "No response from AI model",
				});
			}

			const response = this.apiModelService.pretifyResponse(completeResponse);

			return c.json(response);
		} catch (error) {
			console.error("Error calling LLaMA:", error);
			return c.json({ error: "Failed to get response from LLaMA" }, 500);
		}
	};
}

export const storylineController = new StorylineController(
	storylineService,
	apiModelService,
);
