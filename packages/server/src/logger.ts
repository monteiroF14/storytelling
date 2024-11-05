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
		const trace = getCallTrace();
		const currentLog = `[${formattedDate}] [${type.toUpperCase()}] ${userPart}- ${message}${trace}`;

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

function getCallTrace(): string {
	const stack = new Error().stack; // Capture the stack trace
	if (!stack) return ""; // If there's no stack, return empty string

	// Split the stack into lines
	const lines = stack.split("\n");

	// The first line is the error message, the second line is from `getCallTrace`,
	// and the third line is the caller of the logger
	const callerLine = lines[2] || ""; // This is where the logger was called from

	// Use a regular expression to capture the function name and path
	const match = callerLine.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
	if (match) {
		return `\nCalled from ${match[1]} in ${match[2]}:${match[3]}:${match[4]}`;
	}

	return "\nCalled from an unknown location"; // Fallback if parsing fails
}
