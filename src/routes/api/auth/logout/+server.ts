import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		const sessionCookie = cookies.get('gundert_session');

		if (sessionCookie) {
			const delStmt = db.prepare('DELETE FROM sessions WHERE id = ?');
			delStmt.run(sessionCookie);
		}

		// Clear secure session cookie
		cookies.delete('gundert_session', { path: '/' });

		return json({ success: true });
	} catch (error) {
		console.error('API logout error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown logout error' },
			{ status: 500 }
		);
	}
};
