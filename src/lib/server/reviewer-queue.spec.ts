import { describe, expect, it } from 'vitest';
import {
	buildReviewerQueueItems,
	resolveReviewerQueueItem,
	type ReviewerQueueItem
} from '$lib/reviewer-queue';
import type { StoryListItem } from '$lib/server/story-list';

const STORIES: StoryListItem[] = [
	{
		storyId: '01',
		storyNumber: 1,
		title: 'The Creation',
		status: 'Draft',
		completionPercent: 20,
		assignee: 'Unassigned',
		segmentCount: 16
	},
	{
		storyId: '03',
		storyNumber: 3,
		title: 'The Flood',
		status: 'In Review',
		completionPercent: 75,
		assignee: 'Sarah Jenkins',
		segmentCount: 14
	},
	{
		storyId: '06',
		storyNumber: 6,
		title: 'A New King',
		status: 'In Review',
		completionPercent: 75,
		assignee: 'David Mbeki',
		segmentCount: 12
	}
];

describe('reviewer queue model', () => {
	it('builds queue items from stories currently in review', () => {
		const items = buildReviewerQueueItems(STORIES);

		expect(items).toHaveLength(2);
		expect(items[0].storyId).toBe('03');
		expect(items[1].storyId).toBe('06');
		expect(items[0].pendingComments).toBeGreaterThan(0);
		expect(items[0].status).toBe('In Review');
	});

	it('returns a resolved item moved back to draft using reviewer permissions', () => {
		const item: ReviewerQueueItem = {
			storyId: '03',
			storyNumber: 3,
			title: 'The Flood',
			status: 'In Review',
			assignee: 'Sarah Jenkins',
			segmentCount: 14,
			pendingComments: 2
		};

		const resolved = resolveReviewerQueueItem(item);

		expect(resolved.status).toBe('Draft');
		expect(resolved.pendingComments).toBe(0);
	});

	it('uses supplied unresolved comment counts when provided', () => {
		const items = buildReviewerQueueItems(STORIES, (story) => (story.storyId === '03' ? 4 : 0));

		expect(items[0].pendingComments).toBe(4);
		expect(items[1].pendingComments).toBe(0);
	});
});
