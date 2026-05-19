import { listGlossaryTerms } from '$lib/server/glossary';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		terms: listGlossaryTerms()
	};
};
