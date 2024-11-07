<script lang="ts">
import "../app.css";
import { PlusOutline } from "flowbite-svelte-icons";
import { Tooltip, Spinner } from "flowbite-svelte";
import { page } from "$app/stores";
import { api } from "$lib/axios";
import { invalidateAll } from "$app/navigation";
import { onMount } from "svelte";

let isLoading = true;

onMount(() => {
	isLoading = false;
});

async function handleSignOut(): Promise<void> {
	await Promise.all([api.post("/auth/logout"), invalidateAll()]);
}
</script>

<header
	class="flex items-center py-8 xl:w-4/5 mx-auto w-full px-4 md:px-12 xl:px-0 border-b-2 border-zinc-600 border-opacity-10 gap-2 md:gap-4"
>
	<nav class="flex gap-4 lg:gap-8 grow font-semibold items-center text-xl lowercase">
		<a class="hover:text-story-600" href="/">storylines</a>
		<a class="hover:text-story-600" href="/#">Play</a>
	</nav>

  {#if $page.data.user}
    <div>
      <a href="/storylines/new" class="p-2 bg-story-500 text-white rounded-full inline-block">
        <PlusOutline size="lg" />
      </a>
      <Tooltip placement="bottom">New storyline</Tooltip>
    </div>
  {/if}

	{#if $page.data.user}
		<button
			class="px-4 py-2 rounded-full font-semibold text-xl"
			on:click={handleSignOut}
			title="Sign Out">
        <img src={$page.data.user.picture} alt="profile" class="size-10 rounded-full cursor-pointer" fetchpriority="high" referrerpolicy="no-referrer">
    </button>
		<Tooltip placement="bottom">Sign Out</Tooltip>
	{:else}
		<a
			href="http://localhost:3000/auth/google/"
			class="rounded-full font-semibold text-2xl underline">Sign In</a
		>
	{/if}
</header>
<main
	class="flex w-full my-10 gap-8 lg:gap-12 px-4 md:px-12 xl:px-0 xl:w-4/5 mx-auto flex-col sm:flex-row"
>
	{#if isLoading}
		<div class="w-full flex items-center justify-center text-2xl font-semibold my-auto">
			<Spinner color="yellow" bg="text-story-300" size={16} />
		</div>
	{:else}
		<section class="mx-auto w-full">
			<slot />
		</section>
	{/if}
</main>
