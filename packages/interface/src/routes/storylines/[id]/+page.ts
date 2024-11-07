import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";
import { currentStoryline } from "$lib/stores";

export const load: PageLoad = async ({ data, parent }) => {
	const parentData = await parent();

	const storyline = data.storyline;

	if (!parentData.user) return;

	const hasPermission =
		(storyline?.visibility === "private" &&
			storyline.userId === parentData.user.id) ||
		storyline?.visibility === "public";

	if (hasPermission) {
		currentStoryline.set(storyline);
		return;
	}

	throw redirect(308, "/");
};
