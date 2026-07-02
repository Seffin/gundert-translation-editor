import { db } from '$lib/server/db';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET draft sync
export const GET: RequestHandler = async ({ params }) => {
	try {
		const storyId = params.storyId?.padStart(2, '0');
		if (!storyId) {
			return json({ error: 'Missing storyId parameter' }, { status: 400 });
		}

		const stmt = db.prepare(`
			SELECT d.*, u.username 
			FROM story_drafts d 
			JOIN users u ON d.saved_by_user_id = u.id 
			WHERE d.story_id = ?
		`);
		const rows = (await stmt.all(storyId)) as any[];

		if (rows.length === 0) {
			return json({ draft: null });
		}

		// Reconstruct PersistedStoryDraft object
		const segments: Record<string, any> = {};
		let savedByActorId = 'Unassigned';
		let savedAtMs = 0;

		for (const row of rows) {
			segments[row.segment_id] = {
				targetText: row.target_text,
				savedByActorId: row.username,
				savedAtIso: new Date(row.saved_at).toISOString()
			};
			if (row.saved_at > savedAtMs) {
				savedAtMs = row.saved_at;
				savedByActorId = row.username;
			}
		}

		return json({
			draft: {
				storyId,
				savedByActorId,
				savedAtIso: savedAtMs > 0 ? new Date(savedAtMs).toISOString() : new Date().toISOString(),
				segments
			}
		});
	} catch (err) {
		console.error('GET draft sync error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to fetch draft' },
			{ status: 500 }
		);
	}
};

// POST draft sync
export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const storyId = params.storyId?.padStart(2, '0');
		if (!storyId) {
			return json({ error: 'Missing storyId parameter' }, { status: 400 });
		}

		const { draft } = await request.json();
		if (!draft || !draft.segments) {
			return json({ error: 'Invalid draft payload: segments required' }, { status: 400 });
		}

		// Fallback user id if unauthenticated (e.g. in tests)
		const userId = locals.user?.id ?? 1;

		const queries = Object.entries(draft.segments).map(([segmentId, seg]) => ({
			sql: `INSERT OR REPLACE INTO story_drafts (story_id, segment_id, target_text, saved_by_user_id, saved_at)
			      VALUES (?, ?, ?, ?, ?)`,
			args: [storyId, segmentId, (seg as any).targetText, userId, Date.now()]
		}));

		await db.batch(queries, 'write');

		return json({ success: true, storyId });
	} catch (err) {
		console.error('POST draft sync error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to save draft' },
			{ status: 500 }
		);
	}
};
