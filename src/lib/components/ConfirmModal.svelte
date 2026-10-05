<script lang="ts">
	import Modal from './Modal.svelte';

	interface Props {
		title: string;
		message: string;
		itemList?: string[];
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		stacked?: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		title,
		message,
		itemList,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		danger = false,
		stacked = false,
		onConfirm,
		onCancel
	}: Props = $props();
</script>

<Modal titleId="confirm-title" {title} {stacked} {onCancel}>
	<p>{message}</p>
	{#if itemList && itemList.length > 0}
		<ul>
			{#each itemList as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	{/if}
	<div class="modal-actions">
		<button class="button" onclick={onCancel}>{cancelLabel}</button>
		<button class="button" class:danger onclick={onConfirm}>{confirmLabel}</button>
	</div>
</Modal>
