import { writable } from 'svelte/store';

const STORAGE_KEY = 'bookmark-notes:active-workspace';

function load(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(STORAGE_KEY);
}

export const activeWorkspaceId = writable<string | null>(load());

if (typeof window !== 'undefined') {
	activeWorkspaceId.subscribe((value) => {
		if (value) {
			localStorage.setItem(STORAGE_KEY, value);
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	});
}
