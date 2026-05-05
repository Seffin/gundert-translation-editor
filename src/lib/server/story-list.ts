import type { ObsStory } from '$lib/server/obs';

export type StoryStatus = 'Draft' | 'In Review' | 'Approved' | 'Blocked';

export type StoryListItem = {
	storyId: string;
	storyNumber: number;
	title: string;
	status: StoryStatus;
	completionPercent: number;
	assignee: string;
	segmentCount: number;
};

const ASSIGNEES = ['Unassigned', 'Sarah Jenkins', 'David Mbeki', 'Maria Garcia'];

export function deriveStoryStatus(storyNumber: number): StoryStatus {
	if (storyNumber % 10 === 0) return 'Blocked';
	if (storyNumber % 3 === 0) return 'In Review';
	if (storyNumber % 5 === 0) return 'Approved';
	return 'Draft';
}

export function deriveCompletionPercent(status: StoryStatus): number {
	switch (status) {
		case 'Approved':
			return 100;
		case 'In Review':
			return 75;
		case 'Blocked':
			return 40;
		case 'Draft':
		default:
			return 20;
	}
}

export function buildStoryListItems(stories: ObsStory[]): StoryListItem[] {
	return stories.map((story) => {
		const status = deriveStoryStatus(story.storyNumber);
		return {
			storyId: story.storyId,
			storyNumber: story.storyNumber,
			title: story.title,
			status,
			completionPercent: deriveCompletionPercent(status),
			assignee: ASSIGNEES[story.storyNumber % ASSIGNEES.length],
			segmentCount: story.segments.length
		};
	});
}
