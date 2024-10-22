import axios from "axios";
import jwt from "jsonwebtoken";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies }) => {
	const token = cookies.get("accessToken");

	// Decrypt the accessToken
	if (token) {
		try {
			const sessionVerify = jwt.verify(token, import.meta.env.VITE_JWT_SECRET!);

			// Set cookie expiration once (when token is initially set, not on every load)
			if (!cookies.get("accessToken")) {
				const oneDayFromNow = new Date(Date.now() + 86400000).toUTCString(); // 24 hours from now

				cookies.set("accessToken", token, {
					expires: new Date(oneDayFromNow),
					path: "/",
					httpOnly: true,
					secure: true,
					sameSite: "strict",
				});
			}

			const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/user/1`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			return {
				session: {
					token,
					sessionVerify,
				},
				user: data.user,
			};
		} catch (err) {
			console.error("Failed to verify token or fetch user data:", err);
		}
	} else {
		return {
			user: null,
			session: null,
		};
	}
};
