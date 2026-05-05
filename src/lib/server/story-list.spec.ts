import { describe, expect, it } from 'vitest';
import type { ObsStory } from '$lib/server/obs';
import {
	buildStoryListItems,
	deriveCompletionPercent,
	deriveStoryStatus
} from '$lib/server/story-list';

function makeStory(storyNumber: number, title: string): ObsStory {
	return {
		storyNumber,
		storyId: String(storyNumber).padStart(2, '0'),
		title,
		segments: [
			{ id: `${String(storyNumber).padStart(2, '0')}:01`, text: 'Segment one' },
			{ id: `${String(storyNumber).padStart(2, '0')}:02`, text: 'Segment two' }
		]
	};
}

describe('story list mapping', () => {
	it('derives status by deterministic story-number rule', () => {
		expect(deriveStoryStatus(1)).toBe('Draft');
		expect(deriveStoryStatus(3)).toBe('In Review');
		expect(deriveStoryStatus(5)).toBe('Approved');
		expect(deriveStoryStatus(10)).toBe('Blocked');
	});

	it('maps statuses to expected completion percentages', () => {
		expect(deriveCompletionPercent('Draft')).toBe(20);
		expect(deriveCompletionPercent('In Review')).toBe(75);
		expect(deriveCompletionPercent('Approved')).toBe(100);
		expect(deriveCompletionPercent('Blocked')).toBe(40);
	});

	it('builds story list rows with stable IDs and segment counts', () => {
		const stories = [makeStory(1, 'The Creation'), makeStory(10, 'The Ten Plagues')];
		const rows = buildStoryListItems(stories);

		expect(rows).toHaveLength(2);
		expect(rows[0].storyId).toBe('01');
		expect(rows[0].title).toBe('The Creation');
		expect(rows[0].segmentCount).toBe(2);
		expect(rows[1].status).toBe('Blocked');
	});
});
