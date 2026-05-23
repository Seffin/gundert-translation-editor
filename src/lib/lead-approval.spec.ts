import { describe, expect, it } from 'vitest';
import { approveLeadApprovalItem, type LeadApprovalSourceStory } from '$lib/lead-approval';
import { buildLeadApprovalItems } from '$lib/server/lead-approval';

const STORIES: LeadApprovalSourceStory[] = [
	{
		storyId: '03',
		storyNumber: 3,
		title: 'The Flood',
		status: 'In Review',
		assignee: 'Sarah Jenkins',
		segmentCount: 14
	},
	{
		storyId: '06',
		storyNumber: 6,
		title: 'A New King',
		status: 'In Review',
		assignee: 'David Mbeki',
		segmentCount: 12
	},
	{
		storyId: '07',
		storyNumber: 7,
		title: 'A Faithful Servant',
		status: 'Draft',
		assignee: 'Maria Garcia',
		segmentCount: 10
	}
];

describe('lead approval queue', () => {
	it('builds blocked and ready approval states from review blockers', () => {
		const items = buildLeadApprovalItems(STORIES);

		expect(items).toHaveLength(2);
		expect(items[0].storyId).toBe('03');
		expect(items[0].canApprove).toBe(false);
		expect(items[0].status).toBe('Blocked');
		expect(items[0].blockers).toContain('1 unresolved comment');

		expect(items[1].storyId).toBe('06');
		expect(items[1].canApprove).toBe(true);
		expect(items[1].status).toBe('In Review');
		expect(items[1].blockers).toEqual([]);
	});

	it('approves ready stories using the transition and gate engine', () => {
		const readyItem = buildLeadApprovalItems(STORIES)[1];
		const approved = approveLeadApprovalItem(readyItem);

		expect(approved.status).toBe('Approved');
		expect(approved.canApprove).toBe(false);
		expect(approved.blockers).toEqual([]);
	});

	it('rejects approval when blockers are present', () => {
		const blockedItem = buildLeadApprovalItems(STORIES)[0];

		expect(() => approveLeadApprovalItem(blockedItem)).toThrow(/blocked approval/i);
	});

	it('supports externally supplied blocker state from reviewer comments', () => {
		const items = buildLeadApprovalItems(STORIES, (story) => ({
			unresolvedCommentCount: story.storyId === '06' ? 2 : 0,
			hasBlockingConflicts: false
		}));

		const gated = items.find((item) => item.storyId === '06');
		expect(gated?.canApprove).toBe(false);
		expect(gated?.blockers).toContain('2 unresolved comments');
	});
});
