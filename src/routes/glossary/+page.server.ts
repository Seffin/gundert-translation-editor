import { listGlossaryTerms } from '$lib/server/glossary';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userTargetLanguage = locals.user?.targetLanguage || 'Malayalam';
	return {
		terms: listGlossaryTerms(),
		userTargetLanguage
	};
};
