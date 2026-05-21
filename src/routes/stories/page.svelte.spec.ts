import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';
import type { StoryListItem } from '$lib/server/story-list';

describe('+page.svelte', () => {
	it('shows a source unavailable message and does not render the story table', async () => {
		render(Page, { data: { stories: [], sourceAvailable: false } });

		await expect.element(page.getByText('OBS source folder was not found')).toBeInTheDocument();
		await expect.element(page.getByRole('table')).not.toBeInTheDocument();
	});

	it('renders the story list table when source is available', async () => {
		const stories: StoryListItem[] = [
			{
				storyId: '01',
				storyNumber: 1,
				title: 'The Creation',
				status: 'Draft',
				completionPercent: 20,
				assignee: 'Unassigned',
				segmentCount: 16
			}
		];

		render(Page, { data: { stories, sourceAvailable: true } });

		await expect.element(page.getByRole('table')).toBeInTheDocument();
		await expect.element(page.getByText('The Creation')).toBeInTheDocument();
	});
});
