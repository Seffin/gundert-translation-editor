import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { isValidLanguage } from '$lib/client/target-language';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	try {
		// Enforce authentication
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json().catch(() => ({}));
		const { targetLanguage } = body;

		if (!targetLanguage) {
			return json({ error: 'Missing targetLanguage parameter' }, { status: 400 });
		}

		// Validate language preference
		if (!isValidLanguage(targetLanguage)) {
			return json({ error: `Unsupported target language: ${targetLanguage}` }, { status: 400 });
		}

		const userId = locals.user.id;

		// Persist preference to the database
		const stmt = db.prepare('UPDATE users SET target_language = ? WHERE id = ?');
		await stmt.run(targetLanguage, userId);

		return json({ success: true, targetLanguage });
	} catch (error) {
		console.error('API save settings error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown settings save error' },
			{ status: 500 }
		);
	}
};
