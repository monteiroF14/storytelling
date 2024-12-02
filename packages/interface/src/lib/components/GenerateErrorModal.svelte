<script lang="ts">
	import { Button, Modal } from "flowbite-svelte";
	import { ExclamationCircleOutline } from "flowbite-svelte-icons";

	export let fetchNextStoryStep: () => void;
	export let hasError: boolean;
	export let errorMessage = "Some data requirements failed to generate.";
</script>

<Modal
	bind:open={hasError}
	size="sm"
	autoclose
	outsideclose
	class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 mx-auto w-full lg:w-3/4"
	headerClass="flex justify-between items-center p-4 md:p-5 rounded-t-lg"
	backdropClass="fixed inset-0 z-40 bg-gray-900 bg-opacity-40 dark:bg-opacity-80"
	bodyClass="p-4 md:p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain"
>
	<ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />

	<h3 class="text-lg text-gray-500 leading-relaxed text-center"
		>{errorMessage}<br />Please try again.</h3
	>

	<Button
		class="bg-story-600 cursor-pointer text-md text-black mx-auto block"
		on:click={fetchNextStoryStep}>Retry</Button
	>
</Modal>
