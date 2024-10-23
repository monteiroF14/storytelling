import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, data }) => {
	const parentData = await parent();
	console.log("parent: ", parentData);

	console.log("data: ", data);

	const storyline = data.storyline;

	if (
		(storyline?.visibility === "private" &&
			storyline.userId === parentData.user.id) ||
		storyline?.visibility === "public"
	) {
		return { storyline: storyline };
	}
	throw redirect(308, "/");
};
