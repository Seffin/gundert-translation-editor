import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CommentThread from './CommentThread.svelte';

describe('CommentThread', () => {
	it('displays empty state when no comments exist', async () => {
		render(CommentThread, { storyId: 'story-1', currentUserId: 'reviewer-1' });

		const emptyState = page.getByText('No comments yet.');
		await expect.element(emptyState).toBeInTheDocument();
	});

	it('renders the comment thread header with title', async () => {
		render(CommentThread, { storyId: 'story-1', currentUserId: 'reviewer-1' });

		const header = page.getByText('Reviewer Comments');
		await expect.element(header).toBeInTheDocument();
	});

	it('displays add comment textarea', async () => {
		render(CommentThread, { storyId: 'story-1', currentUserId: 'reviewer-1' });

		const textarea = page.getByPlaceholder('Add a comment...');
		await expect.element(textarea).toBeInTheDocument();
	});

	it('renders add button in initial disabled state', async () => {
		render(CommentThread, { storyId: 'story-1', currentUserId: 'reviewer-1' });

		const addBtn = page.getByRole('button', { name: 'Add Comment' });
		await expect.element(addBtn).toBeDisabled();
	});
});
