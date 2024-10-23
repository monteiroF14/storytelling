import { storylines } from "$lib/stores";
import { redirect } from "@sveltejs/kit";
import { get } from "svelte/store";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
	const storylineId = params.id;
	if (!storylineId) return {};

	const parsedStorylineId = Number.parseInt(storylineId);

	const storyline = get(storylines).find(
		(storyline) => storyline.id === parsedStorylineId,
	);

	if (storyline) {
		return { storyline };
	}
	console.warn(`Storyline with ID ${parsedStorylineId} not found.`);
	throw redirect(308, "/");
};
