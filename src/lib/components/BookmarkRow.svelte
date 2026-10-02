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
		<button class="icon-button" title="Edit bookmark" aria-label="Edit bookmark" onclick={onEdit}>
			✎
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
		border-bottom: 1px solid #eee;
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
		gap: 0.4rem;
		flex-shrink: 0;
	}
</style>
