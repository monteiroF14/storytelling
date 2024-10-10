<script lang="ts">
	import {
		CHOICES,
		MAX_AI_RETRIES,
		MAX_DESCRIPTION_LENGTH,
		TOTAL_STORYLINE_STEPS,
	} from "$lib/constants";
	import {
		aiGeneratingProgress,
		aiResponse,
		aiResponseLoading,
		currentStoryline,
		storylines,
		storylineTitleInput,
	} from "$lib/stores";
	import { handleCreateStoryline } from "$lib/util";
	import { WebSocketClient } from "$lib/web-socket-client";
	import type { Storyline } from "@storytelling/types";
	import { Progressbar } from "flowbite-svelte";
	import { sineOut } from "svelte/easing";
	import type { TextOutput } from "window.ai";
	import AbandonStorylineButton from "./AbandonStorylineButton.svelte";
	import CongratulationsModal from "./CongratulationsModal.svelte";

	let wsClient: WebSocketClient;
	let storyline: Storyline;

	let aiRetryCount = 0;

	let defaultModal = false;

	$: storyline = $currentStoryline;

	$: if (
		storyline &&
		$currentStoryline.status === "ongoing" &&
		storyline.steps.length < TOTAL_STORYLINE_STEPS
	) {
		let intervalId: NodeJS.Timer;
		const MAX_PROGRESS = 80;

		aiResponseLoading.set(true);
		aiGeneratingProgress.set(15);

		intervalId = setInterval(() => {
			aiGeneratingProgress.update((n) => (n < MAX_PROGRESS ? n + 10 : n));
		}, 750);

		fetchNextStoryStep().then(() => {
			aiResponseLoading.set(false);
			aiGeneratingProgress.set(100);
			clearInterval(intervalId);
		});
	}

	$: if (storyline && storyline.steps.length === TOTAL_STORYLINE_STEPS) {
		defaultModal = true;
	}

	async function fetchNextStoryStep() {
		let prompt = "";

		if (aiRetryCount >= MAX_AI_RETRIES) {
			// Reset retry count and stop loading after max retries
			aiResponseLoading.set(false);
			return;
		}

		++aiRetryCount;

		if (storyline.steps.length === 0) {
			prompt = `Create a storyline with the theme '${storyline.title}' that progresses through a total of ${TOTAL_STORYLINE_STEPS} steps.
			The story should follow a logical flow, with each step building on the previous one and driving the narrative towards a satisfying conclusion in the final step.

			For the first step:
			- Provide a compelling introduction that sets the stage for the story and introduces key elements, such as setting, characters, or conflict.
			- Generate ${CHOICES} distinct choices the player can make, each of which should have a meaningful impact on the direction of the story and offer different potential paths.

			The story should be coherent and engaging, with the first step setting up a dynamic progression that leads to a natural conclusion by the last step.

	    Return only a string representation of the JSON object, without any code block markers or formatting like backticks or markdown.

	    The string should include:
	    - 'description' (a concise introduction, no more than ${MAX_DESCRIPTION_LENGTH} characters)
	    - 'choices' (an array of ${CHOICES} choices the player can make on which the choice is a string, multiple sentences or not).`;
		} else {
			const lastStep = storyline.steps[storyline.steps.length - 1];
			const remainingSteps = TOTAL_STORYLINE_STEPS - storyline.steps.length;

			const storylinePath = storyline.steps.map((step) => step.description).join(". ");

			prompt = `Continue the storyline titled "${storyline.title}".
	    The current storyline is as follows: ${storylinePath}. The player previously chose "${lastStep.choice}".

	    Please generate the next step, ensuring that the narrative remains coherent and logically follows from the player's choice and the previous events.

	    For the next step:
	    - Provide a brief description of the situation or event that happens next in the story.
	    - Generate ${CHOICES} choices the player can make. Each choice should meaningfully affect the direction of the story and lead towards its natural progression.

	    Important:
	    - If there are ${remainingSteps} steps remaining, ensure that the story builds tension and momentum as it approaches a logical conclusion.
	    - If this is the final step, make sure the description and choices resolve the storyline with satisfying, conclusive options. The ending should either bring closure or suggest a dramatic conclusion based on the player’s choice.

	    Return the output as a JSON object with two fields:
	    - "description" (the next part of the story, concise, no more than ${MAX_DESCRIPTION_LENGTH} characters)
	    - "choices" (an array of ${CHOICES} possible player actions on which the choice is a string, multiple sentences or not).

	    **Important**: Do not include any additional text, formatting, or markdown backticks in the response. Only return the plain JSON object.`;
		}

		try {
			aiResponseLoading.set(true);

			const response = (await window.ai.generateText({
				prompt,
				options: {
					numOutputs: 2,
					maxTokens: 500,
				},
			})) as TextOutput[];

			if (!response || !Array.isArray(response) || response.length === 0 || !response[0]?.text) {
				throw new Error("Invalid response from AI");
			}

			let generatedResponseText = response[0].text;

			// Check if the response contains backticks and clean them if present
			if (generatedResponseText.includes("```")) {
				console.warn("Backticks detected, cleaning response...");
				generatedResponseText = generatedResponseText.replace(/```json|```/g, "").trim();
			}

			let generatedResponse;
			try {
				generatedResponse = JSON.parse(generatedResponseText);
			} catch (parseError) {
				throw new Error("Failed to parse AI response: " + (parseError as unknown as Error).message);
			}
			let { description, choices } = generatedResponse;

			if (description.length > MAX_DESCRIPTION_LENGTH) {
				description = description.slice(0, MAX_DESCRIPTION_LENGTH) + "...";
			}

			aiResponse.set({
				description: description.trim(),
				choices: choices.map((choice: string) => choice.trim()),
			});

			aiRetryCount = 0;
			aiResponseLoading.set(false);
		} catch (err) {
			console.error("Error fetching next story step:", err);

			// Retry if there are retries left, else stop loading and show "No text generated"
			if (aiRetryCount < MAX_AI_RETRIES) {
				await fetchNextStoryStep(); // Retry the AI call
			} else {
				// Exhausted retries, stop loading and clear response
				aiResponse.set(undefined);
				aiResponseLoading.set(false);
			}
		}
	}

	async function handleUserChoice(choice: string) {
		const updatedStoryline = {
			...$currentStoryline,
			steps: [
				...$currentStoryline.steps,
				{
					choice,
					description: $aiResponse?.description || "",
				},
			],
			updated: Date.now(),
		};

		currentStoryline.set(updatedStoryline);
		storylines.update((list) =>
			list.map((story) => (story.id === updatedStoryline.id ? updatedStoryline : story))
		);
	}

	async function handleAbandonStoryline() {
		wsClient.sendMessage(
			JSON.stringify({
				userId: 1,
				storyline: {
					...$currentStoryline,
					status: "abandoned",
				},
			})
		);
		storylineTitleInput.set("");
	}

	const handleCreateStorylineWrapper = () => handleCreateStoryline(wsClient);
</script>

<header class="w-full flex gap-2 items-center">
	<h2 class="text-4xl font-bold text-red-600">{$currentStoryline.title}</h2>
	{#if $currentStoryline.status === "ongoing"}
		<AbandonStorylineButton {handleAbandonStoryline} />
		<div class="ml-auto font-semibold flex items-start text-zinc-950">
			<p class="text-2xl text-zinc-600">
				{$currentStoryline.steps.length}/
			</p>
			<span class="text-4xl">{TOTAL_STORYLINE_STEPS}</span>
		</div>
	{/if}
</header>

<section class="space-y-8">
	<!-- Case 1: Storyline is ongoing -->
	{#if $currentStoryline.status === "ongoing"}
		<!-- AI Progress and Choices -->
		{#if $aiResponseLoading}
			<Progressbar
				progress={$aiGeneratingProgress}
				animate
				precision={2}
				labelInside
				tweenDuration={2000}
				easing={sineOut}
				size="h-6"
				labelInsideClass="bg-red-600 text-red-100 text-base font-medium text-center p-1 leading-none rounded-full"
				class="my-12"
			/>
		{:else if $aiResponse}
			<div class="flex flex-col gap-4 my-8">
				<p class="py-2 text-zinc-800 text-lg">{$aiResponse.description}</p>

				<h3 class="text-2xl font-semibold">Make a choice:</h3>

				<div class="grid grid-cols-3 gap-4">
					{#each $aiResponse.choices as choice}
						<button
							on:click={() => handleUserChoice(choice)}
							class="p-4 rounded-xl bg-red-500 text-white hover:bg-red-600 text-justify flex items-start"
						>
							{choice}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<p>No text generated.</p>
		{/if}

		<!-- Show storyline up to the current step -->
		<div class="pb-8">
			{#each $currentStoryline.steps.slice().reverse() as storyStep}
				<p class="py-2">{storyStep.description}</p>
				<p class="py-2">
					You previously chose: <span class="font-semibold">{storyStep.choice}</span>
				</p>
				<hr class="my-4 border-1 border-zinc-200 last-of-type:hidden" />
			{/each}
		</div>

		<!-- Case 2: Storyline is not ongoing but has steps -->
	{:else if $currentStoryline.steps.length > 0}
		<h3 class="pt-1 text-xl text-zinc-600 font-semibold">Follow storyline:</h3>
		<div class="pb-8">
			{#each $currentStoryline.steps.slice().reverse() as storyStep}
				<p class="py-2">{storyStep.description}</p>
				<p class="py-2">
					You previously chose: <span class="font-semibold">{storyStep.choice}</span>
				</p>
				<hr class="my-4 border-1 border-zinc-200 last-of-type:hidden" />
			{/each}
		</div>

		<!-- Case 3: No steps found -->
	{:else}
		<h4 class="pt-1 text-lg text-zinc-500 font-semibold">No steps found!</h4>
	{/if}

	<!-- Special case: Storyline is ongoing and all steps are complete -->
	{#if $currentStoryline.status === "ongoing" && $currentStoryline.steps.length === TOTAL_STORYLINE_STEPS}
		<CongratulationsModal bind:defaultModal handleCreateStoryline={handleCreateStorylineWrapper} />
	{/if}
</section>
