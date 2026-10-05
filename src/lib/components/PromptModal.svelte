<script lang="ts">
	import Modal from './Modal.svelte';

	interface Props {
		title: string;
		label: string;
		initialValue?: string;
		submitLabel?: string;
		errorMessage?: string;
		onCancel: () => void;
		onSubmit: (value: string) => void;
	}

	let {
		title,
		label,
		initialValue = '',
		submitLabel = 'Save',
		errorMessage = '',
		onCancel,
		onSubmit
	}: Props = $props();

	let value = $state(initialValue);

	function submit(e: Event) {
		e.preventDefault();
		const trimmed = value.trim();
		if (!trimmed) return;
		onSubmit(trimmed);
	}
</script>

<Modal titleId="prompt-title" {title} {onCancel}>
	<form onsubmit={submit}>
		<div class="form-field">
			<label for="prompt-value">{label}</label>
			<input id="prompt-value" type="text" bind:value autofocus />
		</div>
		{#if errorMessage}
			<p class="form-error">{errorMessage}</p>
		{/if}
		<div class="modal-actions">
			<button type="button" class="button" onclick={onCancel}>Cancel</button>
			<button type="submit" class="button primary">{submitLabel}</button>
		</div>
	</form>
</Modal>
