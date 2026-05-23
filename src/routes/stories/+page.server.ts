import { buildStoryListItems } from '$lib/server/story-list';
import { parseObsContentDirectory } from '$lib/server/obs';
import { join } from 'node:path';
import type { PageServerLoad } from './$types';

const DEFAULT_OBS_CONTENT_DIR = join(process.cwd(), 'en_obs', 'content');

export const load: PageServerLoad = async () => {
	try {
		const stories = await parseObsContentDirectory(DEFAULT_OBS_CONTENT_DIR);
		return {
			stories: buildStoryListItems(stories),
			sourceAvailable: true
		};
	} catch {
		return {
			stories: [],
			sourceAvailable: false
		};
	}
};
