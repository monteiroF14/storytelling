import type { Storyline } from "@storytelling/types";
import { storylines, wsConnected } from "$lib/stores";

export class WebSocketClient {
	private socket: WebSocket | null = null;
	private url: string;
	private reconnectInterval: number;
	private _maxRetries: number;
	private _retryCount = 0;

	constructor(url: string, reconnectInterval = 5000, maxRetries = 10) {
		this.url = url;
		this.reconnectInterval = reconnectInterval;
		this._maxRetries = maxRetries;
	}

	// Connect to the WebSocket server
	connect() {
		this.socket = new WebSocket(this.url);

		// Open connection event
		this.socket.onopen = () => {
			console.log("WebSocket connected");
			this._retryCount = 0; // Reset retry count on successful connection
		};

		// Message received from server
		this.socket.onmessage = (event) => {
			// console.log("Message from server:", event.data);
			this.handleMessage(event.data); // Custom method for handling the message
		};

		// Handle errors
		this.socket.onerror = (error) => {
			console.error("WebSocket error:", error);
		};

		// Connection closed
		this.socket.onclose = (event) => {
			console.warn("WebSocket closed", event);
			if (!event.wasClean) {
				this.reconnect(); // Attempt to reconnect on an unclean close
			}
		};
	}

	// Reconnect logic
	private reconnect() {
		if (this._retryCount < this._maxRetries) {
			this._retryCount++;
			console.log(`Retrying connection in ${this.reconnectInterval / 1000} seconds...`);
			setTimeout(() => {
				this.connect();
			}, this.reconnectInterval);
		} else {
			console.error("Max retries reached. Could not reconnect.");
		}
	}

	// Send a message to the server
	sendMessage(message: string) {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(message);
		} else {
			console.warn("WebSocket not open. Cannot send message.");
		}
	}

	// Close the WebSocket connection
	close() {
		if (this.socket) {
			this.socket.close();
		}
	}

	private handleMessage(data: string) {
		try {
			const response = JSON.parse(data);

			if (response.type === "error") throw new Error("error handling message");
			if (response.type === "success") {
				const allStorylines: Storyline[] = response.storylines;
				storylines.set(allStorylines);

				// const ongoingStoryline = allStorylines
				// 	.filter((storyline) => storyline.status === "ongoing")
				// 	.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())[0]; // Get the latest one

				// currentStoryline.set(ongoingStoryline);
				// console.log("current: ", get(currentStoryline));

				wsConnected.set(true);
			}
		} catch (e) {
			console.error(e);
		}
	}

	get retryCount() {
		return this._retryCount;
	}

	get maxRetries() {
		return this._maxRetries;
	}
}
