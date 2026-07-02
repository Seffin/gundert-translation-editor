import vercelAdapter from '@sveltejs/adapter-vercel';
import autoAdapter from '@sveltejs/adapter-auto';

const adapter = process.platform === 'win32' ? autoAdapter : vercelAdapter;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter()
	}
};

export default config;
