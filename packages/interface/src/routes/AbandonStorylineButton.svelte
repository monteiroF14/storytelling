<script lang="ts">
	import { Button, Modal } from "flowbite-svelte";
	import { TrashBinOutline, ExclamationCircleOutline } from "flowbite-svelte-icons";

	import { currentStoryline } from "$lib/stores";

	export let handleAbandonStoryline: () => void;

	let popupModal = false;
</script>

<Button on:click={() => (popupModal = true)} class="text-black w-[40px] h-[40px]">
	<TrashBinOutline class="mx-auto mb-4 text-zinc-800 w-12 h-12 dark:text-zinc-400" />
</Button>

<Modal
	bind:open={popupModal}
	size="md"
	autoclose
	class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 mx-auto w-full lg:w-3/4"
	headerClass="flex justify-between items-center p-4 md:p-5 rounded-t-lg"
	backdropClass="fixed inset-0 z-40 bg-gray-900 bg-opacity-40 dark:bg-opacity-80"
	bodyClass="p-4 md:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain"
>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />

		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400"
			>Are you sure you want to abandon the storyline "{$currentStoryline.title}"</h3
		>
		<Button color="red" class="me-2" on:click={handleAbandonStoryline}>Yes, I'm sure</Button>
		<Button color="alternative">No, cancel</Button>
	</div>
</Modal>
