const LOG_DIR = "logs";

export async function logger({
	userId,
	message,
	type,
}: {
	userId?: string;
	message: string;
	type: "SUCCESS" | "ERROR" | "WARNING";
}) {
	const LOG_PATH = `${LOG_DIR}/storytelling.log`;

	const now = new Date();
	const formattedDate = now.toLocaleString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});

	try {
		// Attempt to read existing logs
		const logs = await Bun.file(LOG_PATH).text();
		const currentLog = [type, formattedDate, message].join(" - ");

		// Append the new log with a newline
		await Bun.write(LOG_PATH, logs + "\n" + currentLog);
	} catch (e) {
		// If the file doesn't exist, create it with the log entry
		// @ts-expect-error aaa
		if (e.code === "ENOENT") {
			await Bun.write(LOG_PATH, message);
		} else {
			console.error("Failed to write logs:", e);
		}
	}
}
