<script lang="ts">
	import type { SearchFields } from '../stores/preferences';

	interface Props {
		searchQuery: string;
		searchFields: SearchFields;
		onExpandAll: () => void;
		onCollapseAll: () => void;
		onNewSection: () => void;
		onSearchFieldsChange: (fields: SearchFields) => void;
	}

	let {
		searchQuery = $bindable(),
		searchFields,
		onExpandAll,
		onCollapseAll,
		onNewSection,
		onSearchFieldsChange
	}: Props = $props();

	function toggleField(field: keyof SearchFields, checked: boolean) {
		onSearchFieldsChange({ ...searchFields, [field]: checked });
	}
</script>

<div class="search-bar">
	<label class="search-label" for="search-input">Search</label>
	<input id="search-input" type="text" bind:value={searchQuery} placeholder="Type at least 3 characters…" />

	<label class="field-checkbox">
		<input
			type="checkbox"
			checked={searchFields.name}
			onchange={(e) => toggleField('name', e.currentTarget.checked)}
		/>
		Name
	</label>
	<label class="field-checkbox">
		<input
			type="checkbox"
			checked={searchFields.url}
			onchange={(e) => toggleField('url', e.currentTarget.checked)}
		/>
		URL
	</label>
	<label class="field-checkbox">
		<input
			type="checkbox"
			checked={searchFields.notes}
			onchange={(e) => toggleField('notes', e.currentTarget.checked)}
		/>
		Notes
	</label>
</div>

<div class="toolbar">
	<div class="toolbar-left">
		<button class="link-button" onclick={onExpandAll}>Expand All</button>
		<span aria-hidden="true">|</span>
		<button class="link-button" onclick={onCollapseAll}>Collapse All</button>
	</div>
	<button class="button primary" onclick={onNewSection}>+ New Section</button>
</div>

<style>
	.search-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1rem;
		background: var(--search-bg);
	}

	.search-label {
		font-weight: 600;
	}

	#search-input {
		flex: 1;
		min-width: 12rem;
		padding: 0.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
		color: var(--text);
	}

	.field-checkbox {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		white-space: nowrap;
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 1rem 0;
	}

	.toolbar-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-muted);
	}

	.link-button {
		background: none;
		border: none;
		color: var(--accent);
		padding: 0;
		font-size: 1rem;
	}

	.link-button:hover {
		text-decoration: underline;
	}
</style>
