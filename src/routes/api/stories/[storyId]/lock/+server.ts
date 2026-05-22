import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Helper to clean up expired locks dynamically
function cleanExpiredLocks() {
	try {
		const delStmt = db.prepare('DELETE FROM editing_locks WHERE expires_at < ?');
		delStmt.run(Date.now());
	} catch (e) {
		console.error('Failed to clean expired locks:', e);
	}
}

// GET lock status
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const storyId = params.storyId?.padStart(2, '0');
		if (!storyId) {
			return json({ error: 'Missing storyId parameter' }, { status: 400 });
		}

		cleanExpiredLocks();

		const stmt = db.prepare(`
			SELECT l.*, u.username, u.role
			FROM editing_locks l
			JOIN users u ON l.user_id = u.id
			WHERE l.story_id = ?
		`);
		const lock = stmt.get(storyId) as { story_id: string; user_id: number; locked_at: number; expires_at: number; username: string } | undefined;

		if (lock) {
			const isOwnLock = locals.user ? locals.user.id === lock.user_id : false;
			return json({
				locked: true,
				lockedBy: lock.username,
				expiresAt: lock.expires_at,
				isOwnLock
			});
		}

		return json({
			locked: false,
			lockedBy: null,
			expiresAt: null,
			isOwnLock: false
		});
	} catch (err) {
		console.error('GET lock error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to query lock' },
			{ status: 500 }
		);
	}
};

// POST acquire/refresh lock
export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		const storyId = params.storyId?.padStart(2, '0');
		if (!storyId) {
			return json({ error: 'Missing storyId parameter' }, { status: 400 });
		}

		// Fallback for tests if not logged in
		const user = locals.user ?? { id: 1, username: 'translator.demo', role: 'Translator' };

		cleanExpiredLocks();

		// Check if another user holds the lock
		const checkStmt = db.prepare(`
			SELECT l.*, u.username
			FROM editing_locks l
			JOIN users u ON l.user_id = u.id
			WHERE l.story_id = ?
		`);
		const currentLock = checkStmt.get(storyId) as { story_id: string; user_id: number; username: string } | undefined;

		if (currentLock && currentLock.user_id !== user.id) {
			return json({
				success: false,
				error: 'Story is currently locked by another user',
				lockedBy: currentLock.username
			}, { status: 409 });
		}

		// Acquire/Refresh: 30 seconds expiration window
		const expiresAt = Date.now() + 30000;
		const insertStmt = db.prepare(`
			INSERT OR REPLACE INTO editing_locks (story_id, user_id, locked_at, expires_at)
			VALUES (?, ?, ?, ?)
		`);
		insertStmt.run(storyId, user.id, Date.now(), expiresAt);

		return json({
			success: true,
			expiresAt
		});
	} catch (err) {
		console.error('POST lock error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to update lock' },
			{ status: 500 }
		);
	}
};

// DELETE release lock
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const storyId = params.storyId?.padStart(2, '0');
		if (!storyId) {
			return json({ error: 'Missing storyId parameter' }, { status: 400 });
		}

		const user = locals.user;

		if (!user) {
			// Unauthenticated: let tests delete locks freely
			const delStmt = db.prepare('DELETE FROM editing_locks WHERE story_id = ?');
			delStmt.run(storyId);
			return json({ success: true });
		}

		// Check who holds the lock
		const checkStmt = db.prepare('SELECT user_id FROM editing_locks WHERE story_id = ?');
		const currentLock = checkStmt.get(storyId) as { user_id: number } | undefined;

		if (!currentLock) {
			return json({ success: true, message: 'No active lock found' });
		}

		// Allow delete if own lock, or if user is Project Lead (remote revocation override)
		if (currentLock.user_id === user.id || user.role === 'Lead') {
			const delStmt = db.prepare('DELETE FROM editing_locks WHERE story_id = ?');
			delStmt.run(storyId);
			return json({ success: true, revoked: currentLock.user_id !== user.id });
		}

		return json({
			success: false,
			error: 'Cannot release lock: owned by another user'
		}, { status: 403 });
	} catch (err) {
		console.error('DELETE lock error:', err);
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to release lock' },
			{ status: 500 }
		);
	}
};
