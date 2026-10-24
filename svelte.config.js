import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Vercel の Node ランタイム上で SSR させる（Edge にするなら runtime: 'edge'）
		adapter: adapter({
			runtime: 'nodejs22.x'
		})
	}
};

export default config;
