<script lang="ts">
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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onCancel();
	}
</script>

<div
	class="modal-overlay"
	class:stacked
	role="presentation"
	onclick={onCancel}
	onkeydown={handleKeydown}
>
	<div
		class="modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-title"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
	>
		<h2 id="confirm-title">{title}</h2>
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
	</div>
</div>
