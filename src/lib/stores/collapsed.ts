import { writable } from 'svelte/store';

const STORAGE_KEY = 'bookmark-notes:collapsed-sections';

function load(): Set<string> {
	if (typeof window === 'undefined') return new Set();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return new Set();
		return new Set(JSON.parse(raw));
	} catch {
		return new Set();
	}
}

function createCollapsedStore() {
	const { subscribe, update, set } = writable<Set<string>>(load());

	function persist(value: Set<string>) {
		if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify([...value]));
	}

	return {
		subscribe,
		toggle(id: string) {
			update((current) => {
				const next = new Set(current);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				persist(next);
				return next;
			});
		},
		setAll(ids: string[], collapsed: boolean) {
			const next = collapsed ? new Set(ids) : new Set<string>();
			persist(next);
			set(next);
		}
	};
}

export const collapsedSections = createCollapsedStore();
