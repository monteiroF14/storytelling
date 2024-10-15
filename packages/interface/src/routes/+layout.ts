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

export const load: LayoutLoad = async ({ data }) => {
	const wsClient = getWebSocketClient("ws://localhost:3000/");

	return {
		...data,
		wsClient,
		websocketReady: wsClient
			.waitForConnection()
			.then(async () => {
				try {
					const isFirstRequest = !get(storylines);
					if (isFirstRequest && data.user?.id) {
						wsClient.sendMessage(
							JSON.stringify({
								userId: data.user.id,
							})
						);
					}
				} catch (e) {
					console.error("Error while fetching storyline:", e);
				}
			})
			.catch((error) => {
				console.error("Error while waiting for WebSocket:", error);
				return Promise.reject(error);
			}),
	};
};
