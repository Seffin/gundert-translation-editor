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

export async function parseObsStoryFile(filePath: string): Promise<ObsStory> {
	const fileName = filePath.split(/[\\/]/).pop() ?? '';
	const match = fileName.match(STORY_FILE_RE);
	if (!match) {
		throw new Error(`Invalid OBS story file name: ${fileName}`);
	}

	const storyNumber = Number(match[1]);
	const markdown = await readFile(filePath, 'utf8');
	const story = parseObsStoryMarkdown(markdown, storyNumber);

	return {
		...story,
		sourcePath: filePath
	};
}

export async function parseObsContentDirectory(contentDirPath: string): Promise<ObsStory[]> {
	const entries = await readdir(contentDirPath, { withFileTypes: true });
	const storyFiles = entries
		.filter((entry) => entry.isFile() && STORY_FILE_RE.test(entry.name))
		.map((entry) => entry.name);

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

export async function publishMalayalamStory(
	storyId: string,
	translations: Record<string, { targetText: string }> | null
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
			const rawEn = await readFile(story.sourcePath, 'utf8');
			const rawLines = rawEn.split(/\r?\n/);
			const found = rawLines.find((line) => line.trim().startsWith('_A Bible story from:'));
			if (found) {
				footerLine = found.trim();
			}
		} catch (e) {
			console.error('Failed to read English footer line:', e);
		}
	}
	lines.push(footerLine);

	// Write target file recursively
	const targetPath = join(process.cwd(), 'ml_obs', 'content', `${normalizedId}.md`);
	await mkdir(dirname(targetPath), { recursive: true });
	await writeFile(targetPath, lines.join('\n'), 'utf8');
}
