import { resolveAllReviewerComments, resolveReviewerComment } from '$lib/server/reviewer-comments';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { storyId, commentId } = body;

		if (!storyId) {
			return json({ error: 'Missing required field: storyId' }, { status: 400 });
		}

		if (commentId) {
			const resolved = resolveReviewerComment(storyId, commentId);
			if (!resolved) {
				return json({ error: 'Comment not found or already resolved' }, { status: 404 });
			}

			return json({ success: true, resolvedCount: 1, comment: resolved });
		}

		const resolvedCount = resolveAllReviewerComments(storyId);
		return json({ success: true, resolvedCount });
	} catch (error) {
		console.error('Reviewer comment resolve API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
