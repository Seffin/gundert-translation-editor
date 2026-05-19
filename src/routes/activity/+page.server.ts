import { getActivityEvents } from '$lib/server/activity-log';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		events: getActivityEvents()
	};
};
