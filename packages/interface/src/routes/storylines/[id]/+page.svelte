<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
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
	} from "$lib/stores";
	import { formatTimeAgo } from "$lib/util";
	import { CloseButton, Drawer, Progressbar } from "flowbite-svelte";
	import {
		ArrowsRepeatOutline,
		RefreshOutline,
		CheckCircleOutline,
		ExclamationCircleOutline,
		AngleRightOutline,
	} from "flowbite-svelte-icons";
	import { sineIn, sineOut } from "svelte/easing";
	import type { TextOutput } from "window.ai";
	import type { PageData } from "./$types";

	export let data: PageData;

	let hidden = true;

	let transitionParams = {
		x: -320,
		duration: 200,
		easing: sineIn,
	};

	let aiRetryCount = 0;

	let defaultModal = false;

	// Set store value reactively
	$: if (data.storyline) {
		currentStoryline.set(data.storyline);
	}

	$: storyline = data.storyline!;

	$: if (
		storyline &&
		storyline.status === "ongoing" &&
		storyline.steps.length < (storyline.totalSteps || TOTAL_STORYLINE_STEPS)
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

	$: if (storyline && storyline.steps.length === storyline.totalSteps) {
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
			...storyline,
			steps: [
				...storyline.steps,
				{
					choice,
					description: $aiResponse?.description || "",
				},
			],
		};

		await $page.data.wsClient?.sendMessage({
			messageType: "edit",
			data: {
				userId: storyline.userId,
				storyline: updatedStoryline,
			},
		});

		currentStoryline.set(updatedStoryline);
		storylines.update((list) =>
			list.map((story) => (story.id === updatedStoryline.id ? updatedStoryline : story))
		);
	}

	// const handleCreateStorylineWrapper = () => handleCreateStoryline(data.wsClient!);
</script>

{#if storyline && storyline.totalSteps !== null}
	<section class="w-full">
		<div class="flex items-center justify-between">
			<h2 class="text-4xl font-bold text-black">{storyline.title}</h2>
			<button on:click={() => (hidden = false)}>
				<ArrowsRepeatOutline class="h-[2.5em] w-[2.5em]" />
			</button>
		</div>
		{#if storyline.status === "ongoing"}
			<p class="pt-1 text-xl text-zinc-600 font-semibold">
				{storyline.steps.length} out of
				<span>{storyline.totalSteps ?? TOTAL_STORYLINE_STEPS} steps</span>
			</p>
		{/if}
	</section>

	<Drawer
		transitionType="fly"
		{transitionParams}
		bind:hidden
		id="sidebar"
		bgOpacity="bg-opacity-50"
		bgColor="bg-story-600"
		width="sm:w-[20%] md:w-[30%] w-[75%]"
		divClass="p-8 overflow-y-auto z-50 bg-white dark:bg-gray-800 space-y-4 shadow-2xl"
	>
		<h2 class="text-xl lg:text-2xl font-bold text-black">Select storyline:</h2>
		<section class="w-full space-y-4 pt-4">
			{#if $storylines}
				{#each $storylines
					.filter((storyline) => storyline.id !== $currentStoryline.id)
					.slice()
					.sort((a, b) => a.updated - b.updated) as storyline}
					<article
						class=" bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition duration-200"
					>
						<button
							on:click={() => {
								currentStoryline.set(storyline);
								goto(`/storylines/${$currentStoryline.id}`, { replaceState: true });
							}}
							class="p-4 w-full h-full text-left space-y-2"
						>
							<h3 class="font-semibold text-xl line-clamp-2">{storyline.title}</h3>
							<p class="text-gray-600">{formatTimeAgo(storyline.created)}</p>
							<section class="flex items-center justify-between w-full">
								<p class="flex items-center">
									{#if storyline.status === "completed"}
										<CheckCircleOutline class="w-5 h-5 text-green-500 mr-1" />
										<span class="text-green-500 font-bold">{storyline.status}</span>
									{:else}
										<ExclamationCircleOutline class="w-5 h-5 text-yellow-500 mr-1" />
										<span class="text-yellow-500 font-bold">{storyline.status}</span>
									{/if}
								</p>
								<p>
									<span class="font-bold">{storyline.steps.length}</span> /
									<span class="font-bold">{storyline.totalSteps || "∞"}</span>
								</p>
							</section>
						</button>
					</article>
				{/each}
			{/if}
		</section>
	</Drawer>

	<section class="space-y-4">
		{#if storyline.status === "ongoing"}
			{#if $aiResponseLoading}
				<Progressbar
					progress={$aiGeneratingProgress}
					animate
					precision={2}
					labelInside
					tweenDuration={2000}
					easing={sineOut}
					size="h-6"
					labelInsideClass="bg-story-500 text-black text-base font-medium text-center p-1 leading-none rounded-full"
					class="my-12 bg-transparent"
				/>
			{:else if $aiResponse}
				<div class="flex flex-col gap-4 my-8">
					<p class="py-2 text-zinc-800 text-lg">{$aiResponse.description}</p>

					<h3 class="text-2xl font-semibold">Make a choice:</h3>

					<div class="grid grid-cols-3 gap-4 cursor-pointer">
						{#each $aiResponse.choices as choice}
							<button
								on:click={() => handleUserChoice(choice)}
								class="p-4 rounded-xl bg-story-500 text-black hover:bg-styor-700 text-justify flex items-start"
							>
								{choice}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="w-full my-16 grid items-center">
					<button
						class="mx-auto p-4"
						on:click={() => {
							aiRetryCount = 0;
							fetchNextStoryStep();
						}}
					>
						<RefreshOutline class="w-[3.5rem] h-[3.5rem]" />
					</button>
				</div>
			{/if}

			<div class="pb-8">
				{#each storyline.steps.slice().reverse() as storyStep}
					<p class="py-2">{storyStep.description}</p>
					<p class="py-2">
						You previously chose: <span class="font-semibold">{storyStep.choice}</span>
					</p>
					<hr class="my-4 border-1 border-zinc-200 last-of-type:hidden" />
				{/each}
			</div>
		{:else if storyline.steps.length > 0}
			<h3 class="pt-1 text-xl text-zinc-600 font-semibold">Follow storyline:</h3>
			<div class="pb-8">
				{#each storyline.steps.slice().reverse() as storyStep}
					<div class="space-y-2">
						<p class="py-2 text-left">{storyStep.description}</p>
						<p class="py-2 text-left">
							You previously chose: <span class="font-semibold">{storyStep.choice}</span>
						</p>
					</div>
					<hr class="my-4 border-1 border-gray-200 last-of-type:hidden" />
				{/each}
			</div>
		{:else}
			<h4 class="w-full text-3xl text-zinc-500 font-bold flex justify-center py-16"
				>No steps found!</h4
			>
		{/if}

		<!-- {#if storyline.status === "ongoing" && storyline.steps.length === storyline.totalSteps}
			<CongratulationsModal
				bind:defaultModal
				handleCreateStoryline={handleCreateStorylineWrapper}
			/>
		{/if} -->
	</section>
{:else}
	<h2>No storyline defined!</h2>
{/if}
