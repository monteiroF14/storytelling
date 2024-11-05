<script lang="ts">
import { goto } from "$app/navigation";
import { currentStoryline, storylines } from "$lib/stores";
import { formatTimeAgo } from "$lib/util";
import { onMount } from "svelte";
import {
	CheckCircleOutline,
	ExclamationCircleOutline,
	ArrowSortLettersOutline,
} from "flowbite-svelte-icons";
import type { PageServerData } from "./$types";
import { Spinner } from "flowbite-svelte";
import { api } from "$lib/axios";
import type { Storyline } from "@storytelling/types";
import { page } from "$app/stores";

export let data: PageServerData;

let noMoreStorylines = false;

let ascending = true;

let orderedStorylines: Storyline[] = [];

function sortStorylines() {
	orderedStorylines = [...$storylines].sort((a, b) =>
		ascending ? a.created - b.created : b.created - a.created,
	);
}

let loadTrigger: HTMLDivElement | null = null;

const observer = new IntersectionObserver(
	async (entries) => {
		if (entries[0].isIntersecting && !noMoreStorylines) {
			const { data } = await api.get<{ storylines: Array<Storyline> }>(
				`/storylines?userId=${$page.data.user.id}&orderBy=updated&order=DESC&offset=${$storylines.length}&limit=6`,
			);

			if (data.storylines.length === 0) {
				noMoreStorylines = true;
			} else {
				storylines.update((current) => [...current, ...data.storylines]);
				orderedStorylines = [...orderedStorylines, ...data.storylines];
			}
		}
	},
	{ threshold: 1.0 },
);

let isLoading = true;

onMount(() => {
	if (data.storylines) {
		storylines.set(data.storylines);
		orderedStorylines = [...data.storylines];
	}

	isLoading = false;

	if (loadTrigger) observer.observe(loadTrigger);
	return () => {
		if (loadTrigger) observer.unobserve(loadTrigger);
	};
});
</script>

<section class="space-y-6">
	{#if isLoading}
		<div class="flex justify-center items-center h-screen">
			<Spinner color="yellow" size={16} />
		</div>
	{:else if data.user === null}
		<div class="justify-start p-4 flex flex-col gap-4">
			<h2 class="text-2xl font-semibold">You are not logged in!</h2>
			<p class="text-lg">Sign in to start creating storylines</p>
			<a
				href="http://localhost:3000/auth/google/"
				class="font-semibold text-lg px-4 py-2 bg-story-500 text-white rounded-lg w-fit mx-auto"
				>Sign In</a
			>
		</div>
	{:else if $storylines}
    <header class="flex justify-between">
      <h2 class="text-2xl font-bold">Your storylines:</h2>
      <button on:click={() => {ascending = !ascending; sortStorylines()}} aria-label="Toggle sort order">
        <ArrowSortLettersOutline size="xl" />
      </button>
    </header>

		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each orderedStorylines as storyline}
      <article class="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition duration-200">
					<button
						on:click={() => {
							currentStoryline.set(storyline);
							goto(`/storylines/${storyline.id}`, { replaceState: true });
						}}
						class="p-4 w-full h-full text-left flex flex-col gap-4"
					>
						<h3 class="font-semibold text-lg md:text-xl line-clamp-2 leading-snug">{storyline.title}</h3>
						<section class="flex flex-col gap-1 mt-auto w-full">
              <p class="text-gray-600">{formatTimeAgo(storyline.created)}</p>
              <div class="flex justify-between">
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
              </div>
						</section>
					</button>
				</article>
			{/each}
		</div>
	{:else}
		<article class="text-center p-4">
			<h2 class="text-xl font-semibold">No storylines found!</h2>
			<p>Start now by creating a storyline</p>
			<button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">Create new storyline</button>
		</article>
	{/if}

  <div bind:this={loadTrigger} class="h-4"></div>
</section>
