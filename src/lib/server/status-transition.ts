import { hasPermission, type PermissionAction, type UserRole } from '$lib/server/permissions';
import type { StoryStatus } from '$lib/server/story-list';

export type TransitionAction = Extract<
	PermissionAction,
	'submitForReview' | 'returnToDraft' | 'approveStory'
>;

export type TransitionCheckResult = {
	allowed: boolean;
	nextStatus?: StoryStatus;
	reason?: string;
};

const TRANSITION_MAP: Record<StoryStatus, Partial<Record<TransitionAction, StoryStatus>>> = {
	Draft: {
		submitForReview: 'In Review'
	},
	'In Review': {
		returnToDraft: 'Draft',
		approveStory: 'Approved'
	},
	Approved: {},
	Blocked: {}
};

export function canTransitionStatus(
	currentStatus: StoryStatus,
	action: TransitionAction,
	role: UserRole
): TransitionCheckResult {
	if (!hasPermission(role, action)) {
		return {
			allowed: false,
			reason: `${role} does not have permission to ${action}.`
		};
	}

	const nextStatus = TRANSITION_MAP[currentStatus][action];
	if (!nextStatus) {
		return {
			allowed: false,
			reason: `Cannot transition from ${currentStatus} using ${action}.`
		};
	}

	return {
		allowed: true,
		nextStatus
	};
}

export function transitionStoryStatus(
	currentStatus: StoryStatus,
	action: TransitionAction,
	role: UserRole
): StoryStatus {
	const result = canTransitionStatus(currentStatus, action, role);
	if (!result.allowed || !result.nextStatus) {
		throw new Error(result.reason ?? 'Transition denied.');
	}

	return result.nextStatus;
}