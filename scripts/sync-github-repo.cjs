/**
 * Gundert Translation Editor - GitHub Translation Sync Utility (CommonJS)
 * 
 * This script allows Project Leads and developers to manually synchronize approved
 * Malayalam OBS story translations from the database (Turso Cloud or fallback JSON)
 * directly into the configured remote GitHub repository.
 * 
 * Usage:
 *   node scripts/sync-github-repo.cjs [--story ID] [--lang ml]
 * 
 * Example:
 *   node scripts/sync-github-repo.cjs --story 36
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
console.log(`${colors.bright}${colors.cyan}   Gundert Translation Editor - GitHub Translation Sync Utility   ${colors.reset}`);
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

const githubPat = process.env.GITHUB_PAT;
let githubOwner = process.env.GITHUB_REPO_OWNER;
let githubRepo = process.env.GITHUB_REPO_NAME;
const tursoUrl = process.env.TURSO_DB_URL;
const tursoToken = process.env.TURSO_DB_TOKEN;

if (!githubPat || !githubOwner || !githubRepo) {
	console.error(`\n${colors.red}❌ ERROR: GITHUB_PAT, GITHUB_REPO_OWNER, or GITHUB_REPO_NAME is missing in .env.${colors.reset}\n`);
	process.exit(1);
}

// Clean up potential full URLs in env variables
if (githubOwner.includes('github.com/')) {
	githubOwner = githubOwner.split('github.com/').pop().split('/')[0];
} else if (githubOwner.includes('/')) {
	githubOwner = githubOwner.split('/').filter(Boolean).pop();
}

if (githubRepo.includes('github.com/')) {
	const parts = githubRepo.split('github.com/').pop().split('/');
	githubRepo = parts[1] || parts[0];
} else if (githubRepo.includes('/')) {
	githubRepo = githubRepo.split('/').filter(Boolean).pop();
}

console.log(`${colors.blue}ℹ Target GitHub Repository: ${colors.bright}${githubOwner}/${githubRepo}${colors.reset}`);

// 2. Parse CLI Arguments
const args = process.argv.slice(2);
let targetStoryId = null;
let targetLangPrefix = 'ml'; // Malayalam by default

for (let i = 0; i < args.length; i++) {
	if (args[i] === '--story' && args[i + 1]) {
		targetStoryId = args[i + 1].padStart(2, '0');
		i++;
	} else if (args[i] === '--lang' && args[i + 1]) {
		targetLangPrefix = args[i + 1].toLowerCase();
		i++;
	}
}

if (!targetStoryId) {
	console.log(`${colors.yellow}⚠ No specific story ID provided via --story. Defaulting to Malayalam Story 36 (contains active translations).${colors.reset}`);
	targetStoryId = '36';
}

// 3. Connect to Database and retrieve drafts
async function getDrafts() {
	if (tursoUrl) {
		console.log(`${colors.blue}ℹ Querying cloud database for drafts: ${tursoUrl}...${colors.reset}`);
		try {
			const cloudDb = createClient({
				url: tursoUrl,
				authToken: tursoToken
			});
			const result = await cloudDb.execute({
				sql: 'SELECT story_id, segment_id, target_text FROM story_drafts WHERE story_id = ?',
				args: [String(Number(targetStoryId))]
			});
			const drafts = {};
			result.rows.forEach(row => {
				drafts[row.segment_id] = { targetText: row.target_text };
			});
			return drafts;
		} catch (e) {
			console.warn(`${colors.yellow}⚠ Failed to query Turso cloud database: ${e.message}. Falling back to JSON database.${colors.reset}`);
		}
	}

	// Fallback to JSON Database
	const fallbackPath = path.join(__dirname, '..', 'data', 'gundert_fallback.json');
	if (fs.existsSync(fallbackPath)) {
		console.log(`${colors.blue}ℹ Loading drafts from local fallback database: ${fallbackPath}...${colors.reset}`);
		const raw = fs.readFileSync(fallbackPath, 'utf8');
		const dbData = JSON.parse(raw);
		const drafts = {};
		const storyDrafts = dbData.tables.story_drafts || [];
		storyDrafts.forEach(d => {
			if (d.story_id === String(Number(targetStoryId)) || d.story_id === targetStoryId) {
				drafts[d.segment_id] = { targetText: d.target_text };
			}
		});
		return drafts;
	} else {
		throw new Error('No local fallback or Turso database found.');
	}
}

// 4. SvelteKit equivalent OBS Markdown parsing
function parseObsStoryMarkdown(markdown, storyNumber) {
	const lines = markdown.split(/\r?\n/);
	const titleLine = lines.find((line) => /^#\s+\d+\.\s+/.test(line));
	const titleMatch = titleLine ? titleLine.match(/^#\s+\d+\.\s+(.+)$/) : null;
	const title = titleMatch ? titleMatch[1].trim() : `Story ${storyNumber}`;

	const paragraphs = [];
	let current = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.length === 0) {
			if (current.length > 0) {
				paragraphs.push(current.join(' ').trim());
				current = [];
			}
			continue;
		}
		current.push(trimmed);
	}

	if (current.length > 0) {
		paragraphs.push(current.join(' ').trim());
	}

	const storyId = String(storyNumber).padStart(2, '0');
	const segments = [];
	let lastImageUrl = undefined;
	let segmentCounter = 1;

	for (const paragraph of paragraphs) {
		if (paragraph.startsWith('#')) {
			continue;
		}
		if (paragraph.startsWith('![')) {
			const match = paragraph.match(/!\[.*?\]\((.*?)\)/);
			if (match) {
				lastImageUrl = match[1];
			}
			continue;
		}
		if (paragraph.startsWith('_A Bible story from:')) {
			continue;
		}

		segments.push({
			id: `${storyId}:${String(segmentCounter).padStart(2, '0')}`,
			text: paragraph,
			imageUrl: lastImageUrl
		});
		segmentCounter++;
		lastImageUrl = undefined;
	}

	return {
		storyNumber,
		storyId,
		title,
		segments
	};
}

async function run() {
	try {
		const storyNumber = Number(targetStoryId);
		const paddedStoryId = String(storyNumber).padStart(2, '0');

		// 1. Read the local English OBS template file
		const enFilePath = path.join(__dirname, '..', 'en_obs', 'content', `${paddedStoryId}.md`);
		let enMarkdown = '';
		if (fs.existsSync(enFilePath)) {
			enMarkdown = fs.readFileSync(enFilePath, 'utf8');
			console.log(`${colors.green}✔ Loaded English template from local path: ${enFilePath}${colors.reset}`);
		} else {
			const url = `https://git.door43.org/unfoldingWord/en_obs/raw/branch/master/content/${paddedStoryId}.md`;
			console.log(`${colors.blue}ℹ Local English file not found. Fetching from Door43: ${url}...${colors.reset}`);
			const res = await fetch(url);
			if (!res.ok) {
				throw new Error(`Failed to fetch original English story ${paddedStoryId}: ${res.statusText}`);
			}
			enMarkdown = await res.text();
		}

		const story = parseObsStoryMarkdown(enMarkdown, storyNumber);
		const translations = await getDrafts();

		if (Object.keys(translations).length === 0) {
			console.warn(`${colors.yellow}⚠ Warning: No translation drafts found in database for Story ${storyNumber}.${colors.reset}`);
		} else {
			console.log(`${colors.green}✔ Found ${Object.keys(translations).length} translated segments for Story ${storyNumber}.${colors.reset}`);
		}

		// 2. Compile Malayalam Markdown content
		const outputLines = [];
		outputLines.push(`# ${story.storyNumber}. ${story.title}`);
		outputLines.push('');

		for (const segment of story.segments) {
			if (segment.imageUrl) {
				outputLines.push(`![OBS Image](${segment.imageUrl})`);
				outputLines.push('');
			}

			const targetText = translations[segment.id]?.targetText || segment.text;
			outputLines.push(targetText);
			outputLines.push('');
		}

		// Extract original footer
		let footerLine = '_A Bible story from: Scripture_';
		const rawLines = enMarkdown.split(/\r?\n/);
		const found = rawLines.find((line) => line.trim().startsWith('_A Bible story from:'));
		if (found) {
			footerLine = found.trim();
		}
		outputLines.push(footerLine);

		const compiledContent = outputLines.join('\n');

		// 3. Write target file locally in workspace
		const localTargetPath = path.join(__dirname, '..', `${targetLangPrefix}_obs`, 'content', `${paddedStoryId}.md`);
		const localTargetDir = path.dirname(localTargetPath);
		if (!fs.existsSync(localTargetDir)) {
			fs.mkdirSync(localTargetDir, { recursive: true });
		}
		fs.writeFileSync(localTargetPath, compiledContent, 'utf8');
		console.log(`${colors.green}✔ Saved compiled markdown locally to: ${localTargetPath}${colors.reset}`);

		// 4. Push to remote GitHub Repository
		const relativePath = `${targetLangPrefix}_obs/content/${paddedStoryId}.md`;
		const githubUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${relativePath}`;

		console.log(`${colors.blue}ℹ Syncing to remote GitHub path: ${relativePath}...${colors.reset}`);

		let sha = undefined;

		// Check if file exists to get SHA (so PUT functions correctly as create or update)
		try {
			const getRes = await fetch(githubUrl, {
				headers: {
					Authorization: `Bearer ${githubPat}`,
					Accept: 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28',
					'User-Agent': 'Gundert-Translation-Editor'
				}
			});
			if (getRes.ok) {
				const body = await getRes.json();
				sha = body.sha;
				console.log(`${colors.blue}ℹ File already exists on GitHub. Updating with SHA: ${sha}${colors.reset}`);
			}
		} catch (e) {
			console.log(`${colors.yellow}⚠ Could not check remote file existence (might be empty/new repo): ${e.message}${colors.reset}`);
		}

		// Commit content via PUT Contents API
		const putRes = await fetch(githubUrl, {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${githubPat}`,
				Accept: 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28',
				'User-Agent': 'Gundert-Translation-Editor',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				message: `Publish Malayalam OBS Story ${paddedStoryId} (Lead Approved)`,
				content: Buffer.from(compiledContent, 'utf8').toString('base64'),
				sha
			})
		});

		if (!putRes.ok) {
			const errBody = await putRes.text();
			throw new Error(`GitHub API returned ${putRes.status}: ${errBody}`);
		}

		console.log(`\n${colors.bright}${colors.green}================================================================${colors.reset}`);
		console.log(`${colors.bright}${colors.green}🎉 SUCCESS: Story ${paddedStoryId} synced to GitHub successfully!${colors.reset}`);
		console.log(`${colors.bright}${colors.green}================================================================${colors.reset}\n`);

	} catch (err) {
		console.error(`\n${colors.red}❌ ERROR: Sync failed: ${err.message}${colors.reset}\n`);
		process.exit(1);
	}
}

run();
