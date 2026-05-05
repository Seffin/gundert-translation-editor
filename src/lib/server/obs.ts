import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type ObsSegment = {
	id: string;
	text: string;
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

	const contentParagraphs = paragraphs.filter((paragraph) => {
		if (paragraph.startsWith('#')) return false;
		if (paragraph.startsWith('![')) return false;
		if (paragraph.startsWith('_A Bible story from:')) return false;
		return true;
	});

	const storyId = String(storyNumber).padStart(2, '0');
	const segments = contentParagraphs.map((text, index) => ({
		id: `${storyId}:${String(index + 1).padStart(2, '0')}`,
		text
	}));

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
