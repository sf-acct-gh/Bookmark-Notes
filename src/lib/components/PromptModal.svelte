<script lang="ts">
	import Modal from './Modal.svelte';

	interface WorkspaceOption {
		id: string;
		name: string;
	}

	interface Props {
		title: string;
		label: string;
		initialValue?: string;
		submitLabel?: string;
		errorMessage?: string;
		onCancel: () => void;
		onSubmit: (value: string, workspaceId?: string) => void;
		workspaceOptions?: WorkspaceOption[];
		initialWorkspaceId?: string;
	}

	let {
		title,
		label,
		initialValue = '',
		submitLabel = 'Save',
		errorMessage = '',
		onCancel,
		onSubmit,
		workspaceOptions,
		initialWorkspaceId
	}: Props = $props();

	let value = $state(initialValue);
	let workspaceId = $state(initialWorkspaceId ?? '');

	function submit(e: Event) {
		e.preventDefault();
		const trimmed = value.trim();
		if (!trimmed) return;
		onSubmit(trimmed, workspaceOptions ? workspaceId : undefined);
	}
</script>

<Modal titleId="prompt-title" {title} {onCancel}>
	<form onsubmit={submit}>
		<div class="form-field">
			<label for="prompt-value">{label}</label>
			<input id="prompt-value" type="text" bind:value autofocus />
		</div>
		{#if workspaceOptions}
			<div class="form-field">
				<label for="prompt-workspace">Workspace</label>
				<select id="prompt-workspace" bind:value={workspaceId}>
					{#each workspaceOptions as workspace (workspace.id)}
						<option value={workspace.id}>{workspace.name}</option>
					{/each}
				</select>
			</div>
		{/if}
		{#if errorMessage}
			<p class="form-error">{errorMessage}</p>
		{/if}
		<div class="modal-actions">
			<button type="button" class="button" onclick={onCancel}>Cancel</button>
			<button type="submit" class="button primary">{submitLabel}</button>
		</div>
	</form>
</Modal>
