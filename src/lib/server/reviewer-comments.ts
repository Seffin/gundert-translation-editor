type StorySeed = {
	storyId: string;
	storyNumber: number;
	status: 'Draft' | 'In Review' | 'Approved' | 'Blocked';
};

export type ReviewerComment = {
	id: string;
	storyId: string;
	segmentId: string | null;
	authorId: string;
	message: string;
	resolved: boolean;
	createdAt: string;
	resolvedAt: string | null;
};

type AddReviewerCommentInput = {
	storyId: string;
	authorId: string;
	message: string;
	segmentId?: string;
};

const commentsByStory = new Map<string, ReviewerComment[]>();

function nowIso(): string {
	return new Date().toISOString();
}

function commentId(storyId: string): string {
	const random = Math.random().toString(36).slice(2, 8);
	return `${storyId}-${Date.now()}-${random}`;
}

function createSeedComment(story: StorySeed): ReviewerComment {
	return {
		id: commentId(story.storyId),
		storyId: story.storyId,
		segmentId: null,
		authorId: 'reviewer.seed',
		message: 'Needs reviewer verification before lead approval.',
		resolved: false,
		createdAt: nowIso(),
		resolvedAt: null
	};
}

export function resetReviewerComments(): void {
	commentsByStory.clear();
}

export function seedReviewerCommentsForStories(stories: StorySeed[]): void {
	for (const story of stories) {
		if (commentsByStory.has(story.storyId)) {
			continue;
		}

		if (story.status !== 'In Review') {
			commentsByStory.set(story.storyId, []);
			continue;
		}

		// Keep a stable demo baseline: odd-numbered in-review stories start blocked.
		if (story.storyNumber % 2 === 1) {
			commentsByStory.set(story.storyId, [createSeedComment(story)]);
			continue;
		}

		commentsByStory.set(story.storyId, []);
	}
}

export function listReviewerComments(storyId: string): ReviewerComment[] {
	return [...(commentsByStory.get(storyId) ?? [])].sort((a, b) =>
		a.createdAt.localeCompare(b.createdAt)
	);
}

export function countUnresolvedReviewerComments(storyId: string): number {
	return listReviewerComments(storyId).filter((comment) => !comment.resolved).length;
}

export function addReviewerComment(input: AddReviewerCommentInput): ReviewerComment {
	const comment: ReviewerComment = {
		id: commentId(input.storyId),
		storyId: input.storyId,
		segmentId: input.segmentId ?? null,
		authorId: input.authorId,
		message: input.message,
		resolved: false,
		createdAt: nowIso(),
		resolvedAt: null
	};

	const existing = commentsByStory.get(input.storyId) ?? [];
	commentsByStory.set(input.storyId, [...existing, comment]);
	return comment;
}

export function resolveReviewerComment(
	storyId: string,
	commentIdToResolve: string
): ReviewerComment | null {
	const existing = commentsByStory.get(storyId) ?? [];
	let updatedComment: ReviewerComment | null = null;

	const next = existing.map((comment) => {
		if (comment.id !== commentIdToResolve || comment.resolved) {
			return comment;
		}

		updatedComment = {
			...comment,
			resolved: true,
			resolvedAt: nowIso()
		};

		return updatedComment;
	});

	commentsByStory.set(storyId, next);
	return updatedComment;
}

export function resolveAllReviewerComments(storyId: string): number {
	const existing = commentsByStory.get(storyId) ?? [];
	let resolvedCount = 0;

	const next = existing.map((comment) => {
		if (comment.resolved) {
			return comment;
		}

		resolvedCount += 1;
		return {
			...comment,
			resolved: true,
			resolvedAt: nowIso()
		};
	});

	commentsByStory.set(storyId, next);
	return resolvedCount;
}
