import { addReviewerComment, listReviewerComments } from '$lib/server/reviewer-comments';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const storyId = url.searchParams.get('storyId');
	if (!storyId) {
		return json({ error: 'Missing required query parameter: storyId' }, { status: 400 });
	}

	return json({ storyId, comments: listReviewerComments(storyId) });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { storyId, authorId, message, segmentId } = body;

		if (!storyId || !authorId || !message) {
			return json(
				{ error: 'Missing required fields: storyId, authorId, message' },
				{ status: 400 }
			);
		}

		const comment = addReviewerComment({
			storyId,
			authorId,
			message,
			segmentId
		});

		return json({ success: true, comment });
	} catch (error) {
		console.error('Reviewer comments API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
