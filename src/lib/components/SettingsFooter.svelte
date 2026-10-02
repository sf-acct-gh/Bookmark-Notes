<script lang="ts">
	import type { LinkTarget } from '../stores/preferences';

	interface Props {
		linkTarget: LinkTarget;
		onChange: (target: LinkTarget) => void;
	}

	let { linkTarget, onChange }: Props = $props();
</script>

<footer class="settings-footer">
	<span class="settings-label">Open bookmarks in:</span>
	<label class="radio">
		<input
			type="radio"
			name="link-target"
			checked={linkTarget === 'same'}
			onchange={() => onChange('same')}
		/>
		Same window
	</label>
	<label class="radio">
		<input
			type="radio"
			name="link-target"
			checked={linkTarget === 'new'}
			onchange={() => onChange('new')}
		/>
		New tab
	</label>
</footer>

<style>
	.settings-footer {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
		padding: 1rem;
		border-top: 1px solid var(--border);
		color: var(--text-muted);
	}

	.settings-label {
		font-weight: 600;
		color: var(--text);
	}

	.radio {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
</style>
