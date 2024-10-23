import { z } from "zod";

const envSchema = z.object({
	API_URL: z.string().url(),

	// JWT secret should not be empty
	JWT_SECRET: z.string().min(1, "JWT secret cannot be empty"),

	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string().min(1),

	// Token expiration times should be numeric strings
	ACCESS_TOKEN_EXPIRATION: z.string(),
	REFRESH_TOKEN_EXPIRATION: z
		.string()
		.regex(
			/^\d+$/,
			"Refresh token expiration must be a numeric string in seconds",
		),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
	console.error("Invalid environment variables:", env.error.format());
	process.exit(1); // Exit if the validation fails
}

export default env.data;
