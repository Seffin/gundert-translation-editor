import { parseObsContentDirectory } from '$lib/server/obs';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { PageServerLoad } from './$types';

const DEFAULT_OBS_CONTENT_DIR = join(process.cwd(), 'en_obs', 'content');

export const load: PageServerLoad = async () => {
	try {
		const stories = await parseObsContentDirectory(DEFAULT_OBS_CONTENT_DIR);
		
		const mappedStories = stories.map((story) => {
			const mlPath = join(process.cwd(), 'ml_obs', 'content', `${story.storyId}.md`);
			const isPublished = existsSync(mlPath);
			return {
				storyId: story.storyId,
				storyNumber: story.storyNumber,
				title: story.title,
				isPublished
			};
		});

		return {
			stories: mappedStories
		};
	} catch (error) {
		return {
			stories: []
		};
	}
};
