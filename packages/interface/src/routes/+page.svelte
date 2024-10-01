<script lang="ts">
	import { browser } from "$app/environment";
	import type { TextOutput } from "window.ai";
	import {
		aiResponse,
		aiResponseLoading,
		currentStoryline,
		storylines,
		storylineTitleInput,
	} from "../stores";
	import { get, writable } from "svelte/store";

	import { Progressbar } from "flowbite-svelte";
	import { sineOut } from "svelte/easing";

	let progress = writable(0);
	let intervalId: NodeJS.Timer;

	const CHOICES = 3;
	const TOTAL_STEPS = 8;

	$: storyline = $currentStoryline;

	$: if (storyline && storyline.steps.length < TOTAL_STEPS) {
		aiResponseLoading.set(true);
		progress.set(5);

		// Increment progress max 80%
		intervalId = setInterval(() => {
			progress.update((n) => (n < 80 ? n + 10 : n));
		}, 750);

		generateNextChoices().then(() => {
			aiResponseLoading.set(false);
			progress.set(100);
		});
	}

	$: if (storyline && storyline.steps.length === TOTAL_STEPS) {
		currentStoryline.set({
			...$currentStoryline,
			status: "completed",
		});
	}

	async function generateNextChoices() {
		let prompt = "";

		if (storyline.steps.length === 0) {
			prompt = `Create a storyline with the theme '${storyline.title}' that progresses through a total of ${TOTAL_STEPS} steps. 
      The story should follow a logical flow, with each step building on the previous one and driving the narrative towards a satisfying conclusion in the final step.

      For the first step:
      - Provide a compelling introduction that sets the stage for the story and introduces key elements, such as setting, characters, or conflict.
      - Generate ${CHOICES} distinct choices the player can make, each of which should have a meaningful impact on the direction of the story and offer different potential paths.

      The story should be coherent and engaging, with the first step setting up a dynamic progression that leads to a natural conclusion by the last step.

      Return the output as a JSON object with two fields: 
      - 'description' (the initial part of the story)
      - 'choices' (an array of ${CHOICES} choices the player can make on which the choice is a string, multiple sentences or not).

      Please return only plain JSON, with no additional text or formatting.`;
		} else {
			const lastStep = storyline.steps[storyline.steps.length - 1];
			const remainingSteps = TOTAL_STEPS - storyline.steps.length;

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
      - "description" (the next part of the story)
      - "choices" (an array of ${CHOICES} possible player actions on which the choice is a string, multiple sentences or not). 

      Please only return plain JSON with no additional text or formatting.`;
		}

		try {
			const response = (await window.ai.generateText({
				prompt,
			})) as TextOutput[];

			if (!response || !Array.isArray(response) || response.length === 0 || !response[0]?.text) {
				throw new Error("Invalid response from AI");
			}

			const generatedResponse = JSON.parse(response[0].text);
			const { description, choices } = generatedResponse;

			aiResponse.set({
				description: description.trim(),
				choices: choices.map((choice: string) => choice.trim()),
			});
		} catch (err) {
			console.log("err: ", err);
			aiResponse.set(undefined);
		} finally {
			clearInterval(intervalId);
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
			updated: Date.now().toString(),
		};

		currentStoryline.set(updatedStoryline);
		storylines.update((list) =>
			list.map((story) => (story.id === updatedStoryline.id ? updatedStoryline : story))
		);
	}

	async function handleCreateStoryline() {
		const newStory = {
			id: 0,
			status: "ongoing",
			steps: [],
			title: get(storylineTitleInput),
			totalSteps: TOTAL_STEPS,
			created: Date.now().toString(),
			updated: Date.now().toString(),
		};

		currentStoryline.set(newStory);
		storylines.update((list) => (list ? [...list, newStory] : [newStory]));
	}

	if (browser) {
		import("window.ai");
	}
</script>

<main class="p-4">
	<div class="py-4">
		<label for="username">Username: </label>
		<input type="text" name="username" id="username" class="border-2 border-black py-1 px-2" />
	</div>

	{#if $currentStoryline}
		{#if $currentStoryline.status === "ongoing"}
			<h2 class="text-4xl font-bold">{$currentStoryline.title}</h2>

			<section>
				<h3 class="pt-1 text-xl text-zinc-600">Follow storyline</h3>

				{#each $currentStoryline.steps as storyStep}
					<p class="py-2">{storyStep.description}</p>
					<p class="py-2">You chose: <span class="font-semibold">{storyStep.choice}</span></p>
				{/each}

				{#if $aiResponseLoading}
					<Progressbar
						progress={$progress}
						animate
						precision={1}
						labelInside
						tweenDuration={2000}
						easing={sineOut}
						size="h-6"
						labelInsideClass="bg-orange-600 text-orange-100 text-base font-medium text-center p-1 leading-none rounded-full"
						class="my-4"
					/>
				{:else if $aiResponse}
					<div class="space-y-2">
						<p class="py-2 text-zinc-800">{$aiResponse.description}</p>

						<h3 class="text-2xl font-semibold">Make a choice:</h3>

						<div class="grid grid-cols-3 gap-4">
							{#each $aiResponse.choices as choice}
								<button
									on:click={() => handleUserChoice(choice)}
									class="p-4 rounded-xl bg-orange-500 text-white hover:bg-orange-600 text-justify flex items-start"
									>{choice}</button
								>
							{/each}
						</div>
					</div>
				{:else}
					<p>No text generated.</p>
				{/if}
			</section>
		{:else}
			<h2 class="text-4xl font-bold">{$currentStoryline.title}</h2>

			<section>
				<h3 class="pt-1 text-xl text-zinc-600">Full storyline:</h3>

				{#each $currentStoryline.steps as storyStep}
					<p class="py-2">{storyStep.description}</p>
					<p class="py-2">You chose: <span class="font-semibold">{storyStep.choice}</span></p>
				{/each}

				<form on:submit|preventDefault={handleCreateStoryline} class="flex flex-col gap-8 py-8">
					<input
						type="text"
						class="text-4xl font-bold grow"
						placeholder="Storyline title.."
						bind:value={$storylineTitleInput}
					/>
					<button class="border-2 border-black px-4 py-2 uppercase font-semibold mx-auto"
						>Create new storyline</button
					>
				</form>
			</section>
		{/if}
	{:else}
		<form on:submit|preventDefault={handleCreateStoryline} class="flex flex-col gap-8 py-8">
			<input
				type="text"
				class="text-4xl font-bold grow"
				placeholder="Storyline title.."
				bind:value={$storylineTitleInput}
			/>
			<button class="border-2 border-black px-4 py-2 uppercase font-semibold mx-auto"
				>Create new storyline</button
			>
		</form>
	{/if}
</main>
