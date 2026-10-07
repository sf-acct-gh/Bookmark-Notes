init();

async function init() {
	const params = new URLSearchParams(location.search);
	const id = params.get('id');

	document.getElementById('close-btn').addEventListener('click', () => window.close());

	const stored = await chrome.storage.local.get(['bookmarksData']);
	const workspaces = stored.bookmarksData?.workspaces ?? [];

	const bookmark = findBookmarkById(workspaces, id);
	if (!bookmark) {
		document.getElementById('name').textContent = 'Bookmark not found';
		document.getElementById('url').textContent = 'It may have been removed since the last refresh.';
		return;
	}

	document.getElementById('name').textContent = bookmark.name;

	const urlEl = document.getElementById('url');
	if (isSafeUrl(bookmark.url)) {
		const link = document.createElement('a');
		link.href = bookmark.url;
		link.textContent = bookmark.url;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		urlEl.appendChild(link);
	} else {
		urlEl.textContent = bookmark.url;
	}

	if (bookmark.notes && bookmark.notes.trim()) {
		document.getElementById('notes-label').hidden = false;
		const notesEl = document.getElementById('notes');
		notesEl.hidden = false;
		notesEl.textContent = bookmark.notes;
	}
}

function findBookmarkById(workspaces, id) {
	if (!id) return null;
	for (const workspace of workspaces) {
		for (const section of workspace.sections) {
			const bookmark = section.bookmarks.find((b) => b.id === id);
			if (bookmark) return bookmark;
		}
	}
	return null;
}
