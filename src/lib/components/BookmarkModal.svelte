<script lang="ts">
	import type { BookmarkFormValue, Section } from '../types';

	interface Props {
		title: string;
		sections: Section[];
		initial: BookmarkFormValue;
		submitLabel?: string;
		errorMessage?: string;
		onCancel: () => void;
		onSave: (value: BookmarkFormValue) => void;
	}

	let {
		title,
		sections,
		initial,
		submitLabel = 'Save',
		errorMessage = '',
		onCancel,
		onSave
	}: Props = $props();

	let name = $state(initial.name);
	let url = $state(initial.url);
	let notes = $state(initial.notes);
	let sectionId = $state(initial.sectionId);

	function submit(e: Event) {
		e.preventDefault();
		if (!name.trim() || !url.trim()) return;
		onSave({ name: name.trim(), url: url.trim(), notes, sectionId });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onCancel();
	}
</script>

<div class="modal-overlay" role="presentation" onclick={onCancel} onkeydown={handleKeydown}>
	<div
		class="modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby="bookmark-modal-title"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
	>
		<h2 id="bookmark-modal-title">{title}</h2>
		<form onsubmit={submit}>
			<div class="form-field">
				<label for="bookmark-name">Name</label>
				<input id="bookmark-name" type="text" bind:value={name} required autofocus />
			</div>
			<div class="form-field">
				<label for="bookmark-url">URL</label>
				<input id="bookmark-url" type="text" bind:value={url} required placeholder="https://example.com" />
			</div>
			<div class="form-field">
				<label for="bookmark-section">Section</label>
				<select id="bookmark-section" bind:value={sectionId}>
					{#each sections as section (section.id)}
						<option value={section.id}>{section.name}</option>
					{/each}
				</select>
			</div>
			<div class="form-field">
				<label for="bookmark-notes">Notes</label>
				<textarea id="bookmark-notes" bind:value={notes}></textarea>
			</div>
			{#if errorMessage}
				<p class="form-error">{errorMessage}</p>
			{/if}
			<div class="modal-actions">
				<button type="button" class="button" onclick={onCancel}>Cancel</button>
				<button type="submit" class="button primary">{submitLabel}</button>
			</div>
		</form>
	</div>
</div>
