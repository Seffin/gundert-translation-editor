import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (locals.user) {
		return json({
			authenticated: true,
			user: locals.user
		});
	}

	return json({
		authenticated: false,
		user: null
	});
};
