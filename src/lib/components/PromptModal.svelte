<script lang="ts">
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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onCancel();
	}
</script>

<div class="modal-overlay" role="presentation" onclick={onCancel} onkeydown={handleKeydown}>
	<div
		class="modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby="prompt-title"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
	>
		<h2 id="prompt-title">{title}</h2>
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
	</div>
</div>
