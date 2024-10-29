import path from "node:path";

export async function logger({
	userId,
	message,
	type,
}: {
	userId?: string;
	message: string;
	type: "DEBUG" | "ERROR" | "WARN" | "INFO" | "FATAL";
}) {
	const LOG_PATH = path.join(__dirname, "../logs/server.log");

	const formattedDate = new Date()
		.toISOString()
		.replace("T", " ")
		.substring(0, 19);

	try {
		// Attempt to read existing logs
		const logs = await Bun.file(LOG_PATH).text();

		const userPart = userId ? `[UserID: ${userId}]` : "";
		const currentLog = `[${formattedDate}] [${type.toUpperCase()}] ${userPart}- ${message}`;

		// Append the new log with a newline
		await Bun.write(LOG_PATH, `${logs}\n${currentLog}`);
	} catch (e) {
		if (e instanceof Error && e.message.includes("ENOENT")) {
			// If the file doesn't exist, create it with the log entry
			const currentLog = `${type} - ${formattedDate} - ${message}`; // Format log entry
			await Bun.write(LOG_PATH, currentLog);
		} else {
			console.error("Failed to write logs:", e);
		}
	}
}
