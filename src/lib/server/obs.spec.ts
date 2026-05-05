import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseObsContentDirectory, parseObsStoryMarkdown, sortStoryFileNames } from '$lib/server/obs';

const SAMPLE_STORY = `# 29. The Story of the Unmerciful Servant

![OBS Image](https://cdn.door43.org/obs/jpg/360px/obs-en-29-01.jpg)

One day, Peter asked Jesus, "Master, how many times should I forgive my brother when he sins against me?"

![OBS Image](https://cdn.door43.org/obs/jpg/360px/obs-en-29-02.jpg)

Jesus said, "The kingdom of God is like a king who wanted to settle accounts with his servants."

_A Bible story from: Matthew 18:21-35_
`;

describe('OBS parser', () => {
	it('extracts title and only content segments from story markdown', () => {
		const story = parseObsStoryMarkdown(SAMPLE_STORY, 29);

		expect(story.title).toBe('The Story of the Unmerciful Servant');
		expect(story.segments).toHaveLength(2);
		expect(story.segments[0].text).toContain('One day, Peter asked Jesus');
		expect(story.segments[1].text).toContain('The kingdom of God is like a king');
	});

	it('sorts story files by canonical numeric order', () => {
		const sorted = sortStoryFileNames(['10.md', '02.md', '01.md', '50.md']);
		expect(sorted).toEqual(['01.md', '02.md', '10.md', '50.md']);
	});

	it('parses content directory in canonical order and preserves segment sequence', async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), 'obs-parser-'));
		try {
			const story01 = `# 1. The Creation\n\nFirst segment.\n\nSecond segment.\n\nThird segment.\n`;
			const story02 = `# 2. Sin Enters the World\n\nOnly segment.\n`;
			const story10 = `# 10. The Ten Plagues\n\nPlague segment.\n`;

			await writeFile(join(tempRoot, '10.md'), story10, 'utf8');
			await writeFile(join(tempRoot, '02.md'), story02, 'utf8');
			await writeFile(join(tempRoot, '01.md'), story01, 'utf8');
			await writeFile(join(tempRoot, 'front.md'), '# Front matter', 'utf8');

			const stories = await parseObsContentDirectory(tempRoot);

			expect(stories.map((story) => story.storyId)).toEqual(['01', '02', '10']);
			expect(stories[0].segments.map((segment) => segment.text)).toEqual([
				'First segment.',
				'Second segment.',
				'Third segment.'
			]);
		} finally {
			await rm(tempRoot, { recursive: true, force: true });
		}
	});
});
