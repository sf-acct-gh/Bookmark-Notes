import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Bookmark, BookmarkData, DuplicateUrlMatch, Section } from '../types';

const DATA_FILE = path.resolve(process.env.BOOKMARK_DATA_FILE || 'data/bookmarks.json');

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

async function load(): Promise<BookmarkData> {
	if (data) return data;
	if (!loadPromise) {
		loadPromise = (async () => {
			try {
				const raw = await readFile(DATA_FILE, 'utf8');
				const parsed = JSON.parse(raw) as BookmarkData;
				if (!Array.isArray(parsed.sections)) throw new Error('malformed data file');
				return parsed;
			} catch (err: unknown) {
				if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
					const initial: BookmarkData = { sections: [] };
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
	writeChain = writeChain.then(() =>
		atomicWrite(DATA_FILE, JSON.stringify(snapshot, null, 2))
	);
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
		sections: [...source.sections]
			.sort((a, b) => collator.compare(a.name, b.name))
			.map((section) => ({
				...section,
				bookmarks: [...section.bookmarks].sort((a, b) => collator.compare(a.name, b.name))
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

function findSection(d: BookmarkData, sectionId: string): Section {
	const section = d.sections.find((s) => s.id === sectionId);
	if (!section) throw new ValidationError(`Section not found: ${sectionId}`);
	return section;
}

function findBookmarkLocation(
	d: BookmarkData,
	bookmarkId: string
): { section: Section; bookmark: Bookmark } {
	for (const section of d.sections) {
		const bookmark = section.bookmarks.find((b) => b.id === bookmarkId);
		if (bookmark) return { section, bookmark };
	}
	throw new ValidationError(`Bookmark not found: ${bookmarkId}`);
}

export async function getSnapshot(): Promise<BookmarkData> {
	const d = await load();
	return sortedSnapshot(d);
}

export function subscribe(fn: Subscriber): () => void {
	subscribers.add(fn);
	return () => subscribers.delete(fn);
}

export async function findDuplicateUrl(
	url: string,
	excludeBookmarkId?: string
): Promise<DuplicateUrlMatch | null> {
	const d = await load();
	const target = normalizeForCompare(normalizeUrl(url));
	if (!target) return null;
	for (const section of d.sections) {
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

export async function createSection(name: string): Promise<Section> {
	const trimmed = name.trim();
	if (!trimmed) throw new ValidationError('Section name is required');
	const d = await load();
	if (d.sections.some((s) => normalizeForCompare(s.name) === normalizeForCompare(trimmed))) {
		throw new ValidationError(`A section named "${trimmed}" already exists`);
	}
	const section: Section = { id: randomUUID(), name: trimmed, bookmarks: [] };
	d.sections.push(section);
	await persist();
	broadcast();
	return section;
}

export async function renameSection(sectionId: string, name: string): Promise<Section> {
	const trimmed = name.trim();
	if (!trimmed) throw new ValidationError('Section name is required');
	const d = await load();
	const section = findSection(d, sectionId);
	if (
		d.sections.some(
			(s) => s.id !== sectionId && normalizeForCompare(s.name) === normalizeForCompare(trimmed)
		)
	) {
		throw new ValidationError(`A section named "${trimmed}" already exists`);
	}
	section.name = trimmed;
	await persist();
	broadcast();
	return section;
}

export async function deleteSection(sectionId: string): Promise<void> {
	const d = await load();
	const before = d.sections.length;
	d.sections = d.sections.filter((s) => s.id !== sectionId);
	if (d.sections.length === before) throw new ValidationError(`Section not found: ${sectionId}`);
	await persist();
	broadcast();
}

export async function addBookmark(
	sectionId: string,
	input: { name: string; url: string; notes?: string }
): Promise<Bookmark> {
	const name = input.name.trim();
	const url = normalizeUrl(input.url);
	if (!name) throw new ValidationError('Bookmark name is required');
	if (!url) throw new ValidationError('Bookmark URL is required');
	const d = await load();
	const section = findSection(d, sectionId);
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
	const { section: currentSection, bookmark } = findBookmarkLocation(d, bookmarkId);
	const targetSection = findSection(d, input.sectionId);

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
