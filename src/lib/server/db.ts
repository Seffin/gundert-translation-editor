import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@libsql/client';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Load environment variables manually from .env if running locally (e.g., in Vitest or local SvelteKit dev)
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
	try {
		const content = readFileSync(envPath, 'utf8');
		content.split(/\r?\n/).forEach((line) => {
			const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
			if (match) {
				const key = match[1];
				let value = match[2] || '';
				if (value.startsWith('"') && value.endsWith('"')) {
					value = value.slice(1, -1);
				} else if (value.startsWith("'") && value.endsWith("'")) {
					value = value.slice(1, -1);
				}
				if (!process.env[key]) {
					process.env[key] = value.trim();
				}
			}
		});
	} catch (err) {
		console.error('Failed to load local .env variables manually:', err);
	}
}

class LibSQLDatabase {
	private _client: any = null;

	private getClient() {
		if (this._client) return this._client;

		const tursoUrl = process.env.TURSO_DB_URL;
		const tursoToken = process.env.TURSO_DB_TOKEN;

		if (!tursoUrl) {
			throw new Error(
				'TURSO_DB_URL environment variable is required. SvelteKit local fallback database is disabled.'
			);
		}

		this._client = createClient({
			url: tursoUrl,
			authToken: tursoToken
		});

		return this._client;
	}

	async run(sql: string, ...params: any[]) {
		const client = this.getClient();
		const args =
			params.length === 1 && typeof params[0] === 'object' && params[0] !== null
				? params[0]
				: params;
		const res = await client.execute({ sql, args });
		return {
			changes: res.rowsAffected,
			lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0
		};
	}

	async batch(queries: { sql: string; args: any[] }[], mode: 'read' | 'write' = 'write') {
		const client = this.getClient();
		return await client.batch(queries, mode);
	}

	prepare(sql: string) {
		const self = this;
		return {
			async run(paramsOrObj?: any, ...args: any[]) {
				const client = self.getClient();
				const mergedParams =
					typeof paramsOrObj === 'object' && paramsOrObj !== null
						? paramsOrObj
						: paramsOrObj !== undefined
							? [paramsOrObj, ...args]
							: [];
				const res = await client.execute({ sql, args: mergedParams });
				return {
					changes: res.rowsAffected,
					lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0
				};
			},

			async get(paramsOrObj?: any, ...args: any[]) {
				const client = self.getClient();
				const mergedParams =
					typeof paramsOrObj === 'object' && paramsOrObj !== null
						? paramsOrObj
						: paramsOrObj !== undefined
							? [paramsOrObj, ...args]
							: [];
				const res = await client.execute({ sql, args: mergedParams });
				if (res.rows.length === 0) return undefined;
				return { ...res.rows[0] };
			},

			async all(paramsOrObj?: any, ...args: any[]) {
				const client = self.getClient();
				const mergedParams =
					typeof paramsOrObj === 'object' && paramsOrObj !== null
						? paramsOrObj
						: paramsOrObj !== undefined
							? [paramsOrObj, ...args]
							: [];
				const res = await client.execute({ sql, args: mergedParams });
				return res.rows.map((row: any) => ({ ...row }));
			}
		};
	}
}

export const db = new LibSQLDatabase();

// Initialize tables asynchronously
export async function initializeDatabase() {
	await db.run('PRAGMA foreign_keys = ON;').catch(() => {});

	await db.run(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			salt TEXT NOT NULL,
			role TEXT NOT NULL,
			target_language TEXT DEFAULT NULL
		);
	`);

	// Migration: Add target_language column if it does not exist
	try {
		await db.run('ALTER TABLE users ADD COLUMN target_language TEXT DEFAULT NULL;');
		console.log('Successfully applied target_language migration to users table');
	} catch (err) {
		// Ignore if column already exists
	}

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

	// Seeding Default Credentials
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
		const existing = (await checkUser.get(u.username)) as { id: number } | undefined;
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
	return createHash('sha256')
		.update(password + salt)
		.digest('hex');
}

// SQLite Database helper interfaces
export interface DBUser {
	id: number;
	username: string;
	password_hash: string;
	salt: string;
	role: string;
	target_language?: string | null;
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
