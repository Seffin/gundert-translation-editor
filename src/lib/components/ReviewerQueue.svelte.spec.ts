import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ReviewerQueue from '$lib/components/ReviewerQueue.svelte';
import type { ReviewerQueueItem } from '$lib/reviewer-queue';

const ITEMS: ReviewerQueueItem[] = [
	{
		storyId: '03',
		storyNumber: 3,
		title: 'The Flood',
		status: 'In Review',
		assignee: 'Sarah Jenkins',
		segmentCount: 14,
		pendingComments: 2
	},
	{
		storyId: '06',
		storyNumber: 6,
		title: 'A New King',
		status: 'In Review',
		assignee: 'David Mbeki',
		segmentCount: 12,
		pendingComments: 1
	}
];

describe('ReviewerQueue', () => {
	beforeEach(() => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ success: true, resolvedCount: 1 }), { status: 200 })
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders reviewer queue items with resolve actions', async () => {
		render(ReviewerQueue, { items: ITEMS });

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Reviewer Queue');
		await expect.element(page.getByText('The Flood')).toBeInTheDocument();
		await expect.element(page.getByText('2 open comments')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Resolve for 03' })).toBeInTheDocument();
	});

	it('removes a story from the queue when reviewer resolves it', async () => {
		render(ReviewerQueue, { items: ITEMS });

		await page.getByRole('button', { name: 'Resolve for 03' }).click();

		await expect.element(page.getByText('Resolved review for story 03')).toBeInTheDocument();
		await expect.element(page.getByText('The Flood')).not.toBeInTheDocument();
		await expect.element(page.getByText('A New King')).toBeInTheDocument();
	});
});