import { describe, it, expect, beforeAll } from 'vitest';
import { db, hashPassword, generateSalt, initializeDatabase } from './db';
import type { DBUser, DBSession, DBDraft, DBEditingLock } from './db';

describe('SQLite Database client & schemas', () => {
	beforeAll(async () => {
		await initializeDatabase();
	});

	it('should successfully seed default demo users', async () => {
		const stmt = db.prepare('SELECT * FROM users ORDER BY username ASC');
		const users = await stmt.all() as DBUser[];

		expect(users.length).toBeGreaterThanOrEqual(4);
		expect(users[0].username).toBe('admin.demo');
		expect(users[0].role).toBe('SuperAdmin');
		expect(users[1].username).toBe('lead.demo');
		expect(users[1].role).toBe('Lead');
		expect(users[2].username).toBe('reviewer.demo');
		expect(users[2].role).toBe('Reviewer');
		expect(users[3].username).toBe('translator.demo');
		expect(users[3].role).toBe('Translator');
	});

	it('should verify password hashing behaves deterministically', () => {
		const password = 'mySecretPassword123';
		const salt = generateSalt();
		const hash1 = hashPassword(password, salt);
		const hash2 = hashPassword(password, salt);

		expect(hash1).toBe(hash2);
		expect(hash1).not.toBe(password);
		expect(hash1.length).toBe(64); // SHA-256 is 64 hex characters
	});

	it('should manage sessions successfully', async () => {
		const getUser = db.prepare('SELECT id FROM users WHERE username = ?');
		const user = await getUser.get('translator.demo') as DBUser;
		expect(user).toBeDefined();

		const sessionId = 'test-session-uuid-123';
		const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hour later

		// Insert session
		const insertSession = db.prepare(`
			INSERT INTO sessions (id, user_id, expires_at)
			VALUES (?, ?, ?)
		`);
		await insertSession.run(sessionId, user.id, expiresAt);

		// Query session
		const querySession = db.prepare(`
			SELECT s.id, s.expires_at, u.username, u.role
			FROM sessions s
			JOIN users u ON s.user_id = u.id
			WHERE s.id = ?
		`);
		const session = await querySession.get(sessionId) as { id: string; expires_at: number; username: string; role: string };

		expect(session).toBeDefined();
		expect(session.id).toBe(sessionId);
		expect(session.username).toBe('translator.demo');
		expect(session.role).toBe('Translator');

		// Cleanup session
		const deleteSession = db.prepare('DELETE FROM sessions WHERE id = ?');
		await deleteSession.run(sessionId);

		const sessionAfterDelete = await querySession.get(sessionId);
		expect(sessionAfterDelete).toBeUndefined();
	});

	it('should manage collaborative editing locks', async () => {
		const getUser = db.prepare('SELECT id FROM users WHERE username = ?');
		const user = await getUser.get('translator.demo') as DBUser;
		expect(user).toBeDefined();

		const storyId = '99'; // Test story id
		const lockedAt = Date.now();
		const expiresAt = lockedAt + 30000; // 30 seconds expiry

		// Clean up any existing lock on story 99
		const cleanup = db.prepare('DELETE FROM editing_locks WHERE story_id = ?');
		await cleanup.run(storyId);

		// Acquire lock
		const acquireLock = db.prepare(`
			INSERT OR REPLACE INTO editing_locks (story_id, user_id, locked_at, expires_at)
			VALUES (?, ?, ?, ?)
		`);
		await acquireLock.run(storyId, user.id, lockedAt, expiresAt);

		// Query lock
		const queryLock = db.prepare(`
			SELECT l.story_id, l.locked_at, l.expires_at, u.username
			FROM editing_locks l
			JOIN users u ON l.user_id = u.id
			WHERE l.story_id = ?
		`);
		const lock = await queryLock.get(storyId) as { story_id: string; locked_at: number; expires_at: number; username: string };

		expect(lock).toBeDefined();
		expect(lock.story_id).toBe(storyId);
		expect(lock.username).toBe('translator.demo');

		// Delete lock
		const releaseLock = db.prepare('DELETE FROM editing_locks WHERE story_id = ?');
		await releaseLock.run(storyId);

		const lockAfterRelease = await queryLock.get(storyId);
		expect(lockAfterRelease).toBeUndefined();
	});
});
