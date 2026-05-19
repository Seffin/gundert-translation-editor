export type ReviewerQueueSourceStory = {
	storyId: string;
	storyNumber: number;
	title: string;
	status: 'Draft' | 'In Review' | 'Approved' | 'Blocked';
	assignee: string;
	segmentCount: number;
};

export type ReviewerQueueItem = {
	storyId: string;
	storyNumber: number;
	title: string;
	status: 'In Review' | 'Draft';
	assignee: string;
	segmentCount: number;
	pendingComments: number;
};

function derivePendingComments(storyNumber: number): number {
	return (storyNumber % 4) + 1;
}

export function buildReviewerQueueItems(
	stories: ReviewerQueueSourceStory[],
	getPendingComments?: (story: ReviewerQueueSourceStory) => number
): ReviewerQueueItem[] {
	return stories
		.filter((story) => story.status === 'In Review')
		.map((story) => ({
			storyId: story.storyId,
			storyNumber: story.storyNumber,
			title: story.title,
			status: 'In Review',
			assignee: story.assignee,
			segmentCount: story.segmentCount,
			pendingComments: getPendingComments?.(story) ?? derivePendingComments(story.storyNumber)
		}));
}

export function resolveReviewerQueueItem(item: ReviewerQueueItem): ReviewerQueueItem {
	if (item.status !== 'In Review') {
		throw new Error(`Cannot resolve reviewer queue item from ${item.status}.`);
	}

	return {
		...item,
		status: 'Draft',
		pendingComments: 0
	};
}
