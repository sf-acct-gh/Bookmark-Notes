import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Bookmark, BookmarkData, DuplicateUrlMatch, Section, Workspace } from '../types';

const DATA_FILE = path.resolve(process.env.BOOKMARK_DATA_FILE || 'data/bookmarks.json');
const DEFAULT_WORKSPACE_NAME = 'Default';

class ValidationError extends Error {}

let data: BookmarkData | null = null;
let loadPromise: Promise<BookmarkData> | null = null;

// Serializes all writes so concurrent requests can't interleave and corrupt the file.
let writeChain: Promise<void> = Promise.resolve();

type Subscriber = (data: BookmarkData) => void;
const subscribers = new Set<Subscriber>();

async function atomicWrite(filePath: string, contents: string) {
	await mkdir(path.dirname(filePath), { recursive: true });
	const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
	await writeFile(tmp, contents, 'utf8');
	await rename(tmp, filePath);
}

function emptyWorkspaceData(): BookmarkData {
	return { workspaces: [{ id: randomUUID(), name: DEFAULT_WORKSPACE_NAME, sections: [] }] };
}

async function load(): Promise<BookmarkData> {
	if (data) return data;
	if (!loadPromise) {
		loadPromise = (async () => {
			try {
				const raw = await readFile(DATA_FILE, 'utf8');
				const parsed = JSON.parse(raw) as BookmarkData & { sections?: Section[] };
				if (Array.isArray(parsed.workspaces)) {
					return parsed as BookmarkData;
				}
				if (Array.isArray(parsed.sections)) {
					// Migrate the old pre-workspace flat format.
					const migrated: BookmarkData = {
						workspaces: [
							{ id: randomUUID(), name: DEFAULT_WORKSPACE_NAME, sections: parsed.sections }
						]
					};
					await atomicWrite(DATA_FILE, JSON.stringify(migrated, null, 2));
					return migrated;
				}
				throw new Error('malformed data file');
			} catch (err: unknown) {
				if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
					const initial = emptyWorkspaceData();
					await atomicWrite(DATA_FILE, JSON.stringify(initial, null, 2));
					return initial;
				}
				throw err;
			}
		})();
	}
	data = await loadPromise;
	return data;
}

function persist(): Promise<void> {
	const snapshot = data;
	writeChain = writeChain.then(() => atomicWrite(DATA_FILE, JSON.stringify(snapshot, null, 2)));
	return writeChain;
}

function broadcast() {
	if (!data) return;
	const snapshot = sortedSnapshot(data);
	for (const sub of subscribers) sub(snapshot);
}

function sortedSnapshot(source: BookmarkData): BookmarkData {
	const collator = new Intl.Collator(undefined, { sensitivity: 'base' });
	return {
		workspaces: [...source.workspaces]
			.sort((a, b) => collator.compare(a.name, b.name))
			.map((workspace) => ({
				...workspace,
				sections: [...workspace.sections]
					.sort((a, b) => collator.compare(a.name, b.name))
					.map((section) => ({
						...section,
						bookmarks: [...section.bookmarks].sort((a, b) => collator.compare(a.name, b.name))
					}))
			}))
	};
}

function normalizeForCompare(value: string): string {
	return value.trim().toLowerCase();
}

function normalizeUrl(url: string): string {
	const trimmed = url.trim();
	if (!trimmed) return trimmed;
	if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
		return `https://${trimmed}`;
	}
	return trimmed;
}

export function slugify(name: string): string {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug || 'workspace';
}

export function todayStamp(): string {
	return new Date().toISOString().slice(0, 10);
}

function findWorkspace(d: BookmarkData, workspaceId: string): Workspace {
	const workspace = d.workspaces.find((w) => w.id === workspaceId);
	if (!workspace) throw new ValidationError(`Workspace not found: ${workspaceId}`);
	return workspace;
}

function findSectionInWorkspace(workspace: Workspace, sectionId: string): Section {
	const section = workspace.sections.find((s) => s.id === sectionId);
	if (!section) throw new ValidationError(`Section not found: ${sectionId}`);
	return section;
}

function findBookmarkLocation(
	d: BookmarkData,
	bookmarkId: string
): { workspace: Workspace; section: Section; bookmark: Bookmark } {
	for (const workspace of d.workspaces) {
		for (const section of workspace.sections) {
			const bookmark = section.bookmarks.find((b) => b.id === bookmarkId);
			if (bookmark) return { workspace, section, bookmark };
		}
	}
	throw new ValidationError(`Bookmark not found: ${bookmarkId}`);
}

export async function getSnapshot(): Promise<BookmarkData> {
	const d = await load();
	return sortedSnapshot(d);
}

export async function findBookmarkWorkspaceId(bookmarkId: string): Promise<string> {
	const d = await load();
	const { workspace } = findBookmarkLocation(d, bookmarkId);
	return workspace.id;
}

export async function getWorkspaceSnapshot(workspaceId: string): Promise<Workspace> {
	const snapshot = await getSnapshot();
	const workspace = snapshot.workspaces.find((w) => w.id === workspaceId);
	if (!workspace) throw new ValidationError(`Workspace not found: ${workspaceId}`);
	return workspace;
}

export function subscribe(fn: Subscriber): () => void {
	subscribers.add(fn);
	return () => subscribers.delete(fn);
}

export async function findDuplicateUrl(
	workspaceId: string,
	url: string,
	excludeBookmarkId?: string
): Promise<DuplicateUrlMatch | null> {
	const d = await load();
	const workspace = findWorkspace(d, workspaceId);
	const target = normalizeForCompare(normalizeUrl(url));
	if (!target) return null;
	for (const section of workspace.sections) {
		for (const bookmark of section.bookmarks) {
			if (bookmark.id === excludeBookmarkId) continue;
			if (normalizeForCompare(bookmark.url) === target) {
				return {
					sectionId: section.id,
					sectionName: section.name,
					bookmarkId: bookmark.id,
					bookmarkName: bookmark.name
				};
			}
		}
	}
	return null;
}

export async function createWorkspace(name: string): Promise<Workspace> {
	const trimmed = name.trim();
	if (!trimmed) throw new ValidationError('Workspace name is required');
	const d = await load();
	if (d.workspaces.some((w) => normalizeForCompare(w.name) === normalizeForCompare(trimmed))) {
		throw new ValidationError(`A workspace named "${trimmed}" already exists`);
	}
	const workspace: Workspace = { id: randomUUID(), name: trimmed, sections: [] };
	d.workspaces.push(workspace);
	await persist();
	broadcast();
	return workspace;
}

export async function renameWorkspace(workspaceId: string, name: string): Promise<Workspace> {
	const trimmed = name.trim();
	if (!trimmed) throw new ValidationError('Workspace name is required');
	const d = await load();
	const workspace = findWorkspace(d, workspaceId);
	if (
		d.workspaces.some(
			(w) => w.id !== workspaceId && normalizeForCompare(w.name) === normalizeForCompare(trimmed)
		)
	) {
		throw new ValidationError(`A workspace named "${trimmed}" already exists`);
	}
	workspace.name = trimmed;
	await persist();
	broadcast();
	return workspace;
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
	const d = await load();
	findWorkspace(d, workspaceId);
	if (d.workspaces.length <= 1) {
		throw new ValidationError('At least one workspace must remain');
	}
	d.workspaces = d.workspaces.filter((w) => w.id !== workspaceId);
	await persist();
	broadcast();
}

export async function createSection(workspaceId: string, name: string): Promise<Section> {
	const trimmed = name.trim();
	if (!trimmed) throw new ValidationError('Section name is required');
	const d = await load();
	const workspace = findWorkspace(d, workspaceId);
	if (
		workspace.sections.some((s) => normalizeForCompare(s.name) === normalizeForCompare(trimmed))
	) {
		throw new ValidationError(`A section named "${trimmed}" already exists in this workspace`);
	}
	const section: Section = { id: randomUUID(), name: trimmed, bookmarks: [] };
	workspace.sections.push(section);
	await persist();
	broadcast();
	return section;
}

export async function renameSection(
	workspaceId: string,
	sectionId: string,
	name: string
): Promise<Section> {
	const trimmed = name.trim();
	if (!trimmed) throw new ValidationError('Section name is required');
	const d = await load();
	const workspace = findWorkspace(d, workspaceId);
	const section = findSectionInWorkspace(workspace, sectionId);
	if (
		workspace.sections.some(
			(s) => s.id !== sectionId && normalizeForCompare(s.name) === normalizeForCompare(trimmed)
		)
	) {
		throw new ValidationError(`A section named "${trimmed}" already exists in this workspace`);
	}
	section.name = trimmed;
	await persist();
	broadcast();
	return section;
}

export async function deleteSection(workspaceId: string, sectionId: string): Promise<void> {
	const d = await load();
	const workspace = findWorkspace(d, workspaceId);
	const before = workspace.sections.length;
	workspace.sections = workspace.sections.filter((s) => s.id !== sectionId);
	if (workspace.sections.length === before) {
		throw new ValidationError(`Section not found: ${sectionId}`);
	}
	await persist();
	broadcast();
}

export async function addBookmark(
	workspaceId: string,
	sectionId: string,
	input: { name: string; url: string; notes?: string }
): Promise<Bookmark> {
	const name = input.name.trim();
	const url = normalizeUrl(input.url);
	if (!name) throw new ValidationError('Bookmark name is required');
	if (!url) throw new ValidationError('Bookmark URL is required');
	const d = await load();
	const workspace = findWorkspace(d, workspaceId);
	const section = findSectionInWorkspace(workspace, sectionId);
	const bookmark: Bookmark = { id: randomUUID(), name, url, notes: input.notes?.trim() ?? '' };
	section.bookmarks.push(bookmark);
	await persist();
	broadcast();
	return bookmark;
}

export async function updateBookmark(
	bookmarkId: string,
	input: { name: string; url: string; notes?: string; sectionId: string }
): Promise<Bookmark> {
	const name = input.name.trim();
	const url = normalizeUrl(input.url);
	if (!name) throw new ValidationError('Bookmark name is required');
	if (!url) throw new ValidationError('Bookmark URL is required');
	const d = await load();
	const {
		workspace,
		section: currentSection,
		bookmark
	} = findBookmarkLocation(d, bookmarkId);
	const targetSection = findSectionInWorkspace(workspace, input.sectionId);

	bookmark.name = name;
	bookmark.url = url;
	bookmark.notes = input.notes?.trim() ?? '';

	if (targetSection.id !== currentSection.id) {
		currentSection.bookmarks = currentSection.bookmarks.filter((b) => b.id !== bookmarkId);
		targetSection.bookmarks.push(bookmark);
	}

	await persist();
	broadcast();
	return bookmark;
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
	const d = await load();
	const { section } = findBookmarkLocation(d, bookmarkId);
	section.bookmarks = section.bookmarks.filter((b) => b.id !== bookmarkId);
	await persist();
	broadcast();
}

export { ValidationError };
