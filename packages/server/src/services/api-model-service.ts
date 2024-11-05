import type { GenerateStorylineStep } from "@storytelling/types";
import axios from "axios";
import { env } from "bun";
import { HTTPException } from "hono/http-exception";

type GeneratedResponse = {
	description: string;
	choices: string[];
};

export class ApiModelService {
	isModelAvailable = false;
	OLLAMA_MODEL = "tinyllama";

	async initializeModel() {
		try {
			await axios.post(`${env.LLAMA_API_URL}/api/pull`, {
				name: this.OLLAMA_MODEL,
			});
			this.isModelAvailable = true;
			console.log(`\n${this.OLLAMA_MODEL} downloaded!\n`);
		} catch (e) {
			console.error("Model download failed:", e);
			this.isModelAvailable = false;
		}
	}

	buildPrompt({ title, steps }: GenerateStorylineStep): string {
		let prompt = "";

		const TOTAL_STORYLINE_STEPS = 8;
		const STORYLINE_CHOICES = 3;

		if (steps.length === 0) {
			prompt = `Create a storyline with the theme '${title}' that progresses through a total of ${TOTAL_STORYLINE_STEPS} steps.
			The story should follow a logical flow, with each step building on the previous one and driving the narrative towards a satisfying conclusion in the final step.

			For the first step:
			- Provide a compelling introduction that sets the stage for the story and introduces key elements, such as setting, characters, or conflict.
			- Generate ${STORYLINE_CHOICES} distinct choices the player can make, each of which should have a meaningful impact on the direction of the story and offer different potential paths.

			The story should be coherent and engaging, with the first step setting up a dynamic progression that leads to a natural conclusion by the last step.

			Return only a string representation of the JSON object, without any code block markers or formatting like backticks or markdown.

			The string should include:
			- 'description' (a concise introduction)
			- 'choices' (an array of ${STORYLINE_CHOICES} choices the player can make on which the choice is a string, multiple sentences or not).`;
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
			- Generate ${STORYLINE_CHOICES} choices the player can make. Each choice should meaningfully affect the direction of the story and lead towards its natural progression.

			Important:
			- If there are ${remainingSteps} steps remaining, ensure that the story builds tension and momentum as it approaches a logical conclusion.
			- If this is the final step, make sure the description and choices resolve the storyline with satisfying, conclusive options. The ending should either bring closure or suggest a dramatic conclusion based on the player’s choice.

			Return the output as a JSON object with two fields:
			- "description"
			- "choices" (an array of ${STORYLINE_CHOICES} possible player actions on which the choice is a string, multiple sentences or not).

			**Important**: Do not include any additional text, formatting, or markdown backticks in the response. Only return the plain JSON object.`;
		}

		return prompt;
	}

	pretifyResponse(generatedText: string) {
		let generatedResponseText = generatedText;

		if (generatedResponseText.includes("```")) {
			generatedResponseText = generatedResponseText
				.replace(/```json|```/g, "")
				.trim();
		}

		try {
			return JSON.parse(generatedResponseText) as GeneratedResponse;
		} catch (parseError) {
			throw new Error(
				`Failed to parse AI response: ${(parseError as Error).message}`,
			);
		}
	}

	async fetchResponse(prompt: string): Promise<GeneratedResponse> {
		const responseStream = await axios({
			method: "POST",
			url: `${env.LLAMA_API_URL}/api/generate`,
			data: {
				model: this.OLLAMA_MODEL,
				prompt,
			},
			responseType: "stream",
		});

		// console.log("response stream:  ", responseStream);

		const chunks: Buffer[] = [];
		await new Promise((resolve, reject) => {
			responseStream.data.on("data", (chunk: Buffer) => chunks.push(chunk));
			responseStream.data.on("end", (chunk) => resolve(chunk));
			responseStream.data.on("error", reject);
		});

		const completeResponse = Buffer.concat(chunks).toString("utf8");
		console.log("complete: ", completeResponse);
		if (!completeResponse) {
			throw new HTTPException(404, {
				message: "No response from AI model",
			});
		}

		const prettyResponse = this.pretifyResponse(completeResponse);
		console.log("res: ", prettyResponse);

		return prettyResponse;
	}

	async generateRecursiveSteps(
		currentStepIndex: number,
		currentStoryline: GenerateStorylineStep,
		totalSteps: number,
	): Promise<GenerateStorylineStep> {
		if (currentStepIndex >= totalSteps) {
			return currentStoryline;
		}

		const prompt = await this.buildPrompt(currentStoryline);

		try {
			const { description, choices } = await this.fetchResponse(prompt);
			console.log("fetched: ", description, choices);

			currentStoryline.steps.push({ description, choice: "" });

			for (const choice of choices) {
				const nextStoryline = { ...currentStoryline };
				nextStoryline.steps[currentStepIndex].choice = choice;

				await this.generateRecursiveSteps(
					currentStepIndex + 1,
					nextStoryline,
					totalSteps,
				);
			}

			return currentStoryline;
		} catch (e) {
			// console.error("Error calling LLaMA:", e);
			throw new Error("Failed to generate choices");
		}
	}
}

export const apiModelService = new ApiModelService();
