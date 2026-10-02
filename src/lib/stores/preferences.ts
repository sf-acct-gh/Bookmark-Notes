import { writable } from 'svelte/store';

export interface SearchFields {
	name: boolean;
	url: boolean;
	notes: boolean;
}

export type LinkTarget = 'same' | 'new';
export type ColorScheme = 'light' | 'dark';

export interface Preferences {
	searchFields: SearchFields;
	linkTarget: LinkTarget;
	colorScheme: ColorScheme;
}

const STORAGE_KEY = 'bookmark-notes:preferences';

const defaults: Preferences = {
	searchFields: { name: true, url: true, notes: false },
	linkTarget: 'same',
	colorScheme: 'light'
};

function load(): Preferences {
	if (typeof window === 'undefined') return defaults;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaults;
		const parsed = JSON.parse(raw);
		return {
			searchFields: { ...defaults.searchFields, ...parsed.searchFields },
			linkTarget: parsed.linkTarget === 'new' ? 'new' : 'same',
			colorScheme: parsed.colorScheme === 'dark' ? 'dark' : 'light'
		};
	} catch {
		return defaults;
	}
}

export const preferences = writable<Preferences>(load());

if (typeof window !== 'undefined') {
	preferences.subscribe((value) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	});
}
