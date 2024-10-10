// Represents each step in the storyline
export interface Step {
	description: string; // Text describing the plot at this step
	choice: string;
}

export interface GeneratedStep {
	description: string;
	choices: string[];
}

export interface CreateStoryline {
	title: string;
	userId: number;
}

export interface Storyline extends CreateStoryline {
	id: number;
	steps: Step[];
	totalSteps: number | null;
	status: string;
	created: number;
	updated: number;
}

// Represents a user playing the game
export interface User {
	id: number; // User's unique ID
	email: string; // Email
	username: string; // Username
	currentStorylineId: number | null; // The ID of the currently active storyline (if any)
	currentStorylineStep: number | null; // The current step the user is on in the active storyline
	completedStorylines: string | number[] | null; // Array of completed storyline IDs
	refreshToken: string | null;
}

export type UserRole = "APPLICATION_USER" | "SUPER_USER";

export interface JwtPayload {
	id: string;
	email: string;
	role: UserRole;
	expiration?: string;
}
