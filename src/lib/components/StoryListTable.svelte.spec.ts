import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StoryListTable from '$lib/components/StoryListTable.svelte';
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
	}
];

describe('StoryListTable', () => {
	it('renders story rows with status and completion', async () => {
		render(StoryListTable, { stories: STORIES });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Open Bible Stories');
		await expect.element(page.getByText('The Creation')).toBeInTheDocument();
		await expect.element(page.getByText('In Review')).toBeInTheDocument();
		await expect.element(page.getByText('75%')).toBeInTheDocument();
	});
});
