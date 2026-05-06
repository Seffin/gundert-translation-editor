import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LeadApprovalGate from '$lib/components/LeadApprovalGate.svelte';
import type { LeadApprovalItem } from '$lib/lead-approval';

const ITEMS: LeadApprovalItem[] = [
	{
		storyId: '03',
		storyNumber: 3,
		title: 'The Flood',
		status: 'Blocked',
		assignee: 'Sarah Jenkins',
		segmentCount: 14,
		unresolvedCommentCount: 1,
		hasBlockingConflicts: false,
		blockers: ['1 unresolved comment'],
		canApprove: false
	},
	{
		storyId: '06',
		storyNumber: 6,
		title: 'A New King',
		status: 'In Review',
		assignee: 'David Mbeki',
		segmentCount: 12,
		unresolvedCommentCount: 0,
		hasBlockingConflicts: false,
		blockers: [],
		canApprove: true
	}
];

describe('LeadApprovalGate', () => {
	it('renders blocked vs ready approval states', async () => {
		render(LeadApprovalGate, { items: ITEMS });

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Project Lead Approval');
		await expect.element(page.getByText('1 unresolved comment')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Approve story 06' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Blocked story 03' })).toBeDisabled();
	});

	it('approves ready stories and updates status message', async () => {
		render(LeadApprovalGate, { items: ITEMS });

		await page.getByRole('button', { name: 'Approve story 06' }).click();

		await expect.element(page.getByTestId('approval-message')).toHaveTextContent(
			'Story 06 approved for publication.'
		);
		await expect.element(page.getByRole('button', { name: 'Approved story 06' })).toBeDisabled();
	});
});
