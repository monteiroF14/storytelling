# Dynamic AI-Generated Storytelling Platform

## Overview

An AI-driven interactive storytelling platform where users engage in dynamic,
RPG-like text adventures. The platform generates a unique storyline based on
user choices, with real-time AI adaptations shaping the narrative and
determining the ending based on the decisions made.

## Key Features

- **AI Integration**: AI adapts the storyline in real-time, generating plot
  points and branching narratives based on user input.
- **User Input**: Each story progresses through a series of choices, with user
  decisions influencing the direction and final outcome.
- **Storyline Structure**:
  - 12-step progression for each storyline.
  - Users select between two options at each step.
  - Choices directly affect the ending.
  - Incomplete storylines can be resumed, or new ones can be started.

## Database

- Tracks user progression and character details.
- Stores branching storylines and decision trees for resuming or creating new
  stories.

## WebSockets

- Provides real-time updates for new story developments and user choices.

## Logging

- Monitors user decisions, popular storylines, and preferences for future
  improvements.
- Logs are cleared at the end of each user session.

## Technical Stack

- **Bun**: Backend for serving API.
- **SQLite3**: Database for storing user progress and story details.
- **Hono**: Lightweight framework to handle routes.

## Links

> https://flowbite-svelte.com/icons/outline-icons

## Getting Started

1. **Clone the repository**:

   ```bash
   git clone https://github.com/monteiroF14/storytelling 
   cd storytelling 
   ```

2. **Run docker container**:

   ```bash
    docker compose up --build 
   ```
