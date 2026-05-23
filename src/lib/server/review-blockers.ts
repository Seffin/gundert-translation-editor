import { canTransitionStatus } from '$lib/server/status-transition';
import type { UserRole } from '$lib/server/permissions';
import type { StoryStatus } from '$lib/server/story-list';

export type ReviewBlockersState = {
	unresolvedCommentCount: number;
	hasBlockingConflicts: boolean;
};

export type ApprovalGateResult = {
	allowed: boolean;
	nextStatus?: StoryStatus;
	blockers: string[];
	reason?: string;
};

export function listReviewBlockers(state: ReviewBlockersState): string[] {
	const blockers: string[] = [];

	if (state.unresolvedCommentCount > 0) {
		const noun = state.unresolvedCommentCount === 1 ? 'unresolved comment' : 'unresolved comments';
		blockers.push(`${state.unresolvedCommentCount} ${noun}`);
	}

	if (state.hasBlockingConflicts) {
		blockers.push('Blocking conflicts must be resolved');
	}

	return blockers;
}

export function checkApprovalGate(
	currentStatus: StoryStatus,
	role: UserRole,
	state: ReviewBlockersState
): ApprovalGateResult {
	const transitionResult = canTransitionStatus(currentStatus, 'approveStory', role);
	if (!transitionResult.allowed) {
		return {
			allowed: false,
			blockers: [],
			reason: transitionResult.reason,
			nextStatus: undefined
		};
	}

	const blockers = listReviewBlockers(state);
	if (blockers.length > 0) {
		return {
			allowed: false,
			blockers,
			reason: `Blocked approval: ${blockers.join('; ')}`,
			nextStatus: 'Blocked'
		};
	}

	return {
		allowed: true,
		blockers: [],
		nextStatus: transitionResult.nextStatus
	};
}

export function transitionApprovalIfReady(
	currentStatus: StoryStatus,
	role: UserRole,
	state: ReviewBlockersState
): StoryStatus {
	const result = checkApprovalGate(currentStatus, role, state);
	if (!result.allowed || !result.nextStatus) {
		throw new Error(result.reason ?? 'Approval blocked.');
	}

	return result.nextStatus;
}
