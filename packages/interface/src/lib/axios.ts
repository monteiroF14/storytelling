import axios, { type AxiosError } from "axios";
import { env } from "../env";

export const api = axios.create({
	baseURL: env.VITE_API_URL,
	withCredentials: true,
	validateStatus(status) {
		return status < 500;
	},
});

api.interceptors.response.use(
	(response) => {
		return response;
	},
	(error: AxiosError) => {
		if (axios.isAxiosError(error)) {
			const response = error.response;

			if (response?.status === 401) {
				console.error("Unauthorized", response.statusText);
			}

			if (response) {
				console.error("Error Response:", {
					status: response.status,
					data: response.data,
				});
			} else if (error.request) {
				console.error("No response received:", error.request);
			} else {
				console.error("Error setting up request:", error.message);
			}
		} else {
			console.error("Unexpected error:", error);
		}

		return Promise.reject(error);
	},
);

export const serverApi = (request: Request) => {
	const cookie = request.headers.get("cookie");

	if (!cookie) {
		return;
	}

	return axios.create({
		baseURL: env.VITE_API_URL,
		headers: {
			Cookie: cookie || "",
		},
	});
};
