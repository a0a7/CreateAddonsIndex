import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		csp: {
		  directives: {
			'default-src': ['self', 'unsafe-inline', 'https://cdn.modrinth.com', 'https://curseforge.com', 'https://cdn.curseforge.com'],
			'style-src': ['self', 'unsafe-inline'],
			'script-src': ['self', 'unsafe-inline', 'https://pagead2.googlesyndication.com'],
			'img-src': ['self', 'https://cdn.modrinth.com', 'https://curseforge.com', 'https://cdn.curseforge.com', 'data:'],
			// Add other directives as needed
		  }
		}
		}
};

export default config;
