import { db } from '$lib/server/db';
import { buildStoryEditorModel } from '$lib/server/editor';
import { listGlossaryTerms } from '$lib/server/glossary';
import { parseObsStoryById } from '$lib/server/obs';
import { join } from 'node:path';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const DEFAULT_OBS_CONTENT_DIR = join(process.cwd(), 'en_obs', 'content');

export const load: PageServerLoad = async ({ params, locals }) => {
	const storyId = params.storyId?.padStart(2, '0');

	if (!/^\d{2}$/.test(storyId)) {
		throw error(400, 'Invalid story id');
	}

	try {
		// 1. Parse base story model
		const rawStory = await parseObsStoryById(DEFAULT_OBS_CONTENT_DIR, storyId);
		const storyModel = buildStoryEditorModel(rawStory);

		// 2. Resolve collaborative editing lock status
		// Clean up expired locks first
		try {
			db.prepare('DELETE FROM editing_locks WHERE expires_at < ?').run(Date.now());
		} catch (e) {
			console.error('Failed to prune expired locks in story load:', e);
		}

		const lockStmt = db.prepare(`
			SELECT l.*, u.username
			FROM editing_locks l
			JOIN users u ON l.user_id = u.id
			WHERE l.story_id = ?
		`);
		const activeLock = lockStmt.get(storyId) as { story_id: string; user_id: number; username: string } | undefined;

		const lockedInfo = activeLock
			? {
					locked: true,
					lockedBy: activeLock.username,
					isOwnLock: locals.user ? locals.user.id === activeLock.user_id : false
				}
			: {
					locked: false,
					lockedBy: null,
					isOwnLock: false
				};

		// 3. Hydrate persistent SQLite draft segments if any exist
		const draftStmt = db.prepare(`
			SELECT d.*, u.username
			FROM story_drafts d
			JOIN users u ON d.saved_by_user_id = u.id
			WHERE d.story_id = ?
		`);
		const draftRows = draftStmt.all(storyId) as any[];

		let sqliteDraft = null;
		if (draftRows.length > 0) {
			const segments: Record<string, any> = {};
			let savedByActorId = 'Unassigned';
			let savedAtMs = 0;

			for (const row of draftRows) {
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

			sqliteDraft = {
				storyId,
				savedByActorId,
				savedAtIso: savedAtMs > 0 ? new Date(savedAtMs).toISOString() : new Date().toISOString(),
				segments
			};
		}

		return {
			story: storyModel,
			glossaryTerms: listGlossaryTerms(),
			lockedInfo,
			sqliteDraft
		};
	} catch (err) {
		console.error('Story load error:', err);
		throw error(404, 'Story not found');
	}
};
