<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		titleId: string;
		title: string;
		size?: 'default' | 'lg';
		stacked?: boolean;
		onCancel: () => void;
		children: Snippet;
	}

	let { titleId, title, size = 'default', stacked = false, onCancel, children }: Props = $props();

	let modalEl: HTMLElement;

	// The `autofocus` attribute on a form field is unreliable here: it only
	// engages if nothing else currently has focus, and the button the user
	// just clicked to open this modal almost always still does. Without an
	// explicit focus move, the keydown-based Escape handler below never
	// sees the keypress, since it only bubbles from whatever element is
	// actually focused (still the trigger button, outside this subtree).
	onMount(() => {
		const firstField = modalEl.querySelector<HTMLElement>('input, textarea, select');
		(firstField ?? modalEl).focus();
	});

	let offset = $state({ x: 0, y: 0 });
	let dragging = false;
	let dragStart = { x: 0, y: 0, offsetStart: { x: 0, y: 0 } };

	function startDrag(e: PointerEvent) {
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		dragStart = { x: e.clientX, y: e.clientY, offsetStart: { ...offset } };
		dragging = true;
	}

	function onDrag(e: PointerEvent) {
		if (!dragging) return;
		offset = {
			x: dragStart.offsetStart.x + (e.clientX - dragStart.x),
			y: dragStart.offsetStart.y + (e.clientY - dragStart.y)
		};
	}

	function endDrag() {
		dragging = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onCancel();
	}
</script>

<div class="modal-overlay" class:stacked role="presentation" onkeydown={handleKeydown}>
	<div
		class="modal"
		class:modal-lg={size === 'lg'}
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		tabindex="-1"
		bind:this={modalEl}
		style="transform: translate({offset.x}px, {offset.y}px)"
	>
		<h2
			id={titleId}
			onpointerdown={startDrag}
			onpointermove={onDrag}
			onpointerup={endDrag}
			onpointercancel={endDrag}
		>
			{title}
		</h2>
		{@render children()}
	</div>
</div>
