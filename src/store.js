import { writable, derived } from "svelte/store";

export const isAuthenticated = writable(false);
export const user = writable({});
export const popUpOpen = writable(false);
export const error = writable();
