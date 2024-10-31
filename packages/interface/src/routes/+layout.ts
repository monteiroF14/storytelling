import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = ({ data }) => {
	// if (data.session === null) {
	// 	// Gracefully handle missing token
	// 	if (browser) {
	// 		window.location.href = "http://localhost:3000/auth/google/";
	// 	}
	// 	console.error("Token missing. Cannot establish WebSocket connection.");
	// 	return {
	// 		...data,
	// 		error: "Missing token. Please log in.",
	// 	};
	// }
	// const wsClient = getWebSocketClient(
	// 	`ws://localhost:3000/?token=${data.session?.token}`,
	// );
	// return {
	// 	...data,
	// 	wsClient,
	// 	websocketReady: wsClient
	// 		.waitForConnection()
	// 		.then(() => {
	// 			try {
	// 				const isFirstRequest = !get(storylines);
	// 				if (isFirstRequest && data.user?.id) {
	// 					wsClient.sendMessage({
	// 						messageType: "fetch",
	// 						data: {
	// 							userId: data.user.id,
	// 						},
	// 					});
	// 				}
	// 			} catch (e) {
	// 				console.error("Error while fetching storyline:", e);
	// 				return {
	// 					error:
	// 						"Failed to connect to the WebSocket. Please check your token.",
	// 				};
	// 			}
	// 		})
	// 		.catch((error) => {
	// 			console.error("Error while waiting for WebSocket:", error);
	// 			return Promise.reject(error);
	// 		}),
	// };
};
