import {
	emitStoryDraftEvent,
	emitStoryEditEvent,
	emitStoryReviewEvent,
	emitStoryApprovalEvent
} from '$lib/server/audit-events-api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { action, actorId, storyId, segmentId, draftScope, decision } = body;

		if (!action || !actorId || !storyId) {
			return json({ error: 'Missing required fields: action, actorId, storyId' }, { status: 400 });
		}

		switch (action) {
			case 'draft':
				emitStoryDraftEvent({
					actorId,
					storyId,
					draftScope: draftScope || 'whole-story'
				});
				break;

			case 'edit':
				if (!segmentId) {
					return json({ error: 'Missing required field for edit: segmentId' }, { status: 400 });
				}
				emitStoryEditEvent({
					actorId,
					storyId,
					segmentId
				});
				break;

			case 'review':
				emitStoryReviewEvent({
					actorId,
					storyId,
					decision: decision || 'resolved'
				});
				break;

			case 'approve':
				emitStoryApprovalEvent({
					actorId,
					storyId
				});
				break;

			default:
				return json({ error: `Unknown action: ${action}` }, { status: 400 });
		}

		return json({ success: true, action, storyId });
	} catch (error) {
		console.error('Audit event API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
