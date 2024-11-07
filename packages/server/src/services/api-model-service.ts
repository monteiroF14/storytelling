import type { GenerateStorylineStep } from "@storytelling/types";
import axios from "axios";
import { env } from "bun";

type GeneratedResponse = {
	description: string;
	choices: string[];
};

export class ApiModelService {
	isModelAvailable = false;
	OLLAMA_MODEL = "llama3.2";

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
			prompt = `
Create a storyline with the theme '${title}' that progresses through ${TOTAL_STORYLINE_STEPS} steps.
The storyline should follow a logical flow, with each step building on the previous one and leading towards a satisfying conclusion at the final step.

**Provide output as a JSON object** for the first step in the following structure:

{
  "description": "A introduction to the storyline and initial setting or conflict.",
  "choices": [
    "First choice, phrased as a single or multi-sentence option.",
    "Second choice, phrased as a single or multi-sentence option.",
    ...
  ]
}

The description should be concise and deep, setting up key elements like the setting, characters, and conflict. The choices should each offer a distinct direction that impacts the story's progression and there should be only ${STORYLINE_CHOICES} choices.

**Do not include any text outside of the JSON object.**
`;
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

	async fetchResponse(prompt: string): Promise<ReadableStream> {
		const response = await fetch(`${env.LLAMA_API_URL}/api/generate`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: this.OLLAMA_MODEL,
				prompt,
				format: "json",
			}),
		});

		return new ReadableStream({
			async start(controller) {
				if (!response.body) {
					throw new Error("ReadableStream not supported!");
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder("utf-8");

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					controller.enqueue(decoder.decode(value, { stream: true }));
				}

				controller.close();
			},
		});
	}

	async fetchDummyResponse(): Promise<ReadableStream> {
		return new ReadableStream({
			start: (controller) => {
				controller.enqueue("Hello");
				setTimeout(() => {
					controller.enqueue("World");
					controller.close();
				}, 3000);
			},
		});
	}

	// async generateRecursiveSteps(
	// 	currentStepIndex: number,
	// 	currentStoryline: GenerateStorylineStep,
	// 	totalSteps: number,
	// ): Promise<GenerateStorylineStep> {
	// 	if (currentStepIndex >= totalSteps) {
	// 		return currentStoryline;
	// 	}

	// 	const prompt = await this.buildPrompt(currentStoryline);

	// 	try {
	// 		const { description, choices } = await this.fetchResponse(prompt);
	// 		console.log("fetched: ", description, choices);

	// 		currentStoryline.steps.push({ description, choice: "" });

	// 		for (const choice of choices) {
	// 			const nextStoryline = { ...currentStoryline };
	// 			nextStoryline.steps[currentStepIndex].choice = choice;

	// 			await this.generateRecursiveSteps(
	// 				currentStepIndex + 1,
	// 				nextStoryline,
	// 				totalSteps,
	// 			);
	// 		}

	// 		return currentStoryline;
	// 	} catch (e) {
	// 		// console.error("Error calling LLaMA:", e);
	// 		throw new Error("Failed to generate choices");
	// 	}
	// }
}

export const apiModelService = new ApiModelService();
