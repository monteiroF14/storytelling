import { serverApi } from "$lib/axios";
import type { Storyline } from "@storytelling/types";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, request }) => {
	if (!params.id) return {};

	const api = serverApi(request);
	if (!api) throw "Unauthenticated";

	const { data, status } = await api.get<{ storyline: Storyline }>(
		`/storylines/${params.id}`,
	);

	if (status === 400) {
		return { storyline: null };
	}

	return { storyline: data.storyline };
};
