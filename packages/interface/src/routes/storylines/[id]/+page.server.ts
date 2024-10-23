import { storylines } from "$lib/stores";
import { get } from "svelte/store";
import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = ({ params }) => {
	const storylineId = params.id;
	if (!storylineId) return {};

	const parsedStorylineId = parseInt(storylineId);

	const storyline = get(storylines).find((storyline) => storyline.id === parsedStorylineId);

	if (storyline) {
		return { storyline };
	} else {
		console.warn(`Storyline with ID ${parsedStorylineId} not found.`);
		throw redirect(308, "/");
	}
};
