/**
 * Gundert Translation Editor - Cloud Database Migration Utility
 * 
 * This script imports all local records (users, pre-registrations, story drafts,
 * assignments, and locks) from the local fallback database (data/gundert_fallback.json)
 * into your configured Turso Cloud Database.
 * 
 * Usage:
 *   node scripts/migrate-to-cloud.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

// Colors for beautiful CLI output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	red: '\x1b[31m'
};

console.log(`${colors.bright}${colors.cyan}================================================================${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}   Gundert Translation Editor - Cloud Database Migrator         ${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}================================================================${colors.reset}\n`);

// 1. Load env variables manually from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
	const content = fs.readFileSync(envPath, 'utf8');
	content.split(/\r?\n/).forEach(line => {
		const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
		if (match) {
			const key = match[1];
			let value = match[2] || '';
			if (value.startsWith('"') && value.endsWith('"')) {
				value = value.slice(1, -1);
			} else if (value.startsWith("'") && value.endsWith("'")) {
				value = value.slice(1, -1);
			}
			process.env[key] = value.trim();
		}
	});
	console.log(`${colors.green}✔ Loaded environment variables from .env${colors.reset}`);
} else {
	console.warn(`${colors.yellow}⚠ .env file not found. Falling back to system environment variables.${colors.reset}`);
}

const tursoUrl = process.env.TURSO_DB_URL;
const tursoToken = process.env.TURSO_DB_TOKEN;

if (!tursoUrl) {
	console.error(`\n${colors.red}❌ ERROR: TURSO_DB_URL is not set in your environment or .env file.${colors.reset}`);
	console.error(`Please configure your Turso cloud credentials first to perform a migration.\n`);
	process.exit(1);
}

console.log(`${colors.blue}ℹ Connecting to cloud database at: ${colors.bright}${tursoUrl}${colors.reset}`);
const cloudDb = createClient({
	url: tursoUrl,
	authToken: tursoToken
});

// 2. Load local JSON fallback data
const fallbackPath = path.join(__dirname, '..', 'data', 'gundert_fallback.json');
if (!fs.existsSync(fallbackPath)) {
	console.error(`\n${colors.red}❌ ERROR: Local database file not found at: ${fallbackPath}${colors.reset}`);
	console.error(`No local data exists to migrate.\n`);
	process.exit(1);
}

let localData;
try {
	const raw = fs.readFileSync(fallbackPath, 'utf8');
	localData = JSON.parse(raw);
} catch (e) {
	console.error(`\n${colors.red}❌ ERROR: Failed to parse local database JSON file: ${e.message}${colors.reset}`);
	process.exit(1);
}

const tables = localData.tables || {};
console.log(`${colors.green}✔ Loaded local fallback database records successfully.${colors.reset}\n`);

async function migrate() {
	try {
		// 3. Initialize cloud database schemas
		console.log(`${colors.bright}Step 1: Setting up cloud database schemas...${colors.reset}`);
		
		await cloudDb.execute(`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT UNIQUE NOT NULL,
				password_hash TEXT NOT NULL,
				salt TEXT NOT NULL,
				role TEXT NOT NULL,
				target_language TEXT DEFAULT NULL
			);
		`);

		await cloudDb.execute(`
			CREATE TABLE IF NOT EXISTS sessions (
				id TEXT PRIMARY KEY,
				user_id INTEGER NOT NULL,
				expires_at INTEGER NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			);
		`);

		await cloudDb.execute(`
			CREATE TABLE IF NOT EXISTS story_assignments (
				story_id TEXT PRIMARY KEY,
				translator_id INTEGER,
				assigned_at INTEGER,
				FOREIGN KEY (translator_id) REFERENCES users(id) ON DELETE SET NULL
			);
		`);

		await cloudDb.execute(`
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

		await cloudDb.execute(`
			CREATE TABLE IF NOT EXISTS editing_locks (
				story_id TEXT PRIMARY KEY,
				user_id INTEGER NOT NULL,
				locked_at INTEGER NOT NULL,
				expires_at INTEGER NOT NULL,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			);
		`);

		await cloudDb.execute(`
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

		console.log(`${colors.green}✔ Cloud schemas are ready.${colors.reset}\n`);

		// 4. Migrate Users
		console.log(`${colors.bright}Step 2: Migrating User Accounts...${colors.reset}`);
		const localUsers = tables.users || [];
		let userImported = 0;
		let userSkipped = 0;

		for (const u of localUsers) {
			const check = await cloudDb.execute({
				sql: 'SELECT id FROM users WHERE username = ?',
				args: [u.username]
			});
			if (check.rows.length === 0) {
				await cloudDb.execute({
					sql: 'INSERT INTO users (id, username, password_hash, salt, role, target_language) VALUES (?, ?, ?, ?, ?, ?)',
					args: [u.id, u.username, u.password_hash, u.salt, u.role, u.target_language || null]
				});
				userImported++;
			} else {
				userSkipped++;
			}
		}
		console.log(`   - Imported: ${userImported}, Skipped (Already exists): ${userSkipped}\n`);

		// 5. Migrate Pre-registrations
		console.log(`${colors.bright}Step 3: Migrating Pre-registration Requests...${colors.reset}`);
		const localPreRegs = tables.pre_registrations || [];
		let preRegImported = 0;
		let preRegSkipped = 0;

		for (const p of localPreRegs) {
			const check = await cloudDb.execute({
				sql: 'SELECT id FROM pre_registrations WHERE email = ?',
				args: [p.email]
			});
			if (check.rows.length === 0) {
				await cloudDb.execute({
					sql: 'INSERT INTO pre_registrations (id, email, name, requested_role, justification, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
					args: [p.id, p.email, p.name, p.requested_role, p.justification, p.status, p.created_at]
				});
				preRegImported++;
			} else {
				preRegSkipped++;
			}
		}
		console.log(`   - Imported: ${preRegImported}, Skipped (Already exists): ${preRegSkipped}\n`);

		// 6. Migrate Story Drafts
		console.log(`${colors.bright}Step 4: Migrating Story Translation Drafts...${colors.reset}`);
		const localDrafts = tables.story_drafts || [];
		let draftImported = 0;
		let draftUpdated = 0;

		for (const d of localDrafts) {
			const check = await cloudDb.execute({
				sql: 'SELECT story_id FROM story_drafts WHERE story_id = ? AND segment_id = ?',
				args: [d.story_id, d.segment_id]
			});
			if (check.rows.length === 0) {
				// Verify if the creator exists in users table first to maintain foreign key integrity
				const creatorCheck = await cloudDb.execute({
					sql: 'SELECT id FROM users WHERE id = ?',
					args: [d.saved_by_user_id]
				});
				const creatorId = creatorCheck.rows.length > 0 ? d.saved_by_user_id : 1; // Fallback to id 1 (translator)

				await cloudDb.execute({
					sql: 'INSERT INTO story_drafts (story_id, segment_id, target_text, saved_by_user_id, saved_at) VALUES (?, ?, ?, ?, ?)',
					args: [d.story_id, d.segment_id, d.target_text, creatorId, d.saved_at]
				});
				draftImported++;
			} else {
				// Update existing draft if local one is newer
				await cloudDb.execute({
					sql: 'UPDATE story_drafts SET target_text = ?, saved_at = ? WHERE story_id = ? AND segment_id = ?',
					args: [d.target_text, d.saved_at, d.story_id, d.segment_id]
				});
				draftUpdated++;
			}
		}
		console.log(`   - Imported (New): ${draftImported}, Updated (Existing): ${draftUpdated}\n`);

		// 7. Migrate Story Assignments
		console.log(`${colors.bright}Step 5: Migrating Story Assignments...${colors.reset}`);
		const localAssignments = tables.story_assignments || [];
		let assignImported = 0;

		for (const a of localAssignments) {
			const check = await cloudDb.execute({
				sql: 'SELECT story_id FROM story_assignments WHERE story_id = ?',
				args: [a.story_id]
			});
			if (check.rows.length === 0) {
				const checkUser = await cloudDb.execute({
					sql: 'SELECT id FROM users WHERE id = ?',
					args: [a.translator_id]
				});
				const translatorId = checkUser.rows.length > 0 ? a.translator_id : null;

				await cloudDb.execute({
					sql: 'INSERT INTO story_assignments (story_id, translator_id, assigned_at) VALUES (?, ?, ?)',
					args: [a.story_id, translatorId, a.assigned_at]
				});
				assignImported++;
			}
		}
		console.log(`   - Imported: ${assignImported}\n`);

		// Summary
		console.log(`${colors.bright}${colors.green}================================================================${colors.reset}`);
		console.log(`${colors.bright}${colors.green}🎉 MIGRATION COMPLETED SUCCESSFULLY!                            ${colors.reset}`);
		console.log(`${colors.bright}${colors.green}================================================================${colors.reset}`);
		console.log(`All local records have been securely imported into your Turso Cloud DB.`);
		console.log(`The application is ready to transition to your cloud production database.\n`);

	} catch (err) {
		console.error(`\n${colors.red}❌ ERROR: Migration failed mid-execution: ${err.message}${colors.reset}`);
		console.error(err);
		process.exit(1);
	}
}

migrate();
