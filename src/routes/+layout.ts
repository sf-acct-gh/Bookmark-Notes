// SSR hydration is disabled: this is an internal tool with no SEO/crawler
// requirement, and client-side-only rendering sidesteps a hydration bug in
// the current SvelteKit/Svelte toolchain versions (click handlers never
// attached after SSR hydration).
export const ssr = false;
