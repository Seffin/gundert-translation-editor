import { describe, it, expect, beforeAll } from 'vitest';
import { db, hashPassword, generateSalt, initializeDatabase } from './db';
import type { DBUser, DBSession, DBDraft, DBEditingLock } from './db';

describe('SQLite Database client & schemas', () => {
	beforeAll(async () => {
		await initializeDatabase();
		try {
			await db.prepare('UPDATE users SET target_language = NULL').run();
		} catch (err) {
			// Ignore if db is uninitialized
		}
	});

	it('should successfully seed default demo users', async () => {
		const stmt = db.prepare('SELECT * FROM users ORDER BY username ASC');
		const users = (await stmt.all()) as DBUser[];

		expect(users.length).toBeGreaterThanOrEqual(4);

		const admin = users.find((u) => u.username === 'admin.demo');
		expect(admin).toBeDefined();
		expect(admin!.role).toBe('SuperAdmin');

		const lead = users.find((u) => u.username === 'lead.demo');
		expect(lead).toBeDefined();
		expect(lead!.role).toBe('Lead');

		const reviewer = users.find((u) => u.username === 'reviewer.demo');
		expect(reviewer).toBeDefined();
		expect(reviewer!.role).toBe('Reviewer');

		const translator = users.find((u) => u.username === 'translator.demo');
		expect(translator).toBeDefined();
		expect(translator!.role).toBe('Translator');
	});

	it('should successfully save and query user target language settings', async () => {
		const getUser = db.prepare('SELECT * FROM users WHERE username = ?');
		const user = (await getUser.get('translator.demo')) as DBUser;
		expect(user).toBeDefined();

		// Default should be null
		expect(user.target_language).toBeNull();

		// Update target language preference
		const updateTarget = db.prepare('UPDATE users SET target_language = ? WHERE id = ?');
		await updateTarget.run('Malayalam', user.id);

		// Re-fetch to verify it persisted
		const updatedUser = (await getUser.get('translator.demo')) as DBUser;
		expect(updatedUser).toBeDefined();
		expect(updatedUser.target_language).toBe('Malayalam');

		// Query session should also contain target_language
		const sessionId = 'test-session-target-lang';
		const expiresAt = Date.now() + 1000 * 60;
		const insertSession = db.prepare(
			'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
		);
		await insertSession.run(sessionId, user.id, expiresAt);

		const querySession = db.prepare(`
			SELECT s.id, s.expires_at, u.username, u.role, u.target_language
			FROM sessions s
			JOIN users u ON s.user_id = u.id
			WHERE s.id = ?
		`);
		const session = (await querySession.get(sessionId)) as any;
		expect(session).toBeDefined();
		expect(session.target_language).toBe('Malayalam');

		// Clean up
		const deleteSession = db.prepare('DELETE FROM sessions WHERE id = ?');
		await deleteSession.run(sessionId);

		const clearTarget = db.prepare('UPDATE users SET target_language = NULL WHERE id = ?');
		await clearTarget.run(user.id);
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
		const user = (await getUser.get('translator.demo')) as DBUser;
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
		const session = (await querySession.get(sessionId)) as {
			id: string;
			expires_at: number;
			username: string;
			role: string;
		};

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
		const user = (await getUser.get('translator.demo')) as DBUser;
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
		const lock = (await queryLock.get(storyId)) as {
			story_id: string;
			locked_at: number;
			expires_at: number;
			username: string;
		};

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
