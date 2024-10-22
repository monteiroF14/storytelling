<script lang="ts">
	import { Spinner, Tooltip } from "flowbite-svelte";
	import { ArrowLeftToBracketOutline, PlusOutline } from "flowbite-svelte-icons";
	import { onMount } from "svelte";
	import type { LayoutData } from "./$types";
	import "../app.css";
	import { browser } from "$app/environment";

	if (browser) {
		import("window.ai");
	}

	export let data: LayoutData;

	/* ! IF TOKEN EXPIRED MAKE A REQUEST TO A NEW TOKEN, UP TO X TIMES, THEN MAKE LOGIN AGAIN */
	onMount(() => {
		if (data.session) {
			const token = data.session.token;
			if (!document.cookie.includes("accessToken")) {
				document.cookie = `accessToken=${token}; path=/; expires=${new Date(Date.now() + 86400000).toUTCString()}; SameSite=Strict; Secure`;
			}
		}
	});

	const handleSignOut = () =>
		(document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;");
</script>

<header
	class="flex items-center py-8 xl:w-4/5 mx-auto w-full px-4 md:px-12 xl:px-0 border-b-2 border-zinc-600 border-opacity-10 gap-8"
>
	<nav class="flex gap-8 grow font-semibold items-center text-xl lowercase">
		<a class="hover:text-story-600" href="/">storylines</a>
		<a class="hover:text-story-600" href="/#">Play</a>
	</nav>

	<div>
		<a href="/storylines/new" class="p-2 bg-story-500 text-white rounded-full inline-block">
			<PlusOutline size="lg" />
		</a>
		<Tooltip placement="bottom">New storyline</Tooltip>
	</div>

	{#if data.session}
		<button
			class="px-4 py-2 rounded-full font-semibold text-xl"
			on:click={handleSignOut}
			title="Sign Out"><ArrowLeftToBracketOutline size="xl" /></button
		>
		<Tooltip placement="bottom">Sign Out</Tooltip>
	{:else}
		<a
			href="http://localhost:3000/auth/google/"
			class="mr-6 mt-6 px-4 py-2 rounded-full font-semibold text-2xl underline">Sign In</a
		>
	{/if}
</header>
<main
	class="flex w-full my-10 gap-8 lg:gap-12 px-4 md:px-12 xl:px-0 xl:w-4/5 mx-auto flex-col sm:flex-row"
>
	{#await data.websocketReady}
		<div class="w-full h-screen flex items-center justify-center text-2xl font-semibold">
			<Spinner color="yellow" bg="text-story-300" size={16} />
		</div>
	{:then}
		<section class="mx-auto w-full">
			<slot />
		</section>
	{:catch error}
		<p>Error loading storylines: {error.message}</p>
	{/await}
</main>
