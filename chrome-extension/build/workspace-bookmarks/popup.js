const backBtn = document.getElementById('back-btn');
const refreshBtn = document.getElementById('refresh-btn');
const breadcrumbEl = document.getElementById('breadcrumb');
const statusEl = document.getElementById('status');
const listEl = document.getElementById('list');
const footerEl = document.getElementById('footer');

let workspaces = [];
let lastUpdated = null;
let lastFetchError = null;

// { level: 'workspaces' } | { level: 'sections', workspaceId } | { level: 'bookmarks', workspaceId, sectionId }
let view = { level: 'workspaces' };

init();

async function init() {
	await loadFromStorage();
	render();
}

async function loadFromStorage() {
	const stored = await chrome.storage.local.get(['bookmarksData', 'lastUpdated', 'lastFetchError']);
	workspaces = stored.bookmarksData?.workspaces ?? [];
	lastUpdated = typeof stored.lastUpdated === 'number' ? stored.lastUpdated : null;
	lastFetchError = stored.lastFetchError ?? null;
}

function findWorkspace(id) {
	return workspaces.find((w) => w.id === id);
}

function findSection(workspace, id) {
	return workspace?.sections.find((s) => s.id === id);
}

backBtn.addEventListener('click', () => {
	if (view.level === 'bookmarks') {
		view = { level: 'sections', workspaceId: view.workspaceId };
	} else if (view.level === 'sections') {
		view = { level: 'workspaces' };
	}
	render();
});

refreshBtn.addEventListener('click', async () => {
	refreshBtn.disabled = true;
	showStatus('Refreshing…');
	const result = await chrome.runtime.sendMessage({ type: 'refresh' });
	await loadFromStorage();

	// Try to keep the user's place if it still exists after the refresh.
	if (view.level === 'sections' && !findWorkspace(view.workspaceId)) {
		view = { level: 'workspaces' };
	} else if (view.level === 'bookmarks') {
		const ws = findWorkspace(view.workspaceId);
		if (!ws) {
			view = { level: 'workspaces' };
		} else if (!findSection(ws, view.sectionId)) {
			view = { level: 'sections', workspaceId: ws.id };
		}
	}

	refreshBtn.disabled = false;
	if (result?.ok === false) {
		showStatus(`Refresh failed: ${result.error ?? 'unknown error'} (showing cached data)`);
	} else {
		hideStatus();
	}
	render();
});

function showStatus(message) {
	statusEl.textContent = message;
	statusEl.hidden = false;
}

function hideStatus() {
	statusEl.hidden = true;
	statusEl.textContent = '';
}

function clearList() {
	listEl.replaceChildren();
}

function renderEmpty(message) {
	const p = document.createElement('p');
	p.className = 'empty';
	p.textContent = message;
	listEl.appendChild(p);
}

function makeRow({ label, arrow, onClick, infoOnClick, title }) {
	const row = document.createElement('div');
	row.className = 'row';

	const main = document.createElement('button');
	main.type = 'button';
	main.className = 'row-main';
	main.textContent = label;
	if (title) main.title = title;
	main.addEventListener('click', onClick);
	row.appendChild(main);

	if (arrow) {
		const arrowEl = document.createElement('span');
		arrowEl.className = 'row-arrow';
		arrowEl.textContent = '›';
		arrowEl.setAttribute('aria-hidden', 'true');
		row.appendChild(arrowEl);
	}

	if (infoOnClick) {
		const infoBtn = document.createElement('button');
		infoBtn.type = 'button';
		infoBtn.className = 'row-info-btn';
		infoBtn.title = 'Details';
		infoBtn.setAttribute('aria-label', 'Bookmark details');
		infoBtn.textContent = 'ⓘ';
		infoBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			infoOnClick();
		});
		row.appendChild(infoBtn);
	}

	return row;
}

function render() {
	clearList();
	hideStatus();

	if (workspaces.length === 0) {
		backBtn.hidden = true;
		breadcrumbEl.textContent = 'Workspaces';
		if (lastFetchError) {
			renderEmpty('Bookmarks are not available yet. The bookmark list could not be downloaded.');
		} else {
			renderEmpty('Loading bookmarks…');
		}
		renderFooter();
		return;
	}

	if (view.level === 'workspaces') {
		renderWorkspaces();
	} else if (view.level === 'sections') {
		renderSections();
	} else {
		renderBookmarks();
	}
	renderFooter();
}

function renderWorkspaces() {
	backBtn.hidden = true;
	breadcrumbEl.textContent = 'Workspaces';

	if (workspaces.length === 0) {
		renderEmpty('No workspaces yet.');
		return;
	}

	for (const workspace of workspaces) {
		const row = makeRow({
			label: workspace.name,
			arrow: true,
			onClick: () => {
				view = { level: 'sections', workspaceId: workspace.id };
				render();
			}
		});
		listEl.appendChild(row);
	}
}

function renderSections() {
	const workspace = findWorkspace(view.workspaceId);
	if (!workspace) {
		view = { level: 'workspaces' };
		render();
		return;
	}

	backBtn.hidden = false;
	breadcrumbEl.textContent = `Workspaces / ${workspace.name}`;

	if (workspace.sections.length === 0) {
		renderEmpty('No sections in this workspace.');
		return;
	}

	for (const section of workspace.sections) {
		const row = makeRow({
			label: section.name,
			arrow: true,
			onClick: () => {
				view = { level: 'bookmarks', workspaceId: workspace.id, sectionId: section.id };
				render();
			}
		});
		listEl.appendChild(row);
	}
}

function renderBookmarks() {
	const workspace = findWorkspace(view.workspaceId);
	const section = findSection(workspace, view.sectionId);
	if (!workspace || !section) {
		view = workspace ? { level: 'sections', workspaceId: workspace.id } : { level: 'workspaces' };
		render();
		return;
	}

	backBtn.hidden = false;
	breadcrumbEl.textContent = `Workspaces / ${workspace.name} / ${section.name}`;

	if (section.bookmarks.length === 0) {
		renderEmpty('No bookmarks in this section.');
		return;
	}

	for (const bookmark of section.bookmarks) {
		const tooltipParts = [bookmark.url];
		if (bookmark.notes && bookmark.notes.trim()) tooltipParts.push(bookmark.notes.trim());

		const row = makeRow({
			label: bookmark.name,
			title: tooltipParts.join('\n'),
			onClick: () => openBookmark(bookmark),
			infoOnClick: bookmark.id ? () => openDetails(bookmark.id) : undefined
		});
		listEl.appendChild(row);
	}
}

async function openBookmark(bookmark) {
	if (!isSafeUrl(bookmark.url)) return;
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	if (tab?.id != null) {
		await chrome.tabs.update(tab.id, { url: bookmark.url });
	}
	window.close();
}

function openDetails(bookmarkId) {
	chrome.windows.create({
		url: `details.html?id=${encodeURIComponent(bookmarkId)}`,
		type: 'popup',
		width: 420,
		height: 280
	});
}

function renderFooter() {
	if (view.level === 'workspaces') {
		footerEl.textContent = `Last updated: ${formatTimestamp(lastUpdated)}`;
	} else {
		footerEl.textContent = '';
	}
}
