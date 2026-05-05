import { describe, expect, it } from 'vitest';
import {
	canTransitionStatus,
	transitionStoryStatus,
	type TransitionAction
} from '$lib/server/status-transition';
import type { UserRole } from '$lib/server/permissions';
import type { StoryStatus } from '$lib/server/story-list';

type ValidCase = {
	role: UserRole;
	currentStatus: StoryStatus;
	action: TransitionAction;
	nextStatus: StoryStatus;
};

type InvalidCase = {
	role: UserRole;
	currentStatus: StoryStatus;
	action: TransitionAction;
	reason: RegExp;
};

const VALID_CASES: ValidCase[] = [
	{
		role: 'Translator',
		currentStatus: 'Draft',
		action: 'submitForReview',
		nextStatus: 'In Review'
	},
	{
		role: 'Reviewer',
		currentStatus: 'In Review',
		action: 'returnToDraft',
		nextStatus: 'Draft'
	},
	{
		role: 'Lead',
		currentStatus: 'In Review',
		action: 'approveStory',
		nextStatus: 'Approved'
	}
];

const INVALID_CASES: InvalidCase[] = [
	{
		role: 'Reviewer',
		currentStatus: 'Draft',
		action: 'submitForReview',
		reason: /permission/i
	},
	{
		role: 'Translator',
		currentStatus: 'In Review',
		action: 'submitForReview',
		reason: /cannot transition/i
	},
	{
		role: 'Lead',
		currentStatus: 'Draft',
		action: 'approveStory',
		reason: /cannot transition/i
	},
	{
		role: 'Reviewer',
		currentStatus: 'Approved',
		action: 'returnToDraft',
		reason: /cannot transition/i
	}
];

describe('status transition engine', () => {
	it.each(VALID_CASES)('allows $role to $action from $currentStatus to $nextStatus', ({ role, currentStatus, action, nextStatus }) => {
		const allowed = canTransitionStatus(currentStatus, action, role);

		expect(allowed.allowed).toBe(true);
		expect(allowed.nextStatus).toBe(nextStatus);
		expect(allowed.reason).toBeUndefined();
	});

	it.each(INVALID_CASES)('rejects $role trying to $action from $currentStatus', ({ role, currentStatus, action, reason }) => {
		const result = canTransitionStatus(currentStatus, action, role);

		expect(result.allowed).toBe(false);
		expect(result.nextStatus).toBeUndefined();
		expect(result.reason).toMatch(reason);
	});

	it('returns the transitioned status for valid transitions', () => {
		expect(transitionStoryStatus('Draft', 'submitForReview', 'Translator')).toBe('In Review');
		expect(transitionStoryStatus('In Review', 'approveStory', 'Lead')).toBe('Approved');
	});

	it('throws with the rejection reason for invalid transitions', () => {
		expect(() => transitionStoryStatus('Draft', 'approveStory', 'Lead')).toThrow(
			/cannot transition/i
		);
		expect(() => transitionStoryStatus('Draft', 'submitForReview', 'Reviewer')).toThrow(
			/permission/i
		);
	});
});