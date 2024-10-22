<script lang="ts">
	import {
		WandMagicSparklesOutline,
		CloseCircleSolid,
		InfoCircleSolid,
	} from "flowbite-svelte-icons";
	import { storylineTitleInput, currentStoryline } from "$lib/stores";
	import { goto } from "$app/navigation";
	import { Alert } from "flowbite-svelte";
	import { TOTAL_STORYLINE_STEPS } from "$lib/constants";
	import { fade, slide } from "svelte/transition";
	import { quintOut } from "svelte/easing";
	import { page } from "$app/stores";
	import type { User } from "@storytelling/types";
	import type { WebSocketClient } from "$lib/web-socket-client";

	let validationError: string;
	let showAlert = false;

	function handleCreateStorylineFormSubmit(e: Event) {
		e.preventDefault();

		showAlert = true;

		setTimeout(() => {
			showAlert = false;
		}, 3000);

		if ($storylineTitleInput.trim().length === 0) {
			validationError = "Title cannot be empty!";
		} else {
			handleCreateStoryline();
			goto(`/storylines/${$currentStoryline.id}`, { replaceState: true });
		}
	}

	async function handleCreateStoryline() {
		const user: User = $page.data.user;
		const wsClient: WebSocketClient = $page.data.wsClient;

		if (!user) throw new Error("no user found");
		if (!wsClient) throw new Error("no wsClient found");

		// TODO: ALTER TYPE STRUCUTRE TO CREATE A NEW STORYLINE, ONLY NEEDS TITLE AND STEPS FIELDS
		const response = await wsClient.sendMessage({
			messageType: "create",
			data: {
				userId: user.id,
				storyline: {
					title: $storylineTitleInput,
					totalSteps: TOTAL_STORYLINE_STEPS,
				},
			},
		});

		if (response && response.storyline) {
			storylineTitleInput.set("");
			goto(`/storylines/${response.storyline.id}`, { replaceState: true });
		}
	}
</script>

<form on:submit|preventDefault={handleCreateStorylineFormSubmit} class="space-y-4">
	<label for="storylineTitle" class="text-xl font-bold">
		Give your story a captivating title:
	</label>
	<section class="flex gap-2">
		<div class="relative grow my-auto">
			<input
				type="text"
				id="storylineTitle"
				class="text-xl font-bold px-4 py-2 pr-10 rounded-md border-2 w-full border-zinc-200 focus:border-story-500 focus:ring-0 focus:outline-none focus:bg-outline-600 z-40"
				placeholder="A long time ago in a galaxy far far away…"
				bind:value={$storylineTitleInput}
			/>

			{#if $storylineTitleInput}
				<button
					on:click={() => storylineTitleInput.set("")}
					type="button"
					class="absolute right-3 top-3 text-zinc-300 z-50"
					title="Clear title"
				>
					<CloseCircleSolid size="lg" />
				</button>
			{/if}
		</div>

		<button class="p-2" type="submit" title="Create new storyline">
			<WandMagicSparklesOutline ariaLabel="generate storyline" size="xl" />
		</button>
	</section>

	{#if showAlert}
		<div in:slide={{ delay: 250, duration: 300, easing: quintOut, axis: "x" }} out:fade|local>
			{#if validationError}
				<Alert color="red" class="absolute right-12 bottom-12 text-lg" dismissable>
					<InfoCircleSolid slot="icon" class="w-8 h-8" />
					<span class="font-semibold">Error!</span>
					Storyline title cannot be empty.
				</Alert>
			{:else}
				<Alert color="green" class="absolute right-12 bottom-12 text-lg" dismissable>
					<InfoCircleSolid slot="icon" class="w-8 h-8" />
					<span class="font-semibold">Success!</span>
					Storyline created.
				</Alert>
			{/if}
		</div>
	{/if}
</form>
