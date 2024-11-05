<script lang="ts">
import { TOTAL_STORYLINE_STEPS } from "$lib/constants";
import { currentStoryline, storylines } from "$lib/stores";
import { sineIn } from "svelte/easing";
import type { PageData } from "./$types";
import { Drawer } from "flowbite-svelte";
import { goto } from "$app/navigation";
import { formatTimeAgo } from "$lib/util";
import {
	CheckCircleOutline,
	ExclamationCircleOutline,
	ArrowsRepeatOutline,
} from "flowbite-svelte-icons";
import { api } from "$lib/axios";
import { onMount } from "svelte";
import type { Storyline } from "@storytelling/types";
import type { AxiosResponse } from "axios";
import type { Readable } from "svelte/store";
import { streamText } from "ai";

export let data: PageData;

let hidden = true;

const transitionParams = {
	x: -320,
	duration: 200,
	easing: sineIn,
};

let defaultModal = false;

$: if (data.storyline) {
	currentStoryline.set(data.storyline);
}

$: storyline = data.storyline!;

onMount(async () => {
	await fetchNextStoryStep();
});

$: if (storyline && storyline.steps.length === storyline.totalSteps) {
	defaultModal = true;
}

async function fetchNextStoryStep() {
	console.log("storyline data being passed: ", data.storyline);

	try {
		const response = await api.post(
			"/storylines/generate",
			{
				storyline: data.storyline,
			},
			{
				responseType: "stream",
			},
		);

		const chunks: Uint8Array[] = [];
		const decoder = new TextDecoder();

		response.data.on("data", (chunk: Uint8Array) => {
			chunks.push(chunk);

			const jsonString = decoder.decode(chunk, { stream: true });
			const newStep = JSON.parse(jsonString);

			console.log("step: ", newStep);
		});

		response.data.on("end", () => {
			const completeResponse = Buffer.concat(chunks).toString("utf8");
			console.log("Complete response: ", JSON.parse(completeResponse));
		});

		response.data.on("error", (error: Error) => {
			console.error("Stream error:", error.message);
		});
	} catch (error) {
		console.error("Error fetching the next story step:", error);
	}
}
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
	</section>
{:else}
	<h2>No storyline defined!</h2>
{/if}
