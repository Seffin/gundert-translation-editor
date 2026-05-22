import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';

// Setup database directory and path
const DB_DIR = join(process.cwd(), 'data');
if (!existsSync(DB_DIR)) {
	mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = join(DB_DIR, 'gundert.db');

// Setup mock database for non-Bun environments (like Vitest/Node)
class MockDatabase {
	public tables = {
		users: [] as any[],
		sessions: [] as any[],
		story_assignments: [] as any[],
		story_drafts: [] as any[],
		editing_locks: [] as any[]
	};
	private nextUserId = 1;
	private filepath: string;

	constructor(path?: string) {
		this.filepath = path ? path.replace(/\.db$/, '_fallback.json') : join(process.cwd(), 'data', 'gundert_fallback.json');
		this.load();
	}

	private load() {
		try {
			if (existsSync(this.filepath)) {
				const content = readFileSync(this.filepath, 'utf8');
				const data = JSON.parse(content);
				this.tables = data.tables || this.tables;
				this.nextUserId = data.nextUserId || this.nextUserId;
			}
		} catch (e) {
			console.error('Failed to load mock database:', e);
		}
	}

	private save() {
		try {
			const dir = dirname(this.filepath);
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}
			writeFileSync(this.filepath, JSON.stringify({
				tables: this.tables,
				nextUserId: this.nextUserId
			}, null, 2), 'utf8');
		} catch (e) {
			console.error('Failed to save mock database:', e);
		}
	}

	run(sql: string, ...params: any[]) {
		this.load();
		const cleanSql = sql.trim().replace(/\s+/g, ' ');
		
		if (cleanSql.toUpperCase().startsWith('CREATE') || cleanSql.toUpperCase().startsWith('PRAGMA')) {
			return { changes: 0, lastInsertRowid: 0 };
		}
		
		let changed = false;
		if (cleanSql.toUpperCase().startsWith('DELETE FROM SESSIONS WHERE ID =')) {
			const id = params[0];
			const lengthBefore = this.tables.sessions.length;
			this.tables.sessions = this.tables.sessions.filter(s => s.id !== id);
			changed = this.tables.sessions.length !== lengthBefore;
		}

		else if (cleanSql.toUpperCase().startsWith('DELETE FROM SESSIONS WHERE EXPIRES_AT <')) {
			const now = params[0];
			const lengthBefore = this.tables.sessions.length;
			this.tables.sessions = this.tables.sessions.filter(s => s.expires_at >= now);
			changed = this.tables.sessions.length !== lengthBefore;
		}

		else if (cleanSql.toUpperCase().startsWith('DELETE FROM EDITING_LOCKS WHERE STORY_ID =')) {
			const storyId = params[0];
			const lengthBefore = this.tables.editing_locks.length;
			this.tables.editing_locks = this.tables.editing_locks.filter(l => l.story_id !== storyId);
			changed = this.tables.editing_locks.length !== lengthBefore;
		}

		else if (cleanSql.toUpperCase().startsWith('DELETE FROM EDITING_LOCKS WHERE EXPIRES_AT <')) {
			const now = params[0];
			const lengthBefore = this.tables.editing_locks.length;
			this.tables.editing_locks = this.tables.editing_locks.filter(l => l.expires_at >= now);
			changed = this.tables.editing_locks.length !== lengthBefore;
		}

		if (changed) {
			this.save();
			return { changes: 1 };
		}
		return { changes: 0, lastInsertRowid: 0 };
	}

	prepare(sql: string) {
		const self = this;
		const cleanSql = sql.trim().replace(/\s+/g, ' ');

		return {
			run(paramsOrObj?: any, ...args: any[]) {
				self.load();
				const mergedParams = typeof paramsOrObj === 'object' && paramsOrObj !== null
					? paramsOrObj
					: [paramsOrObj, ...args];

				let changed = false;
				let lastInsertRowid = 0;

				if (cleanSql.toUpperCase().includes('INSERT INTO USERS')) {
					const u = mergedParams;
					const username = u.$username ?? u[0];
					const password_hash = u.$password_hash ?? u[1];
					const salt = u.$salt ?? u[2];
					const role = u.$role ?? u[3];
					const id = self.nextUserId++;
					self.tables.users.push({ id, username, password_hash, salt, role });
					changed = true;
					lastInsertRowid = id;
				}

				else if (cleanSql.toUpperCase().includes('INSERT INTO SESSIONS')) {
					const id = mergedParams[0];
					const user_id = mergedParams[1];
					const expires_at = mergedParams[2];
					self.tables.sessions.push({ id, user_id, expires_at });
					changed = true;
				}

				else if (cleanSql.toUpperCase().includes('INSERT OR REPLACE INTO EDITING_LOCKS')) {
					const story_id = mergedParams[0];
					const user_id = mergedParams[1];
					const locked_at = mergedParams[2];
					const expires_at = mergedParams[3];
					self.tables.editing_locks = self.tables.editing_locks.filter(l => l.story_id !== story_id);
					self.tables.editing_locks.push({ story_id, user_id, locked_at, expires_at });
					changed = true;
				}

				else if (cleanSql.toUpperCase().includes('INSERT OR REPLACE INTO STORY_DRAFTS')) {
					const story_id = mergedParams[0];
					const segment_id = mergedParams[1];
					const target_text = mergedParams[2];
					const saved_by_user_id = mergedParams[3];
					const saved_at = mergedParams[4];
					self.tables.story_drafts = self.tables.story_drafts.filter(
						d => !(d.story_id === story_id && d.segment_id === segment_id)
					);
					self.tables.story_drafts.push({ story_id, segment_id, target_text, saved_by_user_id, saved_at });
					changed = true;
				}

				else if (cleanSql.toUpperCase().includes('DELETE FROM SESSIONS WHERE ID =')) {
					const id = mergedParams[0];
					const lengthBefore = self.tables.sessions.length;
					self.tables.sessions = self.tables.sessions.filter(s => s.id !== id);
					changed = self.tables.sessions.length !== lengthBefore;
				}

				else if (cleanSql.toUpperCase().includes('DELETE FROM EDITING_LOCKS WHERE STORY_ID =')) {
					const story_id = mergedParams[0];
					const lengthBefore = self.tables.editing_locks.length;
					self.tables.editing_locks = self.tables.editing_locks.filter(l => l.story_id !== story_id);
					changed = self.tables.editing_locks.length !== lengthBefore;
				}

				if (changed) {
					self.save();
					return { changes: 1, lastInsertRowid };
				}
				return { changes: 0 };
			},

			get(paramsOrObj?: any, ...args: any[]) {
				self.load();
				const mergedParams = typeof paramsOrObj === 'object' && paramsOrObj !== null
					? paramsOrObj
					: [paramsOrObj, ...args];

				if (cleanSql.toUpperCase().includes('SELECT COUNT(*)')) {
					return { count: self.tables.users.length };
				}

				if (cleanSql.toUpperCase().includes('SELECT ID FROM USERS WHERE USERNAME =')) {
					const username = mergedParams[0];
					const u = self.tables.users.find(x => x.username === username);
					return u ? { id: u.id } : undefined;
				}

				if (cleanSql.toUpperCase().includes('SELECT * FROM USERS WHERE USERNAME =')) {
					const username = mergedParams[0];
					return self.tables.users.find(x => x.username === username);
				}

				if (cleanSql.toUpperCase().includes('SELECT S.ID, S.EXPIRES_AT')) {
					const sessionId = mergedParams[0];
					const s = self.tables.sessions.find(x => x.id === sessionId);
					if (!s) return undefined;
					const u = self.tables.users.find(x => x.id === s.user_id);
					if (!u) return undefined;
					return { id: s.id, expires_at: s.expires_at, username: u.username, role: u.role, user_id: u.id };
				}

				if (cleanSql.toUpperCase().includes('SELECT L.STORY_ID, L.LOCKED_AT')) {
					const storyId = mergedParams[0];
					const l = self.tables.editing_locks.find(x => x.story_id === storyId);
					if (!l) return undefined;
					const u = self.tables.users.find(x => x.id === l.user_id);
					if (!u) return undefined;
					return { story_id: l.story_id, locked_at: l.locked_at, expires_at: l.expires_at, username: u.username, user_id: u.id };
				}

				return undefined;
			},

			all(paramsOrObj?: any, ...args: any[]) {
				self.load();
				const mergedParams = typeof paramsOrObj === 'object' && paramsOrObj !== null
					? paramsOrObj
					: [paramsOrObj, ...args];

				if (cleanSql.toUpperCase().includes('SELECT * FROM USERS')) {
					const sorted = [...self.tables.users];
					if (cleanSql.toUpperCase().includes('ORDER BY USERNAME ASC')) {
						sorted.sort((a, b) => a.username.localeCompare(b.username));
					}
					return sorted;
				}

				if (cleanSql.toUpperCase().includes('SELECT * FROM STORY_DRAFTS WHERE STORY_ID =')) {
					const storyId = mergedParams[0];
					return self.tables.story_drafts.filter(d => d.story_id === storyId);
				}

				return [];
			}
		};
	}
}

// Instantiate Database
let activeDb: any;
let isMock = false;

try {
	if (typeof Bun !== 'undefined') {
		const bunSqlite = require('bun:sqlite');
		activeDb = new bunSqlite.Database(DB_PATH);
	} else {
		throw new Error('Not running in Bun');
	}
} catch (e) {
	isMock = true;
	activeDb = new MockDatabase(DB_PATH);
}

export const db = activeDb;

// Initialize tables in actual SQLite if it is not mock
if (!isMock) {
	db.run('PRAGMA foreign_keys = ON;');

	db.run(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			salt TEXT NOT NULL,
			role TEXT NOT NULL
		);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id INTEGER NOT NULL,
			expires_at INTEGER NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS story_assignments (
			story_id TEXT PRIMARY KEY,
			translator_id INTEGER,
			assigned_at INTEGER,
			FOREIGN KEY (translator_id) REFERENCES users(id) ON DELETE SET NULL
		);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS story_drafts (
			story_id TEXT NOT NULL,
			segment_id TEXT NOT NULL,
			target_text TEXT NOT NULL,
			saved_by_user_id INTEGER NOT NULL,
			saved_at INTEGER NOT NULL,
			PRIMARY KEY (story_id, segment_id),
			FOREIGN KEY (saved_by_user_id) REFERENCES users(id) ON DELETE CASCADE
		);
	`);

	db.run(`
		CREATE TABLE IF NOT EXISTS editing_locks (
			story_id TEXT PRIMARY KEY,
			user_id INTEGER NOT NULL,
			locked_at INTEGER NOT NULL,
			expires_at INTEGER NOT NULL,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);
	`);
}

// Encryption Helpers
export function generateSalt(): string {
	return randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
	return createHash('sha256').update(password + salt).digest('hex');
}

// Seeding Default Credentials
const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users');
const userCountResult = checkUsers.get() as { count: number } | undefined;
const count = userCountResult?.count ?? 0;

if (count === 0) {
	const seedUsers = [
		{ username: 'translator.demo', password: 'translator123', role: 'Translator' },
		{ username: 'reviewer.demo', password: 'reviewer123', role: 'Reviewer' },
		{ username: 'lead.demo', password: 'lead123', role: 'Lead' }
	];

	const insertUser = db.prepare(`
		INSERT INTO users (username, password_hash, salt, role)
		VALUES ($username, $password_hash, $salt, $role)
	`);

	for (const u of seedUsers) {
		const salt = generateSalt();
		const password_hash = hashPassword(u.password, salt);
		insertUser.run({
			$username: u.username,
			$password_hash: password_hash,
			$salt: salt,
			$role: u.role
		});
	}
	console.log('Successfully seeded default mock users: translator.demo, reviewer.demo, lead.demo');
}

// SQLite Database helper interfaces
export interface DBUser {
	id: number;
	username: string;
	password_hash: string;
	salt: string;
	role: string;
}

export interface DBSession {
	id: string;
	user_id: number;
	expires_at: number;
}

export interface DBDraft {
	story_id: string;
	segment_id: string;
	target_text: string;
	saved_by_user_id: number;
	saved_at: number;
}

export interface DBEditingLock {
	story_id: string;
	user_id: number;
	locked_at: number;
	expires_at: number;
}
