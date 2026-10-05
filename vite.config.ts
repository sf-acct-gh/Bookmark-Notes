import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Baked in at build time via the APP_BASE Docker build-arg (see Dockerfile).
// '' = served from root; '/some-prefix' = served from a subpath (leading
// slash, no trailing slash — SvelteKit's required convention). SvelteKit
// validates the actual value at config-processing time and throws a clear
// error if malformed; this cast just satisfies its stricter type.
const base = (process.env.APP_BASE ?? '') as '' | `/${string}`;

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter(),

			paths: { base }
		})
	]
});
