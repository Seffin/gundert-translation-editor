import { parseObsStoryFile } from '$lib/server/obs';
import { error } from '@sveltejs/kit';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const storyId = params.storyId?.padStart(2, '0');

	if (!/^\d{2}$/.test(storyId)) {
		throw error(400, 'Invalid story id');
	}

	const mlPath = join(process.cwd(), 'ml_obs', 'content', `${storyId}.md`);
	const enPath = join(process.cwd(), 'en_obs', 'content', `${storyId}.md`);

	try {
		if (existsSync(mlPath)) {
			const story = await parseObsStoryFile(mlPath);
			return {
				story,
				isPublished: true
			};
		} else if (existsSync(enPath)) {
			const story = await parseObsStoryFile(enPath);
			return {
				story,
				isPublished: false
			};
		} else {
			throw error(404, 'Story not found');
		}
	} catch (e) {
		throw error(404, 'Story not found');
	}
};
