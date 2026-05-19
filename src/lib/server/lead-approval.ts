import type { LeadApprovalItem, LeadApprovalSourceStory } from '$lib/lead-approval';
import { checkApprovalGate } from '$lib/server/review-blockers';

type ReviewBlockerState = {
	unresolvedCommentCount: number;
	hasBlockingConflicts: boolean;
};

function deriveReviewBlockerState(storyNumber: number): ReviewBlockerState {
	return {
		unresolvedCommentCount: storyNumber % 2 === 0 ? 0 : 1,
		hasBlockingConflicts: storyNumber % 5 === 0
	};
}

export function buildLeadApprovalItems(
	stories: LeadApprovalSourceStory[],
	getReviewBlockerState?: (story: LeadApprovalSourceStory) => ReviewBlockerState
): LeadApprovalItem[] {
	return stories
		.filter((story) => story.status === 'In Review')
		.map((story) => {
			const blockerState =
				getReviewBlockerState?.(story) ?? deriveReviewBlockerState(story.storyNumber);
			const gate = checkApprovalGate('In Review', 'Lead', blockerState);

			return {
				storyId: story.storyId,
				storyNumber: story.storyNumber,
				title: story.title,
				status: gate.allowed ? 'In Review' : 'Blocked',
				assignee: story.assignee,
				segmentCount: story.segmentCount,
				unresolvedCommentCount: blockerState.unresolvedCommentCount,
				hasBlockingConflicts: blockerState.hasBlockingConflicts,
				blockers: gate.blockers,
				canApprove: gate.allowed
			};
		});
}
