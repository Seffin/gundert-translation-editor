import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StoryEditorBaseline from '$lib/components/StoryEditorBaseline.svelte';
import type { StoryEditorModel } from '$lib/server/editor';

const STORY: StoryEditorModel = {
	storyId: '01',
	storyNumber: 1,
	title: 'The Creation',
	description: 'Editor baseline test story',
	segments: [
		{
			id: '01:01',
			sourceText: 'In the beginning, God created the heavens and the earth.',
			targetText: '',
			targetLanguage: 'Hindi',
			status: 'Done',
			draftedByGemini: true,
			updatedAtLabel: '2 mins ago'
		},
		{
			id: '01:02',
			sourceText: 'And God said, "Let there be light."',
			targetText: '',
			targetLanguage: 'Malayalam',
			status: 'Draft',
			draftedByGemini: false,
			updatedAtLabel: 'Not generated'
		}
	]
};

describe('StoryEditorBaseline', () => {
	it('renders story header and source/target columns', async () => {
		render(StoryEditorBaseline, { story: STORY });

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('01: The Creation');
		await expect
			.element(page.getByText('In the beginning, God created the heavens and the earth.'))
			.toBeInTheDocument();
		await expect.element(page.getByText('Hindi')).toBeInTheDocument();
		await expect.element(page.getByText('DRAFTED BY GEMINI • 2 mins ago')).toBeInTheDocument();
	});
});
