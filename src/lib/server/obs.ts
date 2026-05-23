import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';

export type ObsSegment = {
	id: string;
	text: string;
	imageUrl?: string;
};

export type ObsStory = {
	storyNumber: number;
	storyId: string;
	title: string;
	segments: ObsSegment[];
	sourcePath?: string;
};

const STORY_FILE_RE = /^(\d{1,2})\.md$/;

export function sortStoryFileNames(fileNames: string[]): string[] {
	return [...fileNames].sort((a, b) => {
		const aMatch = a.match(STORY_FILE_RE);
		const bMatch = b.match(STORY_FILE_RE);

		if (!aMatch && !bMatch) return a.localeCompare(b);
		if (!aMatch) return 1;
		if (!bMatch) return -1;

		return Number(aMatch[1]) - Number(bMatch[1]);
	});
}

export function parseObsStoryMarkdown(markdown: string, storyNumber: number): ObsStory {
	const lines = markdown.split(/\r?\n/);
	const titleMatch = lines.find((line) => /^#\s+\d+\.\s+/.test(line))?.match(/^#\s+\d+\.\s+(.+)$/);
	const title = titleMatch?.[1]?.trim() ?? `Story ${storyNumber}`;

	const paragraphs: string[] = [];
	let current: string[] = [];

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
	const segments: ObsSegment[] = [];
	let lastImageUrl: string | undefined = undefined;
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

export function getSourceFileUrl(storyId: string): string {
	const template = process.env.SOURCE_FILE_URL_TEMPLATE || 'https://git.door43.org/unfoldingWord/en_obs/raw/branch/master/content/{storyId}.md';
	return template.replace('{storyId}', storyId);
}

export async function parseObsStoryFile(filePath: string): Promise<ObsStory> {
	const fileName = filePath.split(/[\\/]/).pop() ?? '';
	const match = fileName.match(STORY_FILE_RE);
	if (!match) {
		throw new Error(`Invalid OBS story file name: ${fileName}`);
	}

	const storyNumber = Number(match[1]);
	const storyId = String(storyNumber).padStart(2, '0');
	let markdown: string;

	try {
		markdown = await readFile(filePath, 'utf8');
	} catch (err: any) {
		if (err.code === 'ENOENT') {
			const url = getSourceFileUrl(storyId);
			console.log(`Local story file ${filePath} not found. Fetching dynamically from remote URL: ${url}`);
			const res = await fetch(url);
			if (!res.ok) {
				throw new Error(`Failed to fetch original story ${storyId} from remote: ${res.statusText}`);
			}
			markdown = await res.text();
		} else {
			throw err;
		}
	}

	const story = parseObsStoryMarkdown(markdown, storyNumber);

	return {
		...story,
		sourcePath: filePath
	};
}

export async function parseObsContentDirectory(contentDirPath: string): Promise<ObsStory[]> {
	let storyFiles: string[] = [];
	try {
		const entries = await readdir(contentDirPath, { withFileTypes: true });
		storyFiles = entries
			.filter((entry) => entry.isFile() && STORY_FILE_RE.test(entry.name))
			.map((entry) => entry.name);
	} catch (err: any) {
		if (err.code === 'ENOENT') {
			console.log(`Local content directory ${contentDirPath} not found. Generating story file list 01-50 dynamically.`);
			storyFiles = Array.from({ length: 50 }, (_, i) => `${String(i + 1).padStart(2, '0')}.md`);
		} else {
			throw err;
		}
	}

	const sorted = sortStoryFileNames(storyFiles);
	const stories: ObsStory[] = [];

	for (const fileName of sorted) {
		const fullPath = join(contentDirPath, fileName);
		stories.push(await parseObsStoryFile(fullPath));
	}

	return stories;
}

export async function parseObsStoryById(
	contentDirPath: string,
	storyId: string
): Promise<ObsStory> {
	const normalizedId = storyId.padStart(2, '0');
	const filePath = join(contentDirPath, `${normalizedId}.md`);
	return parseObsStoryFile(filePath);
}

export const LANGUAGE_CODE_MAP: Record<string, string> = {
	'Amharic': 'am',
	'Assamese': 'as',
	'Bengali': 'bn',
	'Gujarati': 'gu',
	'Hindi': 'hi',
	'Indonesian': 'id',
	'Kannada': 'kn',
	'Malay': 'ms',
	'Malayalam': 'ml',
	'Marathi': 'mr',
	'Nepali': 'ne',
	'Odia': 'or',
	'Punjabi': 'pa',
	'Sinhala': 'si',
	'Swahili': 'sw',
	'Tamil': 'ta',
	'Telugu': 'te',
	'Urdu': 'ur'
};

export async function publishStory(
	storyId: string,
	translations: Record<string, { targetText: string }> | null,
	targetLanguage: string = 'Malayalam'
): Promise<void> {
	const normalizedId = storyId.padStart(2, '0');
	const enContentDir = join(process.cwd(), 'en_obs', 'content');
	const story = await parseObsStoryById(enContentDir, normalizedId);

	const lines: string[] = [];

	// Add Title Line
	lines.push(`# ${story.storyNumber}. ${story.title}`);
	lines.push('');

	// Add alternating segments and images
	for (const segment of story.segments) {
		if (segment.imageUrl) {
			lines.push(`![OBS Image](${segment.imageUrl})`);
			lines.push('');
		}

		const targetText = translations?.[segment.id]?.targetText || segment.text;
		lines.push(targetText);
		lines.push('');
	}

	// Extract original footer
	let footerLine = '_A Bible story from: Scripture_';
	if (story.sourcePath) {
		try {
			let rawEn: string;
			try {
				rawEn = await readFile(story.sourcePath, 'utf8');
			} catch (err: any) {
				if (err.code === 'ENOENT') {
					// Fallback if original file path was local but missing (e.g. Vercel)
					const url = getSourceFileUrl(normalizedId);
					const res = await fetch(url);
					rawEn = res.ok ? await res.text() : '';
				} else {
					throw err;
				}
			}
			if (rawEn) {
				const rawLines = rawEn.split(/\r?\n/);
				const found = rawLines.find((line) => line.trim().startsWith('_A Bible story from:'));
				if (found) {
					footerLine = found.trim();
				}
			}
		} catch (e) {
			console.error('Failed to read English footer line:', e);
		}
	}
	lines.push(footerLine);

	// Resolve language folder prefix
	const langKey = Object.keys(LANGUAGE_CODE_MAP).find(
		(key) => key.toLowerCase() === targetLanguage.toLowerCase()
	) || 'Malayalam';
	const langPrefix = LANGUAGE_CODE_MAP[langKey] || 'ml';

	const content = lines.join('\n');

	// Write target file recursively (local fallback)
	const targetPath = join(process.cwd(), `${langPrefix}_obs`, 'content', `${normalizedId}.md`);
	await mkdir(dirname(targetPath), { recursive: true });
	await writeFile(targetPath, content, 'utf8');

	// GitHub Integration: If GITHUB_PAT, GITHUB_REPO_OWNER and GITHUB_REPO_NAME are configured, push automatically!
	const githubPat = process.env.GITHUB_PAT;
	let githubOwner = process.env.GITHUB_REPO_OWNER;
	let githubRepo = process.env.GITHUB_REPO_NAME;

	if (githubPat && githubOwner && githubRepo) {
		// Clean up potential full URLs in env variables
		if (githubOwner.includes('github.com/')) {
			githubOwner = githubOwner.split('github.com/').pop()?.split('/')[0] || githubOwner;
		} else if (githubOwner.includes('/')) {
			githubOwner = githubOwner.split('/').filter(Boolean).pop() || githubOwner;
		}

		if (githubRepo.includes('github.com/')) {
			const parts = githubRepo.split('github.com/').pop()?.split('/') || [];
			githubRepo = parts[1] || parts[0] || githubRepo;
		} else if (githubRepo.includes('/')) {
			githubRepo = githubRepo.split('/').filter(Boolean).pop() || githubRepo;
		}

		const relativePath = `${langPrefix}_obs/content/${normalizedId}.md`;
		const githubUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${relativePath}`;
		
		console.log(`Publishing Story ${normalizedId} to GitHub repository: ${githubOwner}/${githubRepo}/${relativePath}`);
		
		let sha: string | undefined = undefined;

		// 1. Check if file already exists on GitHub to obtain its SHA
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
				console.log(`Found existing file on GitHub with SHA: ${sha}`);
			}
		} catch (e) {
			console.error('Error fetching file SHA from GitHub:', e);
		}

		// 2. Commit the file using PUT contents API
		try {
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
					message: `Publish Malayalam OBS Story ${normalizedId}`,
					content: Buffer.from(content, 'utf8').toString('base64'),
					sha
				})
			});

			if (!putRes.ok) {
				const errBody = await putRes.text();
				throw new Error(`GitHub API returned ${putRes.status}: ${errBody}`);
			}
			console.log(`Successfully committed Story ${normalizedId} to GitHub!`);
		} catch (e) {
			console.error('Failed to commit to GitHub via Contents API:', e);
			throw new Error(`Failed to commit approved story to GitHub: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
}

export async function publishMalayalamStory(
	storyId: string,
	translations: Record<string, { targetText: string }> | null
): Promise<void> {
	await publishStory(storyId, translations, 'Malayalam');
}
