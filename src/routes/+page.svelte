<script lang="ts">
	import { onMount } from 'svelte';
	import type { Bookmark, BookmarkData, BookmarkFormValue, DuplicateUrlMatch, Section } from '../lib/types';
	import { preferences, type SearchFields, type LinkTarget } from '../lib/stores/preferences';
	import { collapsedSections } from '../lib/stores/collapsed';
	import Header from '../lib/components/Header.svelte';
	import SectionTile from '../lib/components/SectionTile.svelte';
	import BookmarkModal from '../lib/components/BookmarkModal.svelte';
	import ConfirmModal from '../lib/components/ConfirmModal.svelte';
	import PromptModal from '../lib/components/PromptModal.svelte';
	import SettingsFooter from '../lib/components/SettingsFooter.svelte';

	let board = $state<BookmarkData>({ sections: [] });
	let loaded = $state(false);
	let searchQuery = $state('');

	// Bookmark add/edit modal
	let editingBookmark = $state<{ bookmark: Bookmark | null; sectionId: string } | null>(null);
	let bookmarkModalError = $state('');
	let pendingPayload = $state<BookmarkFormValue | null>(null);
	let duplicateWarning = $state<DuplicateUrlMatch | null>(null);

	// Section create/rename prompt
	let sectionPrompt = $state<{ mode: 'create' | 'rename'; section?: Section } | null>(null);
	let sectionPromptError = $state('');

	// Delete confirmations
	let sectionToDelete = $state<Section | null>(null);
	let bookmarkToDelete = $state<Bookmark | null>(null);

	onMount(() => {
		const source = new EventSource('/api/stream');
		source.onmessage = (event) => {
			board = JSON.parse(event.data) as BookmarkData;
			loaded = true;
		};
		return () => source.close();
	});

	function bookmarkMatches(bookmark: Bookmark, fields: SearchFields, text: string): boolean {
		return (
			(fields.name && bookmark.name.toLowerCase().includes(text)) ||
			(fields.url && bookmark.url.toLowerCase().includes(text)) ||
			(fields.notes && bookmark.notes.toLowerCase().includes(text))
		);
	}

	const visibleSections = $derived.by(() => {
		const fields = $preferences.searchFields;
		const text = searchQuery.trim().toLowerCase();
		const active = text.length >= 3;
		return board.sections
			.map((section) => ({
				section,
				bookmarks: active
					? section.bookmarks.filter((b) => bookmarkMatches(b, fields, text))
					: section.bookmarks
			}))
			.filter(({ bookmarks }) => !active || bookmarks.length > 0);
	});

	function handleSearchFieldsChange(fields: SearchFields) {
		preferences.update((p) => ({ ...p, searchFields: fields }));
	}

	function handleLinkTargetChange(target: LinkTarget) {
		preferences.update((p) => ({ ...p, linkTarget: target }));
	}

	function expandAll() {
		collapsedSections.setAll(
			board.sections.map((s) => s.id),
			false
		);
	}

	function collapseAll() {
		collapsedSections.setAll(
			board.sections.map((s) => s.id),
			true
		);
	}

	function openCreateSection() {
		sectionPromptError = '';
		sectionPrompt = { mode: 'create' };
	}

	function openRenameSection(section: Section) {
		sectionPromptError = '';
		sectionPrompt = { mode: 'rename', section };
	}

	async function submitSectionPrompt(name: string) {
		sectionPromptError = '';
		const isCreate = sectionPrompt?.mode === 'create';
		const url = isCreate ? '/api/sections' : `/api/sections/${sectionPrompt!.section!.id}`;
		const method = isCreate ? 'POST' : 'PATCH';
		const res = await fetch(url, {
			method,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ name })
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			sectionPromptError = body.error ?? 'Something went wrong';
			return;
		}
		sectionPrompt = null;
	}

	function requestDeleteSection(section: Section) {
		sectionToDelete = section;
	}

	async function confirmDeleteSection() {
		if (!sectionToDelete) return;
		await fetch(`/api/sections/${sectionToDelete.id}`, {
			method: 'DELETE',
			headers: { 'content-type': 'application/json' }
		});
		sectionToDelete = null;
	}

	function requestDeleteBookmark(bookmark: Bookmark) {
		bookmarkToDelete = bookmark;
	}

	async function confirmDeleteBookmark() {
		if (!bookmarkToDelete) return;
		await fetch(`/api/bookmarks/${bookmarkToDelete.id}`, {
			method: 'DELETE',
			headers: { 'content-type': 'application/json' }
		});
		bookmarkToDelete = null;
	}

	function openAddBookmark(sectionId: string) {
		bookmarkModalError = '';
		editingBookmark = { bookmark: null, sectionId };
	}

	function openEditBookmark(bookmark: Bookmark, sectionId: string) {
		bookmarkModalError = '';
		editingBookmark = { bookmark, sectionId };
	}

	async function saveBookmark(
		payload: BookmarkFormValue,
		allowDuplicate: boolean
	): Promise<{ ok: true } | { ok: false; error?: string; duplicate?: DuplicateUrlMatch }> {
		const isNew = !editingBookmark?.bookmark;
		const body = { ...payload, allowDuplicate };
		const endpoint = isNew
			? `/api/sections/${payload.sectionId}/bookmarks`
			: `/api/bookmarks/${editingBookmark!.bookmark!.id}`;
		const method = isNew ? 'POST' : 'PATCH';

		const res = await fetch(endpoint, {
			method,
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (res.status === 409) {
			const resBody = await res.json();
			return { ok: false, duplicate: resBody.duplicate as DuplicateUrlMatch };
		}
		if (!res.ok) {
			const resBody = await res.json().catch(() => ({}));
			return { ok: false, error: resBody.error };
		}
		return { ok: true };
	}

	async function handleBookmarkSave(payload: BookmarkFormValue) {
		bookmarkModalError = '';
		const result = await saveBookmark(payload, false);
		if (result.ok) {
			editingBookmark = null;
		} else if (result.duplicate) {
			duplicateWarning = result.duplicate;
			pendingPayload = payload;
		} else {
			bookmarkModalError = result.error ?? 'Something went wrong';
		}
	}

	async function confirmDuplicateSave() {
		if (!pendingPayload) return;
		const result = await saveBookmark(pendingPayload, true);
		if (result.ok) {
			editingBookmark = null;
		} else {
			bookmarkModalError = result.error ?? 'Something went wrong';
		}
		duplicateWarning = null;
		pendingPayload = null;
	}

	function cancelDuplicateSave() {
		duplicateWarning = null;
		pendingPayload = null;
	}
</script>

<svelte:head>
	<title>Bookmark Notes</title>
</svelte:head>

<main>
	<h1>Bookmark Notes</h1>

	<Header
		bind:searchQuery
		searchFields={$preferences.searchFields}
		onSearchFieldsChange={handleSearchFieldsChange}
		onExpandAll={expandAll}
		onCollapseAll={collapseAll}
		onNewSection={openCreateSection}
	/>

	<div class="section-grid">
		{#each visibleSections as { section, bookmarks } (section.id)}
			<SectionTile
				{section}
				{bookmarks}
				collapsed={$collapsedSections.has(section.id)}
				linkTarget={$preferences.linkTarget}
				onToggleCollapse={() => collapsedSections.toggle(section.id)}
				onRename={() => openRenameSection(section)}
				onDeleteRequest={() => requestDeleteSection(section)}
				onAddBookmark={() => openAddBookmark(section.id)}
				onEditBookmark={(bookmark) => openEditBookmark(bookmark, section.id)}
				onDeleteBookmark={requestDeleteBookmark}
			/>
		{/each}

		{#if loaded && board.sections.length === 0}
			<p class="empty-state">No sections yet. Create one to start adding bookmarks.</p>
		{:else if !loaded}
			<p class="empty-state">Loading…</p>
		{/if}
	</div>

	<SettingsFooter linkTarget={$preferences.linkTarget} onChange={handleLinkTargetChange} />
</main>

{#if sectionPrompt}
	<PromptModal
		title={sectionPrompt.mode === 'create' ? 'New Section' : 'Rename Section'}
		label="Section name"
		initialValue={sectionPrompt.section?.name ?? ''}
		submitLabel={sectionPrompt.mode === 'create' ? 'Create' : 'Save'}
		errorMessage={sectionPromptError}
		onCancel={() => (sectionPrompt = null)}
		onSubmit={submitSectionPrompt}
	/>
{/if}

{#if sectionToDelete}
	<ConfirmModal
		title={`Delete "${sectionToDelete.name}"?`}
		message={sectionToDelete.bookmarks.length > 0
			? `This will permanently delete the section and all ${sectionToDelete.bookmarks.length} bookmark(s) in it:`
			: 'This will permanently delete this empty section.'}
		itemList={sectionToDelete.bookmarks.map((b) => b.name)}
		confirmLabel="Delete Section"
		danger
		onCancel={() => (sectionToDelete = null)}
		onConfirm={confirmDeleteSection}
	/>
{/if}

{#if bookmarkToDelete}
	<ConfirmModal
		title={`Delete "${bookmarkToDelete.name}"?`}
		message="This will permanently delete this bookmark."
		confirmLabel="Delete"
		danger
		onCancel={() => (bookmarkToDelete = null)}
		onConfirm={confirmDeleteBookmark}
	/>
{/if}

{#if editingBookmark}
	<BookmarkModal
		title={editingBookmark.bookmark ? 'Edit Bookmark' : 'Add Bookmark'}
		sections={board.sections}
		initial={{
			name: editingBookmark.bookmark?.name ?? '',
			url: editingBookmark.bookmark?.url ?? '',
			notes: editingBookmark.bookmark?.notes ?? '',
			sectionId: editingBookmark.sectionId
		}}
		submitLabel={editingBookmark.bookmark ? 'Save' : 'Add'}
		errorMessage={bookmarkModalError}
		onCancel={() => (editingBookmark = null)}
		onSave={handleBookmarkSave}
	/>
{/if}

{#if duplicateWarning}
	<ConfirmModal
		title="Duplicate URL"
		message={`This URL is already saved in section "${duplicateWarning.sectionName}" as "${duplicateWarning.bookmarkName}". Save anyway?`}
		confirmLabel="Save Anyway"
		stacked
		onCancel={cancelDuplicateSave}
		onConfirm={confirmDuplicateSave}
	/>
{/if}

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	h1 {
		margin-top: 0;
	}

	.section-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		align-items: start;
		margin-top: 1rem;
	}

	@media (max-width: 720px) {
		.section-grid {
			grid-template-columns: 1fr;
		}
	}

	.empty-state {
		grid-column: 1 / -1;
		color: var(--text-muted);
		font-style: italic;
	}
</style>
