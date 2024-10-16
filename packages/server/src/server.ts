import chalk from "chalk";
import { app } from "./api";
import { logger } from "./logger";
import { storylineService } from "./services/storyline-service";
import type { Storyline } from "@storytelling/types";
import { authService } from "./services/auth-service";

// melhorar o sistema de logs

const server = Bun.serve<{ authToken: string }>({
	async fetch(req, server) {
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
		async open(ws) {
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
			// handles the logic for the storyline
			// handles what comes from the client
			if (Buffer.isBuffer(message)) {
				console.log("Received binary data. Closing WebSocket.");
				ws.close();
				return;
			}

			try {
				const { userId, storyline }: { userId: number; storyline: Storyline } = JSON.parse(message);

				if ((!userId && !storyline) || storyline === null) {
					ws.send(JSON.stringify({ type: "error", message: "Invalid properties passed" }));
					return;
				}

				const isFirstRequest = userId && !storyline;

				// ! initial request
				if (isFirstRequest) {
					const allStorylines = await storylineService.getUserStorylines({ userId });
					ws.send(JSON.stringify({ type: "success", storylines: allStorylines }));
					return;
				}

				const doesStorylineExist = await storylineService.read({ storylineId: storyline.id });

				if (doesStorylineExist) {
					const updatedStoryline = await storylineService.update({ storyline });
					if (!updatedStoryline) {
						ws.send(JSON.stringify({ type: "error", message: "Storyline update failed" }));
						return;
					}
				} else {
					const newStoryline = await storylineService.create(storyline);
					if (!newStoryline) {
						ws.send(JSON.stringify({ type: "error", message: "Storyline create failed" }));
						return;
					}
				}

				const allStorylines = await storylineService.getUserStorylines({ userId });
				ws.send(JSON.stringify({ type: "success", storylines: allStorylines }));
			} catch (e) {
				const message = e instanceof Error ? e.message : "Invalid JSON format";

				logger({
					message,
					type: "ERROR",
				});

				ws.send(JSON.stringify({ type: "error", message }));
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
