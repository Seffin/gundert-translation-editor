import type { StoryStatus } from '$lib/server/story-list';

export type LeadApprovalSourceStory = {
	storyId: string;
	storyNumber: number;
	title: string;
	status: StoryStatus;
	assignee: string;
	segmentCount: number;
};

export type LeadApprovalItem = {
	storyId: string;
	storyNumber: number;
	title: string;
	status: 'In Review' | 'Blocked' | 'Approved';
	assignee: string;
	segmentCount: number;
	unresolvedCommentCount: number;
	hasBlockingConflicts: boolean;
	blockers: string[];
	canApprove: boolean;
};

export function approveLeadApprovalItem(item: LeadApprovalItem): LeadApprovalItem {
	if (!item.canApprove) {
		throw new Error(`Blocked approval: ${item.blockers.join('; ')}`);
	}

	return {
		...item,
		status: 'Approved',
		canApprove: false,
		blockers: []
	};
}
