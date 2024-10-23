<script lang="ts">
import { currentStoryline } from "$lib/stores";
import { Button, Modal } from "flowbite-svelte";

export let defaultModal: boolean;
export let handleCreateStoryline: () => void;
</script>

<Modal
	title={$currentStoryline.title}
	bind:open={defaultModal}
	autoclose
	size="xl"
	class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 mx-auto w-full lg:p-8 lg:w-3/4"
	headerClass="flex justify-between items-center p-4 md:p-5 rounded-t-lg"
	backdropClass="fixed inset-0 z-40 bg-gray-900 bg-opacity-40 dark:bg-opacity-80"
	bodyClass="p-4 md:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain"
>
	<svelte:fragment slot="header">
		<h2 class="text-3xl font-bold text-black dark:text-white">{$currentStoryline.title}</h2>
	</svelte:fragment>

	<div class="flex flex-col gap-2">
		{#each $currentStoryline.steps as storyStep}
			<p class="py-2 text-base leading-relaxed text-gray-500 dark:text-gray-400">
				{storyStep.description}
			</p>
		{/each}
	</div>

	<svelte:fragment slot="footer">
		<Button
			on:click={() => {
				handleCreateStoryline();
				currentStoryline.set({
					...$currentStoryline,
					status: "completed",
				});
			}}
			class="bg-story-500 text-white hover:bg-story-500 rounded-2xl shadow transition duration-200 p-4"
		>
			Create new storyline
		</Button>
		<Button color="alternative">Close</Button>
	</svelte:fragment>
</Modal>
