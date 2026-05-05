import type { EditorSegment } from './editor';

export type SegmentDraftOutcome =
	| { segmentId: string; status: 'success'; targetText: string }
	| { segmentId: string; status: 'failed'; error: string };

export type PartialDraftResult = {
	outcomes: Record<string, SegmentDraftOutcome>;
	successCount: number;
	failedCount: number;
	failedSegmentIds: string[];
};

export function buildPartialDraftResult(outcomes: SegmentDraftOutcome[]): PartialDraftResult {
	const outcomeMap: Record<string, SegmentDraftOutcome> = {};
	const failedSegmentIds: string[] = [];
	let successCount = 0;
	let failedCount = 0;

	for (const outcome of outcomes) {
		outcomeMap[outcome.segmentId] = outcome;
		if (outcome.status === 'success') {
			successCount++;
		} else {
			failedCount++;
			failedSegmentIds.push(outcome.segmentId);
		}
	}

	return { outcomes: outcomeMap, successCount, failedCount, failedSegmentIds };
}

export function mergePartialDraftResult(
	segments: EditorSegment[],
	result: PartialDraftResult,
	nowIso: string
): EditorSegment[] {
	return segments.map((segment) => {
		const outcome = result.outcomes[segment.id];
		if (!outcome || outcome.status !== 'success') {
			return segment;
		}

		return {
			...segment,
			targetText: outcome.targetText,
			draftedByGemini: true,
			status: 'Draft' as const,
			updatedAtLabel: 'Just now',
			aiProvenance: {
				actor: 'Gemini',
				scope: 'selected-chunk',
				generatedAtIso: nowIso,
				generatedAtLabel: 'Just now'
			}
		};
	});
}

export function retryFailedSegments(
	segments: EditorSegment[],
	failedIds: string[]
): EditorSegment[] {
	const failedSet = new Set(failedIds);
	return segments.filter((s) => failedSet.has(s.id));
}
