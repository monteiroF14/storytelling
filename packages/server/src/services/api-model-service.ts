import type { GenerateStorylineChapter } from "@storytelling/types";
import axios from "axios";
import { env } from "bun";

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
			prompt = `
Craft an immersive storyline centered around '${title}', unfolding over ${TOTAL_STORYLINE_CHAPTERS} intricately connected chapters. Each chapter should progressively deepen the story’s atmosphere, character arcs, and escalating conflict, guiding toward an impactful resolution in the final chapter.

Begin with the **first chapter**, providing an elaborate introduction in JSON format:

{
  "description": "A vivid portrayal of the initial setting and mood, revealing subtle but significant character traits and a looming conflict that shapes the plot.",
  "choices": [
    {
      "text": "A powerful choice description that hints at the choice's profound impact, affecting both the storyline and the protagonist’s mindset.",
      "synopsis": "An insightful summary that subtly foreshadows where this choice could lead."
    },
    ...
  ]
}

This first chapter should convey complexity and suspense, introducing readers to core themes and conflicts. Each choice should:
- Have a **"text" field** depicting the choice’s significance and its effect on both plot and character.
- Have a **"synopsis" field** summarizing the narrative direction of each choice.

**Return only JSON in the specified structure.**
`;
		} else {
			const lastChapter = chapters[chapters.length - 1];
			const remainingChapters = TOTAL_STORYLINE_CHAPTERS - chapters.length;
			const storylinePath = chapters.map((step) => step.description).join(". ");

			prompt = `
Continue building the storyline "${title}", connecting the next chapter to the established narrative:
"${storylinePath}." The last choice made was: "${lastChapter.choice.text}".

For this chapter, create an intricate scene with:
- A **description** capturing emotional tension, character nuance, and escalating conflicts that drive the storyline forward.
- ${STORYLINE_CHOICES} choice options:
  - **"text" field** with a vivid portrayal of the choice and its potential consequences.
  - **"synopsis" field** with a succinct preview hinting at the possible path forward.

Consider:
- If there are ${remainingChapters} chapters left, weave in subtle foreshadowing and complex character dilemmas to heighten the narrative.
- For the **final chapter**, resolve themes and character arcs in a way that reflects the storyline’s overall journey, giving each choice meaningful closure.

Return strictly in JSON format:

{
  "description": "A detailed, evocative scene description.",
  "choices": [
    {
      "text": "A vivid choice description with emotional and narrative weight.",
      "synopsis": "A concise direction preview."
    },
    ...
  ]
}
`;
		}

		return prompt;
	}

	async fetchResponse<T>(prompt: string, retries = 3) {
		try {
			const response = await axios.post<T>(
				`${env.LLAMA_API_URL}/api/generate`,
				{
					model: this.OLLAMA_MODEL,
					prompt,
					format: "json",
					stream: false,
				},
			);
			return response;
		} catch (e) {
			if (retries > 0) {
				console.log("got error and gonna retry", e);
				await new Promise((res) => setTimeout(res, 1000));
				return this.fetchResponse(prompt, retries - 1);
			}

			throw new Error(
				`Failed to fetch response after ${3 - retries} retries: ${e.message}`,
			);
		}
	}
}

export const apiModelService = new ApiModelService();
