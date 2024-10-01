// Represents each step in the storyline
export interface Step {
	description: string; // Text describing the plot at this step
	choice: string;
}

export interface GeneratedStep {
	description: string;
	choices: string[];
}

// Represents a storyline with steps, each offering two choices
export interface Storyline {
	id: number; // Unique ID for each storyline
	title: string; // Storyline title or name
	steps: Step[]; // Array of steps, each with choices
	totalSteps: number | null; // Total number of steps in the storyline (e.g., 12)
	status: string; // Storyline status (e.g., completed, ongoing, abandoned)
	created: string; // Creation date of the storyline
	updated: string; // Last update date of the storyline
}

// Represents a user playing the game
export interface User {
	id: number; // User's unique ID
	email: string; // Email
	username: string; // Username
	currentStorylineId: number | null; // The ID of the currently active storyline (if any)
	currentStorylineStep: number | null; // The current step the user is on in the active storyline
	completedStorylines: number[]; // Array of completed storyline IDs
}
