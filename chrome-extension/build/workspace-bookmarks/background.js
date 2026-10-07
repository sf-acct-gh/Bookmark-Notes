importScripts('config.js');

const ALARM_NAME = 'refresh-bookmarks';

chrome.runtime.onInstalled.addListener(() => {
	chrome.alarms.create(ALARM_NAME, { periodInMinutes: REFRESH_PERIOD_MINUTES });
	refreshBookmarks();
});

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === ALARM_NAME) refreshBookmarks();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message?.type === 'refresh') {
		refreshBookmarks().then(sendResponse);
		return true; // keep the message channel open for the async response
	}
	return false;
});

async function refreshBookmarks() {
	const attemptedAt = Date.now();
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
		let response;
		try {
			response = await fetch(BOOKMARKS_URL, { signal: controller.signal, cache: 'no-store' });
		} finally {
			clearTimeout(timeout);
		}

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const raw = await response.json();
		const validated = validateBookmarksData(raw);
		if (!validated) {
			throw new Error('Malformed bookmarks document (no usable data found)');
		}

		await chrome.storage.local.set({
			bookmarksData: validated,
			lastUpdated: attemptedAt,
			lastFetchAttempt: attemptedAt,
			lastFetchError: null
		});
		return { ok: true };
	} catch (err) {
		// Keep whatever is already cached — never let a failed/partial refresh
		// destroy good data.
		await chrome.storage.local.set({
			lastFetchAttempt: attemptedAt,
			lastFetchError: err instanceof Error ? err.message : String(err)
		});
		return { ok: false, error: err instanceof Error ? err.message : String(err) };
	}
}

// Validates the top-level shape, then filters out (rather than rejecting the
// whole document for) individual malformed workspaces/sections/bookmarks.
// Returns null only when nothing usable could be salvaged at all.
function validateBookmarksData(raw) {
	if (!raw || typeof raw !== 'object' || !Array.isArray(raw.workspaces)) {
		return null;
	}

	const workspaces = [];
	for (const ws of raw.workspaces) {
		if (!ws || typeof ws !== 'object') continue;
		if (typeof ws.name !== 'string' || !ws.name.trim()) continue;
		if (!Array.isArray(ws.sections)) continue;

		const sections = [];
		for (const section of ws.sections) {
			if (!section || typeof section !== 'object') continue;
			if (typeof section.name !== 'string' || !section.name.trim()) continue;
			if (!Array.isArray(section.bookmarks)) continue;

			const bookmarks = [];
			for (const bookmark of section.bookmarks) {
				if (!bookmark || typeof bookmark !== 'object') continue;
				if (typeof bookmark.name !== 'string' || !bookmark.name.trim()) continue;
				if (typeof bookmark.url !== 'string' || !bookmark.url.trim()) continue;
				bookmarks.push({
					id: typeof bookmark.id === 'string' ? bookmark.id : undefined,
					name: bookmark.name,
					url: bookmark.url,
					notes: typeof bookmark.notes === 'string' ? bookmark.notes : ''
				});
			}

			sections.push({
				id: typeof section.id === 'string' ? section.id : undefined,
				name: section.name,
				bookmarks
			});
		}

		workspaces.push({
			id: typeof ws.id === 'string' ? ws.id : undefined,
			name: ws.name,
			sections
		});
	}

	if (workspaces.length === 0) return null;
	return { workspaces };
}
