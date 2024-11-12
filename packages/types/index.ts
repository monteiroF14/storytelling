import { z } from "zod";

export const StorylineChapterSchema = z.object({
	description: z.string(),
	choice: z.object({
		text: z.string(),
		synopsis: z.string(),
	}),
});
export type StorylineChapter = z.infer<typeof StorylineChapterSchema>;

export const GeneratedStorylineChapter = z.object({
	description: z.string(),
	choices: z.array(
		z.object({
			text: z.string(),
			synopsis: z.string(),
		}),
	),
});
export type GeneratedStorylineChapter = z.infer<
	typeof GeneratedStorylineChapter
>;

export const CreateStorylineSchema = z.object({
	title: z.string().min(1, { message: "Title is required" }),
	totalSteps: z
		.number()
		.min(1, { message: "Total steps must be a positive number" }),
	userId: z.number().positive({ message: "User ID is required" }),
});
export type CreateStoryline = z.infer<typeof CreateStorylineSchema>;

export const StorylineSchema = z.object({
	id: z.number(),
	title: z.string(),
	totalSteps: z.number().nullable(),
	userId: z.number(),
	status: z.enum(["ongoing", "completed"]),
	visibility: z.enum(["public", "private"]),
	chapters: z.array(StorylineChapterSchema).default([]),
	created: z.number(),
	updated: z.number(),
});
export type Storyline = z.infer<typeof StorylineSchema>;

export type GenerateStorylineChapter = Pick<Storyline, "title" | "chapters">;

export const UpdateVisibilitySchema = StorylineSchema.pick({
	visibility: true,
});
export const UpdateChaptersSchema = StorylineSchema.pick({ chapters: true });
export const UpdateStatusSchema = StorylineSchema.pick({ status: true });

// Represents a user playing the game
const UserSchema = z.object({
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
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
