import { storylines } from "$lib/stores";
import type {
	Storyline,
	WebSocketMessagePayload,
	WebSocketMessageResponse,
} from "@storytelling/types";

export class WebSocketClient {
	private socket: WebSocket | null = null;
	private url: string;
	private reconnectInterval: number;
	private _maxRetries: number;
	private _retryCount = 0;
	private _isConnected = false;

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
			this._isConnected = true;
		};

		// Message received from server
		this.socket.onmessage = (event) => {
			// console.log("Message from server:", event.data);
			this.handleMessage(event.data); // Custom method for handling the message
		};

		// Handle errors
		this.socket.onerror = (error) => {
			console.error("WebSocket error:", error);
			this._isConnected = false;
		};

		// Connection closed
		this.socket.onclose = (event) => {
			console.warn("WebSocket closed", event);
			this._isConnected = false;
			if (!event.wasClean) {
				this.reconnect(); // Attempt to reconnect on an unclean close
			}
		};
	}

	waitForConnection(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this._isConnected) {
				resolve(); // Immediately resolve if already connected
			}

			const timeout = setTimeout(() => {
				reject(new Error("WebSocket connection timed out"));
			}, 10000); // Timeout duration can be adjusted

			const interval = setInterval(() => {
				if (this._isConnected) {
					clearTimeout(timeout);
					clearInterval(interval);
					resolve();
				}
			}, 100);

			if (this.socket) {
				this.socket.onclose = () => {
					clearTimeout(timeout);
					clearInterval(interval);
					reject(new Error("WebSocket connection was closed"));
				};
			}
		});
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
	sendMessage(message: WebSocketMessagePayload): Promise<WebSocketMessageResponse> {
		return new Promise((resolve, reject) => {
			if (this.socket && this.socket.readyState === WebSocket.OPEN) {
				this.socket.send(JSON.stringify(message));

				const handleResponse = (event: MessageEvent) => {
					const response = JSON.parse(event.data);
					if (response.type === "success") {
						resolve(response as WebSocketMessageResponse);
					} else if (response.type === "error") {
						reject(new Error(response.message));
					}
					// Remove this event listener after handling the message
					this.socket?.removeEventListener("message", handleResponse);
				};

				this.socket.addEventListener("message", handleResponse);
			} else {
				reject(new Error("WebSocket not open. Cannot send message."));
			}
		});
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
				if (response.storylines) {
					const allStorylines: Storyline[] = response.storylines;
					storylines.set(allStorylines);
				} else if (response.storyline) {
					return;
				}
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

	get isConnected() {
		return this._isConnected;
	}
}
