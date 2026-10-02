<script lang="ts">
	import type { Workspace } from '../types';

	interface Props {
		workspaces: Workspace[];
		activeId: string;
		onSelect: (id: string) => void;
		onCreate: () => void;
		onRename: (workspace: Workspace) => void;
		onDeleteRequest: (workspace: Workspace) => void;
	}

	let { workspaces, activeId, onSelect, onCreate, onRename, onDeleteRequest }: Props = $props();
</script>

<div class="workspace-tabs">
	{#each workspaces as workspace (workspace.id)}
		{@const active = workspace.id === activeId}
		{@const canDelete = active && workspaces.length > 1}
		<div class="tab-group" class:active>
			<button class="tab" class:active onclick={() => onSelect(workspace.id)}>
				{workspace.name}
			</button>
			<button
				class="tab-icon"
				class:hidden-icon={!active}
				title="Rename workspace"
				aria-label="Rename workspace"
				aria-hidden={!active}
				tabindex={active ? 0 : -1}
				onclick={() => active && onRename(workspace)}
			>
				✎
			</button>
			<button
				class="tab-icon danger"
				class:hidden-icon={!canDelete}
				title="Delete workspace"
				aria-label="Delete workspace"
				aria-hidden={!canDelete}
				tabindex={canDelete ? 0 : -1}
				onclick={() => canDelete && onDeleteRequest(workspace)}
			>
				✕
			</button>
		</div>
	{/each}
	<button class="tab new-tab" title="New workspace" aria-label="New workspace" onclick={onCreate}>
		+
	</button>
</div>

<style>
	.workspace-tabs {
		display: flex;
		align-items: flex-end;
		gap: 0.25rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.tab-group {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		border: 1px solid var(--border);
		border-bottom: none;
		border-radius: var(--radius) var(--radius) 0 0;
		background: var(--bg-muted);
		padding: 0.1rem 0.1rem 0.1rem 0.25rem;
	}

	.tab-group.active {
		background: var(--bg);
	}

	.tab {
		border: none;
		background: none;
		padding: 0.5rem 0.75rem;
		font-size: 1rem;
		color: var(--text-muted);
	}

	.tab.active {
		color: var(--text);
	}

	.new-tab {
		border: 1px solid var(--border);
		border-bottom: none;
		border-radius: var(--radius) var(--radius) 0 0;
		background: var(--bg);
		padding: 0.5rem 0.9rem;
		color: var(--text-muted);
	}

	.new-tab:hover {
		background: var(--bg-muted);
	}

	.tab-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: none;
		border-radius: var(--radius);
		font-size: 0.85rem;
		color: var(--text-muted);
		flex-shrink: 0;
	}

	/* Space is always reserved (visibility, not display) so a tab's width
	   never changes when it becomes active/inactive. */
	.tab-icon.hidden-icon {
		visibility: hidden;
		pointer-events: none;
	}

	.tab-icon:hover {
		background: var(--bg-muted);
		color: var(--text);
	}

	.tab-icon.danger:hover {
		background: var(--danger-bg);
		color: var(--danger);
	}
</style>
