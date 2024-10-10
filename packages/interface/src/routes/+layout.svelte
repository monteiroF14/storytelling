<script lang="ts">
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import { currentStoryline, storylines, storylineTitleInput } from "$lib/stores";
	import { formatTimeAgo, getStorylineClass, handleCreateStoryline } from "$lib/util";
	import { WebSocketClient } from "$lib/web-socket-client";
	import { WandMagicSparklesOutline } from "flowbite-svelte-icons";
	import "../app.css";
	import type { LayoutData } from "./$types";

	import { Spinner } from "flowbite-svelte";

	export let data: LayoutData;
	const wsClient: WebSocketClient = data.wsClient;

	if (browser) {
		import("window.ai");
	}
</script>

<div
	class="h-screen w-screen bg-gradient-to-r from-orange-600 to-yellow-600 backdrop-blur-lg opacity-20 absolute inset-0 -z-10"
	aria-label="overlay"
></div>
{#await data.websocketReady}
	<div class="w-full h-screen flex items-center justify-center text-2xl font-semibold">
		<Spinner color="red" bg="text-red-300" size={16} />
	</div>
{:then}
	<main
		class="flex w-full h-full my-12 gap-8 lg:gap-12 px-4 md:px-12 xl:px-0 xl:w-4/5 mx-auto flex-col sm:flex-row"
	>
		<aside class="w-1/4 space-y-4">
			{#if $storylines}
				<h2 class="text-2xl lg:text-3xl font-bold text-black">Your storylines:</h2>
				{#each $storylines.slice().sort((a, b) => b.updated - a.updated) as storyline}
					<button
						on:click={() => {
							currentStoryline.set(storyline);
							goto(`/?storyline=${$currentStoryline.id}`, { replaceState: true });
						}}
						class={getStorylineClass(storyline.status)}
					>
						<p class="font-semibold text-lg z-10 line-clamp-2 overflow-hidden">{storyline.title}</p>
						<p class="z-10">{formatTimeAgo(storyline.created)}</p>
					</button>
				{/each}
			{/if}
		</aside>
		<section class="mx-auto w-3/4">
			<!-- ! NOT WORKING -->
			<a
				href="http://localhost:3000/auth/google/"
				class="absolute right-0 mr-6 mt-6 px-4 py-2 rounded-full font-semibold text-2xl underline"
				>Sign In</a
			>

			{#if $currentStoryline && $currentStoryline.totalSteps !== null}
				<slot />
			{:else}
				<form
					on:submit|preventDefault={() => handleCreateStoryline(wsClient)}
					class="flex gap-2 py-8"
				>
					<input
						type="text"
						class="text-4xl font-bold px-2 focus:underline focus:border-none focus:outline-none bg-transparent border-none"
						placeholder="storyline title.."
						bind:value={$storylineTitleInput}
					/>
					<button class="p-4">
						<WandMagicSparklesOutline ariaLabel="generate storyline" size="xl" />
					</button>
				</form>
			{/if}
		</section>
	</main>
{:catch error}
	<p>Error loading storylines: {error.message}</p>
{/await}
