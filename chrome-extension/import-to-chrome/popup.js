const backBtn = document.getElementById('back-btn');
const refreshBtn = document.getElementById('refresh-btn');
const breadcrumbEl = document.getElementById('breadcrumb');
const statusEl = document.getElementById('status');
const listEl = document.getElementById('list');
const footerTextEl = document.getElementById('footer-text');
const detailsFooterTextEl = document.getElementById('details-footer-text');
const themeCircleButtons = document.querySelectorAll('.theme-circle');

const sliderEl = document.getElementById('slider');
const detailsCloseBtn = document.getElementById('details-close-btn');
const detailsNameEl = document.getElementById('details-name');
const detailsUrlEl = document.getElementById('details-url');
const detailsNotesLabelEl = document.getElementById('details-notes-label');
const detailsNotesEl = document.getElementById('details-notes');
const detailsBodyEl = document.getElementById('details-body');

let workspaces = [];
let lastUpdated = null;
let lastFetchError = null;

// { level: 'workspaces' } | { level: 'sections', workspaceId } | { level: 'bookmarks', workspaceId, sectionId }
let view = { level: 'workspaces' };

init();

async function init() {
	await loadFromStorage();
	await loadAndApplyColorScheme();

	const { lastView } = await chrome.storage.local.get(['lastView']);
	if (isValidViewShape(lastView)) view = lastView;
	reconcileView();

	render();
}

// Light is the default for first-time installs (no stored preference yet);
// the user's choice afterward persists in chrome.storage.local so it
// survives the browser closing/reopening.
async function loadAndApplyColorScheme() {
	const { colorScheme } = await chrome.storage.local.get(['colorScheme']);
	applyColorScheme(colorScheme === 'dark' ? 'dark' : 'light');
}

function applyColorScheme(colorScheme) {
	document.documentElement.dataset.theme = colorScheme;
	for (const btn of themeCircleButtons) {
		btn.classList.toggle('active', btn.dataset.themeChoice === colorScheme);
	}
}

for (const btn of themeCircleButtons) {
	btn.addEventListener('click', () => {
		const colorScheme = btn.dataset.themeChoice;
		applyColorScheme(colorScheme);
		chrome.storage.local.set({ colorScheme });
	});
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

// Sets the current navigation position and remembers it (chrome.storage.local)
// so the next time the popup opens — whether the user clicked a bookmark,
// clicked away, or just closed it — it resumes in the same place.
function setView(newView) {
	view = newView;
	chrome.storage.local.set({ lastView: newView });
}

function isValidViewShape(v) {
	if (!v || typeof v !== 'object') return false;
	if (v.level === 'workspaces') return true;
	if (v.level === 'sections') return typeof v.workspaceId === 'string';
	if (v.level === 'bookmarks') return typeof v.workspaceId === 'string' && typeof v.sectionId === 'string';
	return false;
}

// Falls back up a level (or to root) if the remembered/current position no
// longer exists in `workspaces` — e.g. that workspace or section was
// deleted/renamed away since this position was saved.
function reconcileView() {
	if (view.level === 'sections' && !findWorkspace(view.workspaceId)) {
		setView({ level: 'workspaces' });
	} else if (view.level === 'bookmarks') {
		const ws = findWorkspace(view.workspaceId);
		if (!ws) {
			setView({ level: 'workspaces' });
		} else if (!findSection(ws, view.sectionId)) {
			setView({ level: 'sections', workspaceId: ws.id });
		}
	}
}

backBtn.addEventListener('click', () => {
	if (view.level === 'bookmarks') {
		setView({ level: 'sections', workspaceId: view.workspaceId });
	} else if (view.level === 'sections') {
		setView({ level: 'workspaces' });
	}
	render();
});

refreshBtn.addEventListener('click', async () => {
	refreshBtn.disabled = true;
	showStatus('Refreshing…');
	const result = await chrome.runtime.sendMessage({ type: 'refresh' });
	await loadFromStorage();

	// Try to keep the user's place if it still exists after the refresh.
	reconcileView();

	refreshBtn.disabled = false;
	if (result?.ok === false) {
		showStatus(`Refresh failed: ${result.error ?? 'unknown error'} (showing cached data)`);
	} else {
		hideStatus();
	}
	render();
});

detailsCloseBtn.addEventListener('click', () => {
	sliderEl.classList.remove('show-details');
});

// Toggles a class (visibility), not the hidden attribute (display) — the
// status row's height must always stay reserved in the layout so the
// popup's overall height never changes. See the comment on .viewport in
// styles.css for why.
function showStatus(message) {
	statusEl.textContent = message;
	statusEl.classList.add('visible');
}

function hideStatus() {
	statusEl.classList.remove('visible');
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

function makeRow({ label, arrow, onClick, onMiddleClick, onContextMenu, infoOnClick, title, hasNotes }) {
	const row = document.createElement('div');
	row.className = 'row';

	const main = document.createElement('button');
	main.type = 'button';
	main.className = 'row-main';
	main.textContent = label;
	if (title) main.title = title;
	main.addEventListener('click', onClick);

	if (onMiddleClick) {
		// Middle-click normally triggers the browser's autoscroll cursor on
		// mousedown; suppress that so it behaves like a deliberate action.
		main.addEventListener('mousedown', (e) => {
			if (e.button === 1) e.preventDefault();
		});
		main.addEventListener('auxclick', (e) => {
			if (e.button === 1) {
				e.preventDefault();
				onMiddleClick();
			}
		});
	}

	if (onContextMenu) {
		main.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			onContextMenu();
		});
	}

	row.appendChild(main);

	if (arrow) {
		const arrowEl = document.createElement('span');
		arrowEl.className = 'row-arrow';
		arrowEl.textContent = '›';
		arrowEl.setAttribute('aria-hidden', 'true');
		row.appendChild(arrowEl);
	}

	if (infoOnClick) {
		const dot = document.createElement('span');
		dot.className = 'notes-dot';
		if (!hasNotes) dot.classList.add('hidden-dot');
		dot.title = hasNotes ? 'Has notes' : '';
		dot.setAttribute('aria-hidden', 'true');
		row.appendChild(dot);

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
		updateScrollState(listEl);
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
	updateScrollState(listEl);
}

// Only enables scrolling (and therefore only lets a scrollbar ever be
// drawn) when content genuinely doesn't fit in the available space.
// Relying on the browser's own `overflow-y: auto` heuristic alone can
// render a scrollbar track inconsistently across OS/scrollbar styles even
// when nothing needs scrolling, since the fixed-size popup shell (see
// styles.css) always reserves a generous content area regardless of how
// much is actually in it.
function updateScrollState(el) {
	el.classList.toggle('scrollable', el.scrollHeight > el.clientHeight);
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
				setView({ level: 'sections', workspaceId: workspace.id });
				render();
			}
		});
		listEl.appendChild(row);
	}
}

function renderSections() {
	const workspace = findWorkspace(view.workspaceId);
	if (!workspace) {
		setView({ level: 'workspaces' });
		render();
		return;
	}

	backBtn.hidden = false;
	breadcrumbEl.textContent = workspace.name;

	if (workspace.sections.length === 0) {
		renderEmpty('No sections in this workspace.');
		return;
	}

	for (const section of workspace.sections) {
		const row = makeRow({
			label: section.name,
			arrow: true,
			onClick: () => {
				setView({ level: 'bookmarks', workspaceId: workspace.id, sectionId: section.id });
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
		setView(workspace ? { level: 'sections', workspaceId: workspace.id } : { level: 'workspaces' });
		render();
		return;
	}

	backBtn.hidden = false;
	breadcrumbEl.textContent = `${workspace.name} / ${section.name}`;

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
			onMiddleClick: () => openBookmarkInNewTab(bookmark),
			onContextMenu: () => copyBookmarkUrl(bookmark),
			infoOnClick: () => openDetails(bookmark),
			hasNotes: Boolean(bookmark.notes && bookmark.notes.trim())
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

// Mirrors how a middle-click normally behaves on a link: open in a new
// background tab and leave the popup open so more bookmarks can be clicked.
async function openBookmarkInNewTab(bookmark) {
	if (!isSafeUrl(bookmark.url)) return;
	await chrome.tabs.create({ url: bookmark.url, active: false });
}

async function copyBookmarkUrl(bookmark) {
	if (!isSafeUrl(bookmark.url)) return;
	try {
		await navigator.clipboard.writeText(bookmark.url);
		showStatus('URL copied to clipboard');
	} catch {
		showStatus('Could not copy URL');
	}
	setTimeout(hideStatus, 1500);
}

function openDetails(bookmark) {
	detailsNameEl.textContent = bookmark.name;

	detailsUrlEl.replaceChildren();
	if (isSafeUrl(bookmark.url)) {
		const link = document.createElement('a');
		link.href = bookmark.url;
		link.textContent = bookmark.url;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		detailsUrlEl.appendChild(link);
	} else {
		detailsUrlEl.textContent = bookmark.url;
	}

	const hasNotes = Boolean(bookmark.notes && bookmark.notes.trim());
	detailsNotesLabelEl.hidden = !hasNotes;
	detailsNotesEl.hidden = !hasNotes;
	detailsNotesEl.textContent = hasNotes ? bookmark.notes : '';

	detailsFooterTextEl.textContent = `Last updated: ${formatTimestamp(lastUpdated)}`;

	updateScrollState(detailsBodyEl);
	sliderEl.classList.add('show-details');
}

function renderFooter() {
	footerTextEl.textContent = `Last updated: ${formatTimestamp(lastUpdated)}`;
}
