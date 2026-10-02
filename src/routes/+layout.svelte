<script lang="ts">
	import '../app.css';
	import favicon from '../lib/assets/favicon.svg';
	import { preferences } from '../lib/stores/preferences';

	let { children } = $props();

	$effect(() => {
		document.documentElement.setAttribute('data-mode', $preferences.colorScheme);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
