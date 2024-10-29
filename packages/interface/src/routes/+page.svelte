<script lang="ts">

</script>

<section class="space-y-4">
	<h2 class="text-2xl font-bold">Your storylines:</h2>

	{#if $storylines}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each $storylines.slice().sort((a, b) => a.updated - b.updated) as storyline}
				<article
					class=" bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition duration-200"
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
		</div>
	{:else}
		<article class="text-center p-4">
			<h2 class="text-xl font-semibold">No storylines found!</h2>
			<p>Start now by creating a storyline</p>
			<button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">Create new storyline</button>
		</article>
	{/if}
</section>
