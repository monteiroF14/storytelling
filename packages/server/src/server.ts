import chalk from "chalk";
import { app } from "./api";
import { logger } from "./logger";
import { storylineService } from "./services/storyline-service";

// fazer o front e mandar os dados do window AI através de WS
// escrever o rumo da história na db

// fazer o serviço do user

// melhorar o sistema de logs

// user é criado no userController ao chamar a rota /auth/callback
// storyline é criado no front é salvo na DB ao chamar a WS
// todas as alterações feitas no front é feito no back simultaneamente

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
		async open(ws) {
			// gets executed when the connection gets established
			console.log("\n");
			console.log(chalk.bgYellow("WebSocket successfully established"));
			logger({
				message: "WebSocket connection successfully established",
				type: "INFO",
			});

			const userStorylines = await storylineService.getUserStorylines({ userId: 1 });
			console.log("storylines from user 1:", userStorylines);

			ws.send(JSON.stringify({ type: "success", storylines: userStorylines }));
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
			console.log("ws - got: ", message);

			// handles what comes from the client
			if (Buffer.isBuffer(message)) {
				console.log("Received binary data. Closing WebSocket.");
				ws.close();
				return;
			}

			try {
				const { userId, storyline } = JSON.parse(message);
				if (!userId || !storyline)
					ws.send(JSON.stringify({ type: "error", message: "Invalid properties passed" }));

				console.log("got user id: ", userId);

				const doesStorylineExist = await storylineService.read({ storylineId: storyline.id });

				if (doesStorylineExist) {
					console.log("updating storyline ", storyline.id, storyline);
					const updatedStoryline = await storylineService.update({ storyline });
					console.log("new: ", updatedStoryline);
					if (!updatedStoryline) return;

					if (updatedStoryline.status === "abandoned") {
						await storylineService.create({
							title: "New storyline",
							userId,
						});
					}
				} else {
					console.log("creating storyline");
					await storylineService.create(storyline);
				}

				const allStorylines = await storylineService.getUserStorylines({ userId: 1 });
				console.log("returning: ", allStorylines);

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
