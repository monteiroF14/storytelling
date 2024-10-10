import { currentStoryline, storylines, wsConnected } from "$lib/stores";
import { WebSocketClient } from "$lib/web-socket-client";
import { get } from "svelte/store";
import type { LayoutLoad } from "./$types";

let wsClient: WebSocketClient;

try {
	wsClient = new WebSocketClient("ws://localhost:3000/");
	wsClient.connect();
} catch (e) {
	console.error("Error while connecting to WebSocket:", e);
}

// Function that returns a promise that resolves when WebSocket is connected
const waitForWebSocket = () => {
	return new Promise<void>((resolve, reject) => {
		let hasSettled = false;

		// Set a timeout for the WebSocket connection
		const timeout = setTimeout(() => {
			if (!hasSettled) {
				hasSettled = true;
				reject(new Error("WebSocket connection timed out"));
			}
		}, 10000); // Adjust the timeout duration as needed

		const unsubscribe = wsConnected.subscribe((connected) => {
			if (connected) {
				if (!hasSettled) {
					hasSettled = true;
					clearTimeout(timeout); // Clear the timeout if resolved
					resolve();
					unsubscribe(); // Unsubscribe upon successful connection
				}
			} else {
				// Only reject if we have tried to connect already
				if (wsClient.retryCount >= wsClient.maxRetries && !hasSettled) {
					hasSettled = true;
					clearTimeout(timeout); // Clear the timeout if rejecting
					reject(new Error("WebSocket connection failed after maximum retries"));
					unsubscribe(); // Unsubscribe on rejection
				}
			}
		});
	});
};

export const load: LayoutLoad = ({ url }) => {
	const storylineId = url.searchParams.get("storyline");

	return {
		wsClient,
		websocketReady: waitForWebSocket()
			.then(() => {
				try {
					if (storylineId) {
						const parsedStorylineId = parseInt(storylineId);
						const storyline = get(storylines).find(
							(storyline) => storyline.id === parsedStorylineId
						);
						if (storyline) {
							currentStoryline.set(storyline);
						}
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
