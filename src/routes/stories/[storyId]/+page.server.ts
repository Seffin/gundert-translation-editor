import { buildStoryEditorModel } from '$lib/server/editor';
import { parseObsStoryById } from '$lib/server/obs';
import { join } from 'node:path';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const DEFAULT_OBS_CONTENT_DIR = join(process.cwd(), 'en_obs', 'content');

export const load: PageServerLoad = async ({ params }) => {
	const storyId = params.storyId?.padStart(2, '0');

	if (!/^\d{2}$/.test(storyId)) {
		throw error(400, 'Invalid story id');
	}

	try {
		const story = await parseObsStoryById(DEFAULT_OBS_CONTENT_DIR, storyId);
		return {
			story: buildStoryEditorModel(story)
		};
	} catch {
		throw error(404, 'Story not found');
	}
};
