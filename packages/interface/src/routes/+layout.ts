import { browser } from "$app/environment";
import { storylines } from "$lib/stores";
import { WebSocketClient } from "$lib/web-socket-client";
import { get } from "svelte/store";
import type { LayoutLoad } from "./$types";

let wsClient: WebSocketClient | null = null;

function getWebSocketClient(url: string): WebSocketClient {
	if (!wsClient || !wsClient.isConnected) {
		wsClient = new WebSocketClient(url);
		wsClient.connect();
	}
	return wsClient;
}

export const load: LayoutLoad = ({ data }) => {
	// const token = data.session?.token;
	// ! fix this
	if (data.session === null) {
		// Gracefully handle missing token
		if (browser) {
			window.location.href = "http://localhost:3000/auth/google/";
		}
		console.error("Token missing. Cannot establish WebSocket connection.");
		return {
			...data,
			error: "Missing token. Please log in.",
		};
	}

	const wsClient = getWebSocketClient(
		`ws://localhost:3000/?token=${data.session?.token}`,
	);

	return {
		...data,
		wsClient,
		websocketReady: wsClient
			.waitForConnection()
			.then(() => {
				try {
					const isFirstRequest = !get(storylines);
					if (isFirstRequest && data.user?.id) {
						wsClient.sendMessage({
							messageType: "fetch",
							data: {
								userId: data.user.id,
							},
						});
					}
				} catch (e) {
					console.error("Error while fetching storyline:", e);
					return {
						error:
							"Failed to connect to the WebSocket. Please check your token.",
					};
				}
			})
			.catch((error) => {
				console.error("Error while waiting for WebSocket:", error);
				return Promise.reject(error);
			}),
	};
};
