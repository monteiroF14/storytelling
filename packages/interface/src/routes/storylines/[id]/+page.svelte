<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { api } from "$lib/axios";
	import { TOTAL_STORYLINE_STEPS } from "$lib/constants";
	import { aiResponse, aiResponseLoading, currentStoryline, storylines } from "$lib/stores";
	import { formatTimeAgo } from "$lib/util";
	import type { Storyline, StorylineChapter } from "@storytelling/types";
	import { Drawer, TextPlaceholder } from "flowbite-svelte";
	import {
		ArrowsRepeatOutline,
		CheckCircleOutline,
		ExclamationCircleOutline,
	} from "flowbite-svelte-icons";
	import { sineIn } from "svelte/easing";
	import { GenerateErrorModal } from "$lib/components";

	let validationError: string;

	let hidden = true;

	const transitionParams = {
		x: -320,
		duration: 200,
		easing: sineIn,
	};

	let defaultModal = false;

	$: if (
		$currentStoryline &&
		$currentStoryline.status === "ongoing" &&
		$currentStoryline.chapters.length < ($currentStoryline.totalSteps || TOTAL_STORYLINE_STEPS)
	) {
		aiResponseLoading.set(true);
		fetchNextStoryStep().finally(() => {
			aiResponseLoading.set(false);
		});
	}

	$: if ($currentStoryline?.chapters?.length === $currentStoryline.totalSteps) {
		defaultModal = true;
	}

	async function fetchNextStoryStep() {
		try {
			const { data } = await api.post("/storylines/generate", {
				storyline: $currentStoryline,
			});
			aiResponse.set(data);
		} catch (error) {
			if (error instanceof Error) {
				validationError = error.message;
			}

			console.error("Error fetching the next story step:", error);
		}
	}

	async function handleUserChoice(choice: StorylineChapter["choice"]) {
		const updatedStoryline = {
			...$currentStoryline,
			chapters: [
				...$currentStoryline.chapters,
				{
					choice,
					description: $aiResponse?.description || "",
				},
			],
		} satisfies Storyline;

		const { data, status } = await api.patch<{ storyline: Storyline }>(
			`/storylines/${updatedStoryline.id}/chapters`,
			{
				chapters: updatedStoryline.chapters,
			}
		);

		if (status !== 200) throw new Error("Error updating storyline");

		currentStoryline.set(data.storyline);
		storylines.update((list) =>
			list.map((story) => (story.id === updatedStoryline.id ? updatedStoryline : story))
		);
	}

	const statusClasses = {
		ongoing: "bg-story-300 text-zinc-900 font-semibold px-2 py-1 rounded-lg",
		completed: "bg-green-600 text-black font-semibold px-2 py-1 rounded-lg",
	};
</script>

{#if $currentStoryline}
	<header class="w-full space-y-2">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl lg:text-3xl font-bold text-black">{$currentStoryline.title}</h2>
			{#if $page.data.user}
				<button on:click={() => (hidden = false)}>
					<ArrowsRepeatOutline class="size-8 lg:size-10 cursor-pointer" />
				</button>
			{/if}
		</div>
		{#if $currentStoryline.status === "ongoing"}
			<div class="flex gap-4">
				<span class={statusClasses[$currentStoryline.status]}>{$currentStoryline.status}</span>
				<svg xmlns="http://www.w3.org/2000/svg" class="inline-block my-auto size-2">
					<circle r="0.25rem" cx="0.25rem" cy="0.25rem" fill="#6F7378" />
				</svg>
				<p class="pt-1 text-xl text-zinc-600 font-semibold">
					{$currentStoryline.chapters.length} out of
					<span>{$currentStoryline.totalSteps ?? TOTAL_STORYLINE_STEPS} chapters</span>
				</p>
			</div>
		{/if}
	</header>

	{#if $page.data.user}
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
										<span class="font-bold">{storyline.chapters.length}</span> /
										<span class="font-bold">{storyline.totalSteps || "∞"}</span>
									</p>
								</section>
							</button>
						</article>
					{/each}
				{/if}
			</section>
		</Drawer>
	{/if}

	<section class="flex flex-col gap-8">
		{#if $currentStoryline.status === "ongoing"}
			{#if $page.data.user}
				{#if $aiResponseLoading}
					<div class="relative w-full h-full">
						<div class="absolute inset-0 mx-auto flex items-center justify-center">
							<div
								class="bg-story-400 w-loader-width h-loader-height animate-loading-animation mx-loading-offset delay-1"
							></div>
							<div
								class="bg-story-400 w-loader-width h-loader-height animate-loading-animation delay-2"
							></div>
							<div
								class="bg-story-400 w-loader-width h-loader-height animate-loading-animation mx-loading-offset delay-3"
							></div>
						</div>
					</div>
				{:else if $aiResponse}
					<div class="flex flex-col gap-4 mb-8">
						<p class="py-2 text-zinc-800">{$aiResponse.description}</p>
						<h3 class="text-xl font-semibold">Make a choice:</h3>
						<div class="grid grid-cols-3 gap-4 cursor-pointer">
							{#each $aiResponse.choices as choice}
								<button
									on:click={() => handleUserChoice(choice)}
									class="p-4 rounded-xl bg-story-500 text-black hover:bg-styor-700 text-justify flex items-start text-sm"
								>
									{choice.synopsis}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<GenerateErrorModal
						{fetchNextStoryStep}
						hasError={$aiResponse ? false : true}
						errorMessage={validationError}
					/>
				{/if}
			{/if}

			<div>
				{#each $currentStoryline.chapters.reverse() as storyStep, idx}
					<div class="flex gap-4 my-4 w-full items-center">
						<h4 class="text-lg text-zinc-500 font-semibold"
							>Chapter {$currentStoryline.chapters.length - idx}</h4
						>
						<hr class="border-1 border-zinc-300 grow" />
					</div>
					<p class="py-2">{storyStep.description}</p>
					<p class="py-2">
						{storyStep.choice.text}
					</p>
				{/each}
			</div>
		{:else if $currentStoryline.chapters?.length > 0}
			<!-- MEANING STORYLINE IS COMPLETED -->

			<h3 class="pt-1 text-xl text-zinc-600 font-semibold">Follow storyline:</h3>
			<div>
				{#each $currentStoryline.chapters.reverse() as storyStep}
					<div class="space-y-2">
						<p class="py-2 text-left">{storyStep.description}</p>
						<p class="py-2 text-left">
							{storyStep.choice.text}
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
	</section>
{:else}
	<h2>No storyline defined!</h2>
{/if}
