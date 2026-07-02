import { parseObsContentDirectory, LANGUAGE_CODE_MAP } from '$lib/server/obs';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { PageServerLoad } from './$types';

const DEFAULT_OBS_CONTENT_DIR = join(process.cwd(), 'en_obs', 'content');

export const load: PageServerLoad = async ({ url }) => {
	const langParam = url.searchParams.get('lang') || 'Malayalam';

	// Resolve target language and code
	let langCode = 'ml';
	let targetLanguage = 'Malayalam';

	const paramLower = langParam.toLowerCase();
	for (const [name, code] of Object.entries(LANGUAGE_CODE_MAP)) {
		if (name.toLowerCase() === paramLower || code.toLowerCase() === paramLower) {
			langCode = code;
			targetLanguage = name;
			break;
		}
	}

	try {
		const stories = await parseObsContentDirectory(DEFAULT_OBS_CONTENT_DIR);

		const mappedStories = stories.map((story) => {
			const path = join(process.cwd(), `${langCode}_obs`, 'content', `${story.storyId}.md`);
			const isPublished = existsSync(path);
			return {
				storyId: story.storyId,
				storyNumber: story.storyNumber,
				title: story.title,
				isPublished
			};
		});

		return {
			stories: mappedStories,
			targetLanguage,
			langCode
		};
	} catch (error) {
		return {
			stories: [],
			targetLanguage,
			langCode
		};
	}
};
