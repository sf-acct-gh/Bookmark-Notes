<script lang="ts">
	import type { ColorScheme, LinkTarget } from '../stores/preferences';

	interface Props {
		linkTarget: LinkTarget;
		onChange: (target: LinkTarget) => void;
		colorScheme: ColorScheme;
		onColorSchemeChange: (scheme: ColorScheme) => void;
		activeWorkspaceId: string;
		activeWorkspaceName: string;
	}

	let {
		linkTarget,
		onChange,
		colorScheme,
		onColorSchemeChange,
		activeWorkspaceId,
		activeWorkspaceName
	}: Props = $props();
</script>

<footer class="settings-footer">
	<div class="footer-row">
		<span class="settings-label">Theme:</span>
		<label class="field-radio">
			<input
				type="radio"
				name="color-scheme"
				checked={colorScheme === 'light'}
				onchange={() => onColorSchemeChange('light')}
			/>
			Light
		</label>
		<label class="field-radio">
			<input
				type="radio"
				name="color-scheme"
				checked={colorScheme === 'dark'}
				onchange={() => onColorSchemeChange('dark')}
			/>
			Dark
		</label>
	</div>
	<div class="footer-row">
		<span class="settings-label">Open bookmarks in:</span>
		<label class="field-radio">
			<input
				type="radio"
				name="link-target"
				checked={linkTarget === 'same'}
				onchange={() => onChange('same')}
			/>
			Same window
		</label>
		<label class="field-radio">
			<input
				type="radio"
				name="link-target"
				checked={linkTarget === 'new'}
				onchange={() => onChange('new')}
			/>
			New tab
		</label>
	</div>
	<div class="footer-row">
		<span class="settings-label">Backup:</span>
		<a href="/api/export/{activeWorkspaceId}">Download this workspace ({activeWorkspaceName})</a>
		<span aria-hidden="true">|</span>
		<a href="/api/export">Download all workspaces</a>
	</div>
	<div class="footer-brand">Bookmark Notes</div>
</footer>

<style>
	.settings-footer {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 2rem;
		padding: 1rem;
		border-top: 1px solid var(--border);
		color: var(--text-muted);
	}

	.footer-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.settings-label {
		font-weight: 600;
		color: var(--text);
	}

	.field-radio {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.footer-brand {
		text-align: center;
		margin-top: 0.5rem;
	}
</style>
