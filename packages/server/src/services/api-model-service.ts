import type { GenerateStorylineChapter } from "@storytelling/types";
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

	buildPrompt({ title, chapters }: GenerateStorylineChapter): string {
		let prompt = "";

		const TOTAL_STORYLINE_CHAPTERS = 8;
		const STORYLINE_CHOICES = 3;

		if (chapters.length === 0) {
			// Initial prompt for the first chapter
			prompt = `
Create an immersive storyline with the central theme of '${title}', designed to unfold over ${TOTAL_STORYLINE_CHAPTERS} interconnected chapters.
Each chapter should be meticulously crafted, developing the setting, characters, and core conflict progressively, leading to a climax and a fulfilling resolution in the final chapter.

Begin by generating the **first chapter** as a JSON object in the following format:

{
  "description": "An elaborate introduction to the storyline, capturing the ambiance, characters, and underlying conflict.",
  "choices": [
    {
      "text": "A vivid description of the first choice, explaining its potential impact and where it might lead the storyline.",
      "synopsis": "A succinct but insightful summary of this choice’s direction."
    },
    {
      "text": "A richly detailed description of the second choice.",
      "synopsis": "A concise yet informative summary of this choice’s implications."
    },
    ...
  ]
}

Each chapter should convey depth, complexity, and suspense, drawing the player into the evolving plot. In this first chapter, focus on establishing the core storyline elements, while making each choice distinct and meaningful. For each choice, include:
- A **"text" field** with a detailed explanation of the choice's impact on the storyline, highlighting its potential consequences.
- A **"synopsis" field** summarizing the direction in which the choice might lead.

**Do not include any text outside of the JSON object. Only return the structured JSON as specified.**
`;
		} else {
			// Continuation prompt for an existing storyline
			const lastChapter = chapters[chapters.length - 1];
			const remainingChapters = TOTAL_STORYLINE_CHAPTERS - chapters.length;
			const storylinePath = chapters.map((step) => step.description).join(". ");

			prompt = `
Continue the development of the storyline titled "${title}", seamlessly connecting the next chapter to the established narrative:
"${storylinePath}." The last choice made was: "${lastChapter.choice.text}".

For this upcoming chapter, delve into the consequences of recent choices and explore how they shape the unfolding events, building on previous conflicts, relationships, and the storyline's overall trajectory.

Generate the **next chapter** in the format below, following these detailed instructions:
- Provide an **intricate description** of the scene or critical event occurring at this stage, with complex layers of emotion, action, or suspense as appropriate.
- Design ${STORYLINE_CHOICES} choice options, each offering a distinct path forward with:
  - A **"text" field** describing the choice in detail, conveying the gravity and potential consequences of selecting it.
  - A **"synopsis" field** with a concise, insightful preview of where this choice might lead, guiding the player’s expectations.

Take into account:
- If there are ${remainingChapters} chapters remaining, enhance the storyline with escalating tension, subtle foreshadowing, or complex narrative twists as the story builds toward its climax.
- If this is the **final chapter**, resolve the storyline in a powerful, satisfying way. The final choices should present meaningful outcomes that bring closure to the storyline’s central themes, character arcs, or conflicts.

Return the result strictly in this JSON structure:

{
  "description": "A detailed, engaging description of the current situation or event in the storyline.",
  "choices": [
    {
      "text": "A vivid, well-detailed choice description that highlights its potential impact on the storyline.",
      "synopsis": "A brief but insightful summary of this choice's direction."
    },
    {
      "text": "Another richly detailed choice description.",
      "synopsis": "Another brief but insightful summary for this choice."
    },
    ...
  ]
}

**Important**: Exclude any additional text, formatting, or markdown symbols outside of the JSON object. Only return the pure JSON object.`;
		}

		return prompt;
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
}

export const apiModelService = new ApiModelService();
