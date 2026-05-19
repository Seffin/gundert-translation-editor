import { beforeEach, describe, expect, it } from 'vitest';
import {
	addReviewerComment,
	countUnresolvedReviewerComments,
	listReviewerComments,
	resetReviewerComments,
	resolveAllReviewerComments,
	resolveReviewerComment,
	seedReviewerCommentsForStories
} from '$lib/server/reviewer-comments';

describe('reviewer comments store', () => {
	beforeEach(() => {
		resetReviewerComments();
	});

	it('seeds unresolved comments for odd in-review stories only', () => {
		seedReviewerCommentsForStories([
			{ storyId: '03', storyNumber: 3, status: 'In Review' },
			{ storyId: '06', storyNumber: 6, status: 'In Review' },
			{ storyId: '07', storyNumber: 7, status: 'Draft' }
		]);

		expect(countUnresolvedReviewerComments('03')).toBe(1);
		expect(countUnresolvedReviewerComments('06')).toBe(0);
		expect(countUnresolvedReviewerComments('07')).toBe(0);
	});

	it('adds and resolves a single reviewer comment', () => {
		const added = addReviewerComment({
			storyId: '03',
			authorId: 'reviewer.alex',
			message: 'Segment 2 wording should be aligned with glossary',
			segmentId: '2'
		});

		expect(countUnresolvedReviewerComments('03')).toBe(1);
		const resolved = resolveReviewerComment('03', added.id);
		expect(resolved?.resolved).toBe(true);
		expect(countUnresolvedReviewerComments('03')).toBe(0);
	});

	it('resolves all unresolved comments for a story', () => {
		addReviewerComment({ storyId: '09', authorId: 'reviewer.a', message: 'Fix punctuation' });
		addReviewerComment({
			storyId: '09',
			authorId: 'reviewer.b',
			message: 'Check tense consistency'
		});

		const resolvedCount = resolveAllReviewerComments('09');
		expect(resolvedCount).toBe(2);
		expect(countUnresolvedReviewerComments('09')).toBe(0);

		const comments = listReviewerComments('09');
		expect(comments.every((comment) => comment.resolved)).toBe(true);
	});
});
