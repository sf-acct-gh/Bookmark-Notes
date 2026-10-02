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
		<div class="tab-group" class:active>
			<button class="tab" class:active onclick={() => onSelect(workspace.id)}>
				{workspace.name}
			</button>
			{#if active}
				<button
					class="tab-icon"
					title="Rename workspace"
					aria-label="Rename workspace"
					onclick={() => onRename(workspace)}
				>
					✎
				</button>
				{#if workspaces.length > 1}
					<button
						class="tab-icon danger"
						title="Delete workspace"
						aria-label="Delete workspace"
						onclick={() => onDeleteRequest(workspace)}
					>
						✕
					</button>
				{/if}
			{/if}
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
		font-weight: 600;
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

	.tab-icon:hover {
		background: var(--bg-muted);
		color: var(--text);
	}

	.tab-icon.danger:hover {
		background: var(--danger-bg);
		color: var(--danger);
	}
</style>
