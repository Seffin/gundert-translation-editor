import { buildLeadApprovalItems } from '$lib/server/lead-approval';
import {
	countUnresolvedReviewerComments,
	seedReviewerCommentsForStories
} from '$lib/server/reviewer-comments';
import { buildStoryListItems } from '$lib/server/story-list';
import { parseObsContentDirectory } from '$lib/server/obs';
import { join } from 'node:path';
import type { PageServerLoad } from './$types';

const DEFAULT_OBS_CONTENT_DIR = join(process.cwd(), 'en_obs', 'content');

export const load: PageServerLoad = async () => {
	try {
		const stories = await parseObsContentDirectory(DEFAULT_OBS_CONTENT_DIR);
		const listItems = buildStoryListItems(stories);
		seedReviewerCommentsForStories(listItems);

		return {
			items: buildLeadApprovalItems(listItems, (story) => ({
				unresolvedCommentCount: countUnresolvedReviewerComments(story.storyId),
				hasBlockingConflicts: story.storyNumber % 5 === 0
			})),
			sourceAvailable: true
		};
	} catch {
		return {
			items: [],
			sourceAvailable: false
		};
	}
};
