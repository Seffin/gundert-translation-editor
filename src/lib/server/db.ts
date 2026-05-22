import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@libsql/client';

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
		editing_locks: [] as any[],
		pre_registrations: [] as any[]
	};
	private nextUserId = 1;
	private nextPreRegId = 1;
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
				if (!this.tables.pre_registrations) {
					this.tables.pre_registrations = [];
				}
				this.nextUserId = data.nextUserId || this.nextUserId;
				this.nextPreRegId = data.nextPreRegId || this.nextPreRegId;
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
				nextUserId: this.nextUserId,
				nextPreRegId: this.nextPreRegId
			}, null, 2), 'utf8');
		} catch (e) {
			console.error('Failed to save mock database:', e);
		}
	}

	async run(sql: string, ...params: any[]) {
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
			return { changes: 1, lastInsertRowid: 0 };
		}
		return { changes: 0, lastInsertRowid: 0 };
	}

	prepare(sql: string) {
		const self = this;
		const cleanSql = sql.trim().replace(/\s+/g, ' ');

		return {
			async run(paramsOrObj?: any, ...args: any[]) {
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

				else if (cleanSql.toUpperCase().includes('INSERT INTO PRE_REGISTRATIONS')) {
					const email = mergedParams[0];
					const name = mergedParams[1];
					const requested_role = mergedParams[2];
					const justification = mergedParams[3];
					const status = mergedParams[4] ?? 'Pending';
					const created_at = mergedParams[5] ?? Date.now();
					const id = self.nextPreRegId++;
					self.tables.pre_registrations.push({ id, email, name, requested_role, justification, status, created_at });
					changed = true;
					lastInsertRowid = id;
				}

				else if (cleanSql.toUpperCase().includes('UPDATE PRE_REGISTRATIONS SET STATUS =')) {
					const status = mergedParams[0];
					const id = mergedParams[1];
					const req = self.tables.pre_registrations.find(x => x.id === id);
					if (req) {
						req.status = status;
						changed = true;
					}
				}

				else if (cleanSql.toUpperCase().includes('DELETE FROM PRE_REGISTRATIONS WHERE ID =')) {
					const id = mergedParams[0];
					const lengthBefore = self.tables.pre_registrations.length;
					self.tables.pre_registrations = self.tables.pre_registrations.filter(x => x.id !== id);
					changed = self.tables.pre_registrations.length !== lengthBefore;
				}

				if (changed) {
					self.save();
					return { changes: 1, lastInsertRowid };
				}
				return { changes: 0, lastInsertRowid };
			},

			async get(paramsOrObj?: any, ...args: any[]) {
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

				if (cleanSql.toUpperCase().includes('FROM PRE_REGISTRATIONS WHERE EMAIL =')) {
					const email = mergedParams[0];
					const r = self.tables.pre_registrations.find(x => x.email === email);
					if (!r) return undefined;
					if (cleanSql.toUpperCase().includes('SELECT STATUS FROM')) {
						return { status: r.status };
					}
					if (cleanSql.toUpperCase().includes('SELECT ID FROM')) {
						return { id: r.id };
					}
					return r;
				}

				return undefined;
			},

			async all(paramsOrObj?: any, ...args: any[]) {
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

				if (cleanSql.toUpperCase().includes('SELECT * FROM PRE_REGISTRATIONS')) {
					const sorted = [...self.tables.pre_registrations];
					if (cleanSql.toUpperCase().includes('ORDER BY CREATED_AT DESC')) {
						sorted.sort((a, b) => b.created_at - a.created_at);
					}
					return sorted;
				}

				return [];
			}
		};
	}
}

class LibSQLDatabase {
	private client: any;

	constructor(client: any) {
		this.client = client;
	}

	async run(sql: string, ...params: any[]) {
		const args = params.length === 1 && typeof params[0] === 'object' && params[0] !== null ? params[0] : params;
		const res = await this.client.execute({ sql, args });
		return {
			changes: res.rowsAffected,
			lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0
		};
	}

	prepare(sql: string) {
		const self = this;
		return {
			async run(paramsOrObj?: any, ...args: any[]) {
				const mergedParams = typeof paramsOrObj === 'object' && paramsOrObj !== null
					? paramsOrObj
					: (paramsOrObj !== undefined ? [paramsOrObj, ...args] : []);
				const res = await self.client.execute({ sql, args: mergedParams });
				return {
					changes: res.rowsAffected,
					lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0
				};
			},

			async get(paramsOrObj?: any, ...args: any[]) {
				const mergedParams = typeof paramsOrObj === 'object' && paramsOrObj !== null
					? paramsOrObj
					: (paramsOrObj !== undefined ? [paramsOrObj, ...args] : []);
				const res = await self.client.execute({ sql, args: mergedParams });
				if (res.rows.length === 0) return undefined;
				return { ...res.rows[0] };
			},

			async all(paramsOrObj?: any, ...args: any[]) {
				const mergedParams = typeof paramsOrObj === 'object' && paramsOrObj !== null
					? paramsOrObj
					: (paramsOrObj !== undefined ? [paramsOrObj, ...args] : []);
				const res = await self.client.execute({ sql, args: mergedParams });
				return res.rows.map(row => ({ ...row }));
			}
		};
	}
}

class BunSQLDatabase {
	private innerDb: any;

	constructor(innerDb: any) {
		this.innerDb = innerDb;
	}

	async run(sql: string, ...params: any[]) {
		const res = this.innerDb.run(sql, ...params);
		return {
			changes: res.changes,
			lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0
		};
	}

	prepare(sql: string) {
		const stmt = this.innerDb.prepare(sql);
		return {
			async run(paramsOrObj?: any, ...args: any[]) {
				const res = paramsOrObj !== undefined
					? (typeof paramsOrObj === 'object' && paramsOrObj !== null ? stmt.run(paramsOrObj) : stmt.run(paramsOrObj, ...args))
					: stmt.run();
				return {
					changes: res.changes,
					lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0
				};
			},

			async get(paramsOrObj?: any, ...args: any[]) {
				const res = paramsOrObj !== undefined
					? (typeof paramsOrObj === 'object' && paramsOrObj !== null ? stmt.get(paramsOrObj) : stmt.get(paramsOrObj, ...args))
					: stmt.get();
				return res || undefined;
			},

			async all(paramsOrObj?: any, ...args: any[]) {
				const res = paramsOrObj !== undefined
					? (typeof paramsOrObj === 'object' && paramsOrObj !== null ? stmt.all(paramsOrObj) : stmt.all(paramsOrObj, ...args))
					: stmt.all();
				return res || [];
			}
		};
	}
}

// Instantiate Database
let activeDb: any;
let isMock = false;

const tursoUrl = process.env.TURSO_DB_URL;
const tursoToken = process.env.TURSO_DB_TOKEN;

if (tursoUrl) {
	const libsqlClient = createClient({
		url: tursoUrl,
		authToken: tursoToken
	});
	activeDb = new LibSQLDatabase(libsqlClient);
} else {
	try {
		if (typeof Bun !== 'undefined') {
			const bunSqlite = require('bun:sqlite');
			const rawDb = new bunSqlite.Database(DB_PATH);
			activeDb = new BunSQLDatabase(rawDb);
		} else {
			throw new Error('Not running in Bun');
		}
	} catch (e) {
		isMock = true;
		activeDb = new MockDatabase(DB_PATH);
	}
}

export const db = activeDb;

// Initialize tables asynchronously
export async function initializeDatabase() {
	if (!isMock) {
		await db.run('PRAGMA foreign_keys = ON;').catch(() => {});

		await db.run(`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT UNIQUE NOT NULL,
				password_hash TEXT NOT NULL,
				salt TEXT NOT NULL,
				role TEXT NOT NULL
			);
		`);

		await db.run(`
			CREATE TABLE IF NOT EXISTS sessions (
				id TEXT PRIMARY KEY,
				user_id INTEGER NOT NULL,
				expires_at INTEGER NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			);
		`);

		await db.run(`
			CREATE TABLE IF NOT EXISTS story_assignments (
				story_id TEXT PRIMARY KEY,
				translator_id INTEGER,
				assigned_at INTEGER,
				FOREIGN KEY (translator_id) REFERENCES users(id) ON DELETE SET NULL
			);
		`);

		await db.run(`
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

		await db.run(`
			CREATE TABLE IF NOT EXISTS editing_locks (
				story_id TEXT PRIMARY KEY,
				user_id INTEGER NOT NULL,
				locked_at INTEGER NOT NULL,
				expires_at INTEGER NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			);
		`);

		await db.run(`
			CREATE TABLE IF NOT EXISTS pre_registrations (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				email TEXT UNIQUE NOT NULL,
				name TEXT NOT NULL,
				requested_role TEXT NOT NULL,
				justification TEXT,
				status TEXT NOT NULL DEFAULT 'Pending',
				created_at INTEGER NOT NULL
			);
		`);
	}

	// Seeding Default Credentials (runs for both Mock and Real databases)
	const seedUsers = [
		{ username: 'translator.demo', password: 'translator123', role: 'Translator' },
		{ username: 'reviewer.demo', password: 'reviewer123', role: 'Reviewer' },
		{ username: 'lead.demo', password: 'lead123', role: 'Lead' },
		{ username: 'admin.demo', password: 'admin123', role: 'SuperAdmin' }
	];

	const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');
	const insertUser = db.prepare(`
		INSERT INTO users (username, password_hash, salt, role)
		VALUES ($username, $password_hash, $salt, $role)
	`);

	let seededAny = false;
	for (const u of seedUsers) {
		const existing = await checkUser.get(u.username) as { id: number } | undefined;
		if (!existing) {
			const salt = generateSalt();
			const password_hash = hashPassword(u.password, salt);
			await insertUser.run({
				$username: u.username,
				$password_hash: password_hash,
				$salt: salt,
				$role: u.role
			});
			seededAny = true;
			console.log(`Successfully seeded default user: ${u.username}`);
		}
	}

	if (seededAny) {
		console.log('Finished seeding missing default users.');
	}
}

// Encryption Helpers
export function generateSalt(): string {
	return randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
	return createHash('sha256').update(password + salt).digest('hex');
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

export interface DBPreRegistration {
	id: number;
	email: string;
	name: string;
	requested_role: string;
	justification: string;
	status: string;
	created_at: number;
}
