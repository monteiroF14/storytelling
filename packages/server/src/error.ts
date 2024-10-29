export class ValidationError extends Error {
	public readonly status: number;
	public readonly details?: string[];

	constructor(message: string, status = 400, details?: string[]) {
		super(message);
		this.name = "ValidationError";
		this.status = status;
		this.details = details;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}
