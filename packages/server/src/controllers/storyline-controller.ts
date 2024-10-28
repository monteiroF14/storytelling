import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "../logger";
import {
	type StorylineService,
	storylineService,
} from "../services/storyline-service";
import { z } from "zod";
import { StorylineSchema } from "@storytelling/types";
import axios from "axios";
import { env } from "bun";

// Define a schema to validate incoming data for creating a storyline
const CreateStorylineSchema = z.object({
	title: z.string().min(1, { message: "Title is required" }),
	totalSteps: z
		.number()
		.min(1, { message: "Total steps must be a positive number" }),
	userId: z.number().positive({ message: "User ID is required" }),
});

class StorylineController {
	readonly storylineService: StorylineService;

	constructor({ storylineService }: { storylineService: StorylineService }) {
		this.storylineService = storylineService;
	}

	// Handler to create a new storyline
	createStoryline = async (c: Context) => {
		try {
			const body = await c.req.parseBody();
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
			throw new HTTPException(500, {
				message: e instanceof Error ? e.message : "Internal Server Error",
			});
		}
	};

	// Handler to update an existing storyline
	updateStoryline = async (c: Context) => {
		try {
			const storylineId = c.req.param("id");
			if (!storylineId) {
				throw new HTTPException(400, { message: "Storyline ID is required" });
			}

			const body = await c.req.parseBody();
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

	// Handler to get a specific storyline
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

	// Handler to get all storylines of a user
	getStorylines = async (c: Context) => {
		try {
			const userId = c.req.query("userId");
			const limit = c.req.query("limit");
			const options = {
				userId: userId ? Number.parseInt(userId) : undefined,
				limit: limit ? Number.parseInt(limit) : undefined,
			};

			const storylines = await this.storylineService.getStorylines(options);

			if (!storylines) {
				return c.json({ storylines: [] });
			}

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
		const body = c.req.json();
		const parsedBody = StorylineSchema.parse(body);

		let prompt = "";

		const { title, steps } = parsedBody;
		const TOTAL_STORYLINE_STEPS = 8;
		const CHOICES = 3;

		if (steps.length === 0) {
			// Initial prompt for a new storyline
			prompt = `Create a storyline with the theme '${title}' that progresses through a total of ${TOTAL_STORYLINE_STEPS} steps.
			The story should follow a logical flow, with each step building on the previous one and driving the narrative towards a satisfying conclusion in the final step.

			For the first step:
			- Provide a compelling introduction that sets the stage for the story and introduces key elements, such as setting, characters, or conflict.
			- Generate ${CHOICES} distinct choices the player can make, each of which should have a meaningful impact on the direction of the story and offer different potential paths.

			The story should be coherent and engaging, with the first step setting up a dynamic progression that leads to a natural conclusion by the last step.

			Return only a string representation of the JSON object, without any code block markers or formatting like backticks or markdown.

			The string should include:
			- 'description' (a concise introduction)
			- 'choices' (an array of ${CHOICES} choices the player can make on which the choice is a string, multiple sentences or not).`;
		} else {
			// Continuation prompt for an existing storyline
			const lastStep = steps[steps.length - 1];
			const remainingSteps = TOTAL_STORYLINE_STEPS - steps.length;
			const storylinePath = steps.map((step) => step.description).join(". ");

			prompt = `Continue the storyline titled "${title}".
			The current storyline is as follows: ${storylinePath}. The player previously chose "${lastStep.choice}".

			Please generate the next step, ensuring that the narrative remains coherent and logically follows from the player's choice and the previous events.

			For the next step:
			- Provide a brief description of the situation or event that happens next in the story.
			- Generate ${CHOICES} choices the player can make. Each choice should meaningfully affect the direction of the story and lead towards its natural progression.

			Important:
			- If there are ${remainingSteps} steps remaining, ensure that the story builds tension and momentum as it approaches a logical conclusion.
			- If this is the final step, make sure the description and choices resolve the storyline with satisfying, conclusive options. The ending should either bring closure or suggest a dramatic conclusion based on the player’s choice.

			Return the output as a JSON object with two fields:
			- "description"
			- "choices" (an array of ${CHOICES} possible player actions on which the choice is a string, multiple sentences or not).

			**Important**: Do not include any additional text, formatting, or markdown backticks in the response. Only return the plain JSON object.`;
		}

		try {
			console.log("Model pulled successfully. Now generating response...");

			let completeResponse = "";

			const responseStream = await axios({
				method: "POST",
				url: `${env.LLAMA_API_URL}/api/generate`,
				data: {
					model: "llama3.2:3b",
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

			completeResponse = chunks.join("\n");

			if (!completeResponse) {
				return c.json(
					{ status: "error", message: "No response from AI model" },
					500,
				);
			}

			let generatedResponseText = completeResponse;
			if (generatedResponseText.includes("```")) {
				generatedResponseText = generatedResponseText
					.replace(/```json|```/g, "")
					.trim();
			}

			type GeneratedResponse = {
				description: string;
				choices: string[];
			};

			let generatedResponse: GeneratedResponse;
			try {
				generatedResponse = JSON.parse(
					generatedResponseText,
				) as GeneratedResponse;
			} catch (parseError) {
				throw new Error(
					`Failed to parse AI response: ${(parseError as Error).message}`,
				);
			}

			return c.json({
				description: generatedResponse.description,
				choices: generatedResponse.choices,
			});
		} catch (error) {
			console.error("Error calling LLaMA:", error);
			return c.json({ error: "Failed to get response from LLaMA" }, 500);
		}
	};
}

export const storylineController = new StorylineController({
	storylineService,
});
