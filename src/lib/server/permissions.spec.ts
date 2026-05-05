import { describe, expect, it } from 'vitest';
import {
	hasPermission,
	listAllowedActions,
	type PermissionAction,
	type UserRole
} from '$lib/server/permissions';

type MatrixCase = {
	role: UserRole;
	allowed: PermissionAction[];
	denied: PermissionAction[];
};

const MATRIX: MatrixCase[] = [
	{
		role: 'Translator',
		allowed: ['editTranslation', 'saveDraft', 'requestAIDraft', 'submitForReview'],
		denied: ['resolveReview', 'returnToDraft', 'approveStory', 'viewReviewerQueue', 'viewLeadGate']
	},
	{
		role: 'Reviewer',
		allowed: ['resolveReview', 'returnToDraft', 'viewReviewerQueue'],
		denied: ['editTranslation', 'saveDraft', 'requestAIDraft', 'submitForReview', 'approveStory', 'viewLeadGate']
	},
	{
		role: 'Lead',
		allowed: ['approveStory', 'viewLeadGate'],
		denied: [
			'editTranslation',
			'saveDraft',
			'requestAIDraft',
			'submitForReview',
			'resolveReview',
			'returnToDraft',
			'viewReviewerQueue'
		]
	}
];

describe('role permission matrix', () => {
	it.each(MATRIX)('grants only the expected actions for $role', ({ role, allowed, denied }) => {
		for (const action of allowed) {
			expect(hasPermission(role, action)).toBe(true);
		}

		for (const action of denied) {
			expect(hasPermission(role, action)).toBe(false);
		}
	});

	it('lists allowed actions for a role without denied actions leaking in', () => {
		const actions = listAllowedActions('Reviewer');

		expect(actions).toContain('resolveReview');
		expect(actions).toContain('returnToDraft');
		expect(actions).toContain('viewReviewerQueue');
		expect(actions).not.toContain('approveStory');
		expect(actions).not.toContain('editTranslation');
	});
});