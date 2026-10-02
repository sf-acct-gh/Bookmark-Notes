<script lang="ts">
	import type { Bookmark, Section } from '../types';
	import type { LinkTarget } from '../stores/preferences';
	import BookmarkRow from './BookmarkRow.svelte';

	interface Props {
		section: Section;
		bookmarks: Bookmark[];
		collapsed: boolean;
		linkTarget: LinkTarget;
		onToggleCollapse: () => void;
		onRename: () => void;
		onDeleteRequest: () => void;
		onAddBookmark: () => void;
		onEditBookmark: (bookmark: Bookmark) => void;
		onDeleteBookmark: (bookmark: Bookmark) => void;
	}

	let {
		section,
		bookmarks,
		collapsed,
		linkTarget,
		onToggleCollapse,
		onRename,
		onDeleteRequest,
		onAddBookmark,
		onEditBookmark,
		onDeleteBookmark
	}: Props = $props();
</script>

<section class="tile">
	<header class="tile-header">
		<button
			class="collapse-toggle"
			aria-label={collapsed ? 'Expand section' : 'Collapse section'}
			onclick={onToggleCollapse}
		>
			{collapsed ? '▸' : '▾'}
		</button>
		<h2 class="tile-title">{section.name}</h2>
		<div class="tile-actions">
			<button class="icon-button" title="Rename section" aria-label="Rename section" onclick={onRename}>
				✎
			</button>
			<button
				class="icon-button danger"
				title="Delete section"
				aria-label="Delete section"
				onclick={onDeleteRequest}
			>
				✕
			</button>
			<button class="icon-button" title="Add bookmark" aria-label="Add bookmark" onclick={onAddBookmark}>
				+
			</button>
		</div>
	</header>

	{#if !collapsed}
		<div class="tile-body">
			{#if bookmarks.length === 0}
				<p class="empty">No bookmarks here yet.</p>
			{:else}
				{#each bookmarks as bookmark (bookmark.id)}
					<BookmarkRow
						{bookmark}
						{linkTarget}
						onEdit={() => onEditBookmark(bookmark)}
						onDelete={() => onDeleteBookmark(bookmark)}
					/>
				{/each}
			{/if}
		</div>
	{/if}
</section>

<style>
	.tile {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
		display: flex;
		flex-direction: column;
	}

	.tile-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 1rem;
		border-bottom: 1px solid var(--border);
		background: var(--header-bg);
		border-radius: calc(var(--radius) - 1px) calc(var(--radius) - 1px) 0 0;
	}

	.collapse-toggle {
		border: none;
		background: none;
		font-size: 1rem;
		width: 1.5rem;
		padding: 0;
	}

	.tile-title {
		flex: 1;
		margin: 0;
		font-size: 1.1rem;
		overflow-wrap: anywhere;
	}

	.tile-actions {
		display: flex;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.tile-body {
		padding: 0.25rem 1rem 0.5rem;
	}

	.empty {
		color: var(--text-muted);
		font-style: italic;
		padding: 0.75rem 0;
	}
</style>
