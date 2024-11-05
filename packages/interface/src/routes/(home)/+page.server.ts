import { serverApi } from "$lib/axios";
import type { Storyline } from "@storytelling/types";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request, parent }) => {
	try {
		const parentData = await parent();

		const api = serverApi(request);
		if (!api) throw "Unauthenticated";

		if (!parentData.user) throw "No parent data user";

		const { data, status } = await api.get<{ storylines: Array<Storyline> }>(
			`/storylines?userId=${parentData.user.id}&orderBy=updated&order=ASC&limit=50`,
		);

		if (status === 400) {
			return { storylines: null };
		}

		return { storylines: data.storylines };
	} catch (e) {
		console.error(e);
		return { user: null };
	}
};
