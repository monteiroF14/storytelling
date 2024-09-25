import chalk from "chalk";
import { Hono } from "hono";
import { logger } from "./logger";
import { storylineService } from "./services/storyline-service";
import type { Storyline } from "./types";

const app = new Hono();

// fazer o front e mandar os dados do window AI através de WS
// escrever o rumo da história na db

// fazer o serviço do user

// melhorar o sistema de logs

app.get("/storyline/:id", async (c) => {
	const storylineId = c.req.param("id");
	const data = await storylineService.read({ storylineId: +storylineId });

	if (!data) {
		logger({
			message: "No storyline found with ID: " + storylineId,
			type: "ERROR",
		});
		return c.json({ message: "No storyline with this ID found", status: 404 });
	}

	return c.json(data, 200);
});

const server = Bun.serve<{ authToken: string }>({
	async fetch(req, server) {
		const success = server.upgrade(req);

		if (success) {
			return undefined;
		}

		// handle hono HTTP request
		return app.fetch(req);
	},
	websocket: {
		open() {
			// gets executed when the connection gets established
			console.log("\n");
			console.log(chalk.bgYellow("WebSocket successfully established"));
			logger({
				message: "WebSocket connection successfully established",
				type: "SUCCESS",
			});
		},
		close() {
			// gets executed when the connection is closed
			console.log("\n");
			console.log(chalk.bgRedBright("WebSocket closed"));
			logger({
				message: "WebSocket connection closed",
				type: "SUCCESS",
			});
		},
		async message(ws, message) {
			// handles what comes from the client
			if (Buffer.isBuffer(message)) {
				console.log("Received binary data. Closing WebSocket.");
				ws.close();
				return;
			}

			try {
				const storyline: Storyline = JSON.parse(message);
				const doesStorylineExist = await storylineService.read({ storylineId: storyline.id });

				if (doesStorylineExist) {
					await storylineService.update({ storylineId: storyline.id, steps: storyline.steps });
				} else {
					await storylineService.create(storyline);
				}

				ws.send(JSON.stringify({ type: "response", message: "success" }));
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
console.log(`🔶 websocket is ready to accept connections 🔶`);
