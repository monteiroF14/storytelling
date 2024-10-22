import { z } from "zod";

export const StepSchema = z.object({
	description: z.string(), // Text describing the plot at this step
	choice: z.string(),
});
export type Step = z.infer<typeof StepSchema>;

export const GeneratedStepSchema = z.object({
	description: z.string(),
	choices: z.array(z.string()),
});
export type GeneratedStep = z.infer<typeof GeneratedStepSchema>;

export const CreateStorylineSchema = z.object({
	title: z.string(),
	totalSteps: z.number().nullable(),
});
export type CreateStoryline = z.infer<typeof CreateStorylineSchema>;

const StorylineSchema = z.object({
	id: z.number(),
	title: z.string(),
	totalSteps: z.number().nullable(),
	userId: z.number(),
	status: z.string(),
	steps: z.array(StepSchema).default([]),
	created: z.number(),
	updated: z.number(),
});
export type Storyline = z.infer<typeof StorylineSchema>;

// Represents a user playing the game
export const UserSchema = z.object({
	id: z.number(),
	email: z.string().email(),
	username: z.string(),
	picture: z.string().nullable(),
	refreshToken: z.string().nullable(),
});
export type User = z.infer<typeof UserSchema>;

export type UserRole = "APPLICATION_USER" | "SUPER_USER";

export const JwtPayloadSchema = z.object({
	id: z.number(),
	email: z.string().email(),
	role: z.enum(["APPLICATION_USER", "SUPER_USER"]),
	expiration: z.string().optional(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

export const WebSocketMessagePayloadSchema = z.object({
	messageType: z.enum(["create", "fetch", "edit", "retrieve"]),
	data: z.object({
		userId: z.number().positive({ message: "Invalid user ID" }),
		storyline: z.union([StorylineSchema, CreateStorylineSchema]).optional(),
	}),
});
export type WebSocketMessagePayload = z.infer<typeof WebSocketMessagePayloadSchema>;

export const WebSocketMessageResponseSchema = z.object({
	type: z.enum(["error", "success"]),
	storylines: z.array(StorylineSchema).optional(),
	storyline: StorylineSchema.optional(),
});

export type WebSocketMessageResponse = z.infer<typeof WebSocketMessageResponseSchema>;
