<script lang="ts">
	import type { Bookmark } from '../types';
	import type { LinkTarget } from '../stores/preferences';

	interface Props {
		bookmark: Bookmark;
		linkTarget: LinkTarget;
		onEdit: () => void;
		onDelete: () => void;
	}

	let { bookmark, linkTarget, onEdit, onDelete }: Props = $props();

	const target = $derived(linkTarget === 'new' ? '_blank' : '_self');
	const hasNotes = $derived(bookmark.notes.trim().length > 0);
</script>

<div class="bookmark-row">
	<div class="bookmark-info">
		<a class="bookmark-name" href={bookmark.url} target={target} rel="noopener noreferrer">
			{bookmark.name}
		</a>
		<a class="bookmark-url" href={bookmark.url} target={target} rel="noopener noreferrer">
			{bookmark.url}
		</a>
	</div>
	<div class="bookmark-actions">
		<span
			class="notes-dot"
			class:hidden-dot={!hasNotes}
			title={hasNotes ? 'Has notes' : undefined}
			aria-hidden="true"
		></span>
		<button
			class="icon-button"
			title="View/edit notes"
			aria-label="View/edit notes"
			onclick={onEdit}
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect x="3" y="1.5" width="10" height="13" rx="1.5" />
				<line x1="5.5" y1="5" x2="10.5" y2="5" />
				<line x1="5.5" y1="8" x2="10.5" y2="8" />
				<line x1="5.5" y1="11" x2="8.5" y2="11" />
			</svg>
		</button>
		<button
			class="icon-button danger"
			title="Delete bookmark"
			aria-label="Delete bookmark"
			onclick={onDelete}
		>
			✕
		</button>
	</div>
</div>

<style>
	.bookmark-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--divider);
	}

	.bookmark-row:last-child {
		border-bottom: none;
	}

	.bookmark-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.bookmark-name {
		font-weight: 600;
	}

	.bookmark-url {
		font-size: 0.85rem;
		color: var(--text-muted);
		overflow-wrap: anywhere;
	}

	.bookmark-actions {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.notes-dot {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text);
		flex-shrink: 0;
	}

	/* Space is always reserved (visibility, not display) so buttons line up
	   at the same position whether or not a given bookmark has notes. */
	.notes-dot.hidden-dot {
		visibility: hidden;
	}
</style>
