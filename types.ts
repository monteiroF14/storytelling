// Represents a choice made by the user at each step
export interface Choice {
	id: number; // Unique ID for the choice
	text: string; // The text displayed for the choice (e.g., "Go left", "Go right")
	nextStep: number; // The step number to go to if this choice is selected
}

// Represents each step in the storyline
export interface Step {
	stepNumber: number; // Step number (e.g., 1, 2, etc.)
	description: string; // Text describing the plot at this step
	choices: Choice[]; // Two possible choices to continue the story
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
