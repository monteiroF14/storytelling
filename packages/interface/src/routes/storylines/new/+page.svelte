<script lang="ts">
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { api } from "$lib/axios";
import { TOTAL_STORYLINE_STEPS } from "$lib/constants";
import { storylineTitleInput } from "$lib/stores";
import type { User } from "@storytelling/types";
import { Alert } from "flowbite-svelte";
import {
	CloseCircleSolid,
	InfoCircleSolid,
	WandMagicSparklesOutline,
} from "flowbite-svelte-icons";
import { quintOut } from "svelte/easing";
import { fade, slide } from "svelte/transition";
import { env } from "../../../env";

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
	}
}

async function handleCreateStoryline() {
	const user: User = $page.data.user;

	const { data, status } = await api.post("/storylines/", {
		title: $storylineTitleInput,
		totalSteps: TOTAL_STORYLINE_STEPS,
		userId: user.id,
	});

	if (status !== 201) {
		showAlert = true;

		setTimeout(() => {
			showAlert = false;
		}, 3000);

		validationError = "Error while creating storyline";
		throw new Error("Error while creating storyline");
	}

	if (data?.storyline) {
		storylineTitleInput.set("");
		goto(`/storylines/${data.storyline.id}`, { replaceState: true });
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
					{validationError}
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
