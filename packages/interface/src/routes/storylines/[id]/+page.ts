import { currentStoryline } from "$lib/stores";
import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ data, parent }) => {
	const parentData = await parent();

	const storyline = data.storyline;

	const isLoggedIn = !!parentData.user;
	const doesUserOwnStoryline =
		isLoggedIn && storyline?.userId === parentData.user.id;

	const isStorylinePublic = storyline?.visibility === "public";

	if (isStorylinePublic || (!isStorylinePublic && doesUserOwnStoryline)) {
		currentStoryline.set(storyline);
		return;
	}

	throw redirect(308, "/");
};
