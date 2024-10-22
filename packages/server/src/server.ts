import chalk from "chalk";
import { app } from "./api";
import { logger } from "./logger";
import { storylineService } from "./services/storyline-service";
import {
	type CreateStoryline,
	type Storyline,
	WebSocketMessagePayloadSchema,
} from "@storytelling/types";
import { authService } from "./services/auth-service";
import { z } from "zod";

// melhorar o sistema de logs

const server = Bun.serve<{ authToken: string }>({
	fetch(req, server) {
		const token = new URL(req.url).searchParams.get("token");

		const success = server.upgrade(req, {
			data: {
				authToken: token,
			},
		});

		if (success) {
			return undefined;
		}

		// handle hono HTTP request
		return app.fetch(req);
	},
	websocket: {
		open(ws) {
			if (!ws.data.authToken || !authService.validateToken(ws.data.authToken)) {
				ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
				ws.close(1008, "Unauthorized");
			}

			// gets executed when the connection gets established
			console.log("\n");
			console.log(chalk.bgYellow("WebSocket successfully established"));
			logger({
				message: "WebSocket connection successfully established",
				type: "INFO",
			});
		},
		close() {
			// gets executed when the connection is closed
			console.log("\n");
			console.log(chalk.bgRedBright("WebSocket closed"));
			logger({
				message: "WebSocket connection closed",
				type: "INFO",
			});
		},
		async message(ws, message) {
			if (Buffer.isBuffer(message)) {
				console.log("Received binary data. Closing WebSocket.");
				ws.close();
				return;
			}

			try {
				const {
					messageType,
					data: { storyline, userId },
				} = WebSocketMessagePayloadSchema.parse(JSON.parse(message));

				if (messageType !== "fetch" && !storyline) {
					throw new Error("Tried to mutate storyline data without a storyline");
				}

				const isStoryline = (storyline: Storyline | CreateStoryline): storyline is Storyline => {
					return (storyline as Storyline).id !== undefined;
				};

				let assertedStoryline: Storyline | CreateStoryline | undefined;

				if (messageType !== "fetch") {
					if (!storyline) {
						throw new Error("Tried to mutate storyline data without a storyline");
					}

					assertedStoryline = storyline;

					if (messageType === "create") {
						if (!isStoryline(storyline)) {
							assertedStoryline = assertedStoryline as CreateStoryline;
						}
					} else if (isStoryline(assertedStoryline)) {
						console.log("This is a full storyline", assertedStoryline);
					} else {
						throw new Error("Invalid storyline type");
					}
				}

				switch (messageType) {
					case "fetch": {
						const allStorylines = await storylineService.getUserStorylines({
							userId,
						});
						ws.send(JSON.stringify({ type: "success", storylines: allStorylines }));
						break;
					}
					case "retrieve": {
						if (!assertedStoryline || !isStoryline(assertedStoryline)) {
							throw new Error("Storyline ID is required for retrieve");
						}
						const story = await storylineService.read(assertedStoryline.id);
						ws.send(JSON.stringify({ type: "success", storyline: story }));
						break;
					}
					case "create": {
						if (!assertedStoryline) {
							throw new Error("Storyline and title are required for create");
						}
						const newStoryline = await storylineService.create({
							...assertedStoryline,
							userId,
						});
						ws.send(JSON.stringify({ type: "success", storyline: newStoryline }));
						break;
					}
					case "edit": {
						if (!assertedStoryline || !isStoryline(assertedStoryline)) {
							throw new Error("Storyline ID is required for edit");
						}
						const updatedStoryline = await storylineService.update({
							storyline: assertedStoryline,
						});
						ws.send(JSON.stringify({ type: "success", storyline: updatedStoryline }));
						break;
					}
					default: {
						throw new Error("Invalid message type received");
					}
				}
			} catch (e) {
				if (e instanceof z.ZodError) {
					const errorDetails = e.errors.map((err) => ({
						code: err.code,
						message: err.message,
						path: err.path,
					}));
					logger({
						message: `Zod validation error, ${errorDetails}`,
						type: "ERROR",
					});
					ws.send(
						JSON.stringify({
							type: "error",
							code: "ZOD_ERROR",
							errors: errorDetails,
						})
					);
				} else {
					const errorMessage = e instanceof Error ? e.message : "An error occurred";
					logger({ message: errorMessage, type: "ERROR" });
					ws.send(JSON.stringify({ type: "error", message: errorMessage }));
				}
			}
		},
	},
});

console.log(`🔷 server is running in ${server.url.href} 🔷`);
logger({
	message: "server is running in " + server.url.href,
	type: "INFO",
});

console.log(`🔶 websocket is ready to accept connections 🔶`);
logger({
	message: "websocket is ready to accept connections",
	type: "INFO",
});
