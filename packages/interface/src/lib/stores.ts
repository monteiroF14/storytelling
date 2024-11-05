import type { Storyline } from "@storytelling/types";
import { writable } from "svelte/store";

export const storylineTitleInput = writable("");

export const storylines = writable<Storyline[]>([]);
export const currentStoryline = writable<Storyline>();

export const isLoading = writable(true);
