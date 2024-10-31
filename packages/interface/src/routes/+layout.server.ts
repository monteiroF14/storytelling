import { serverApi } from "$lib/axios";
import type { User } from "@storytelling/types";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ request }) => {
	try {
		const api = serverApi(request);
		if (!api) throw "Unauthenticated";

		const { data, status } = await api.get<{ user: User }>("/me");

		if (status === 401) {
			return { user: null };
		}

		return { user: data.user };
	} catch (e) {
		console.error(e);
		return { user: null };
	}
};
