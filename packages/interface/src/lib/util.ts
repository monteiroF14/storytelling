import { get } from "svelte/store";
import { TOTAL_STORYLINE_STEPS } from "./constants";
import { storylineTitleInput, currentStoryline } from "$lib/stores";
import type { WebSocketClient } from "./web-socket-client";

function formatTimeAgo(timestamp: number) {
	const now = new Date();
	const date = new Date(Number(timestamp) * 1000); // Ensure timestamp is a number
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	let interval = Math.floor(seconds / 31536000); // Years
	if (interval >= 1) return interval === 1 ? "1 year ago" : `${interval} years ago`;

	interval = Math.floor(seconds / 2592000); // Months
	if (interval >= 1) return interval === 1 ? "1 month ago" : `${interval} months ago`;

	interval = Math.floor(seconds / 604800); // Weeks
	if (interval >= 1) return interval === 1 ? "1 week ago" : `${interval} weeks ago`;

	interval = Math.floor(seconds / 86400); // Days
	if (interval >= 1) return interval === 1 ? "1 day ago" : `${interval} days ago`;

	interval = Math.floor(seconds / 3600); // Hours
	if (interval >= 1) return interval === 1 ? "1 hour ago" : `${interval} hours ago`;

	interval = Math.floor(seconds / 60); // Minutes
	if (interval >= 1) return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;

	return "Just now";
}

function getStorylineClass(status: string) {
	const baseClasses =
		"relative w-full p-2 rounded-xl bg-opacity-70 text-black first:mt-0 flex flex-col gap-4 text-left border-2 bg-opacity-80 transition duration-200 ease-in-out hover:bg-opacity-60";

	if (status === "ongoing") {
		return `${baseClasses} bg-yellow-400 border-yellow-600`;
	} else if (status === "completed") {
		return `${baseClasses} bg-green-400 border-green-600`;
	} else {
		return `${baseClasses} bg-red-400 border-red-600`;
	}
}

async function handleCreateStoryline(wsClient: WebSocketClient) {
	wsClient.sendMessage(
		JSON.stringify({
			userId: 1,
			storyline: {
				...get(currentStoryline),
				title: get(storylineTitleInput),
				totalSteps: TOTAL_STORYLINE_STEPS,
			},
		})
	);

	// console.log("creating storyline: ", storyline);

	// currentStoryline.set(storyline);
	// storylines.update((list) => (list ? [...list, storyline] : [storyline]));

	storylineTitleInput.set("");
}

export { formatTimeAgo, getStorylineClass, handleCreateStoryline };
