import { parseObsStoryFile, LANGUAGE_CODE_MAP } from '$lib/server/obs';
import { error } from '@sveltejs/kit';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const storyId = params.storyId?.padStart(2, '0');

	if (!/^\d{2}$/.test(storyId)) {
		throw error(400, 'Invalid story id');
	}

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

	const targetPath = join(process.cwd(), `${langCode}_obs`, 'content', `${storyId}.md`);
	const enPath = join(process.cwd(), 'en_obs', 'content', `${storyId}.md`);

	try {
		if (existsSync(targetPath)) {
			const story = await parseObsStoryFile(targetPath);
			return {
				story,
				isPublished: true,
				targetLanguage,
				langCode
			};
		} else if (existsSync(enPath)) {
			const story = await parseObsStoryFile(enPath);
			return {
				story,
				isPublished: false,
				targetLanguage,
				langCode
			};
		} else {
			throw error(404, 'Story not found');
		}
	} catch (e) {
		throw error(404, 'Story not found');
	}
};
