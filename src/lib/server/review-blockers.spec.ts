import { describe, expect, it } from 'vitest';
import {
	checkApprovalGate,
	listReviewBlockers,
	transitionApprovalIfReady,
	type ReviewBlockersState
} from '$lib/server/review-blockers';

describe('review blockers', () => {
	it('lists unresolved comments as approval blockers', () => {
		const blockers = listReviewBlockers({ unresolvedCommentCount: 3, hasBlockingConflicts: false });

		expect(blockers).toEqual(['3 unresolved comments']);
	});

	it('lists blocking conflicts as approval blockers', () => {
		const blockers = listReviewBlockers({ unresolvedCommentCount: 0, hasBlockingConflicts: true });

		expect(blockers).toEqual(['Blocking conflicts must be resolved']);
	});

	it('combines unresolved comments and conflicts into actionable blocker list', () => {
		const blockers = listReviewBlockers({ unresolvedCommentCount: 2, hasBlockingConflicts: true });

		expect(blockers).toEqual(['2 unresolved comments', 'Blocking conflicts must be resolved']);
	});

	it('blocks approval and marks the story as blocked when review blockers exist', () => {
		const result = checkApprovalGate('In Review', 'Lead', {
			unresolvedCommentCount: 2,
			hasBlockingConflicts: true
		});

		expect(result.allowed).toBe(false);
		expect(result.nextStatus).toBe('Blocked');
		expect(result.blockers).toEqual([
			'2 unresolved comments',
			'Blocking conflicts must be resolved'
		]);
		expect(result.reason).toMatch(/blocked approval/i);
	});

	it('allows approval when status, role, and blocker checks all pass', () => {
		const result = checkApprovalGate('In Review', 'Lead', {
			unresolvedCommentCount: 0,
			hasBlockingConflicts: false
		});

		expect(result.allowed).toBe(true);
		expect(result.nextStatus).toBe('Approved');
		expect(result.blockers).toEqual([]);
	});

	it('preserves transition-engine permission failures before blocker evaluation', () => {
		const result = checkApprovalGate('In Review', 'Reviewer', {
			unresolvedCommentCount: 0,
			hasBlockingConflicts: false
		});

		expect(result.allowed).toBe(false);
		expect(result.nextStatus).toBeUndefined();
		expect(result.blockers).toEqual([]);
		expect(result.reason).toMatch(/permission/i);
	});

	it('transitions to Approved when ready', () => {
		const blockers: ReviewBlockersState = {
			unresolvedCommentCount: 0,
			hasBlockingConflicts: false
		};

		expect(transitionApprovalIfReady('In Review', 'Lead', blockers)).toBe('Approved');
	});

	it('throws with blocker details when approval is gated', () => {
		const blockers: ReviewBlockersState = {
			unresolvedCommentCount: 1,
			hasBlockingConflicts: true
		};

		expect(() => transitionApprovalIfReady('In Review', 'Lead', blockers)).toThrow(
			/1 unresolved comment.*Blocking conflicts must be resolved/i
		);
	});
});
