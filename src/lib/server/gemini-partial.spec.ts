import { describe, expect, it } from 'vitest';
import type { EditorSegment } from '$lib/server/editor';
import {
	buildPartialDraftResult,
	mergePartialDraftResult,
	retryFailedSegments,
	type SegmentDraftOutcome
} from '$lib/server/gemini-partial';

const SEGMENTS: EditorSegment[] = [
	{
		id: '01:01',
		sourceText: 'In the beginning, God created the heavens and the earth.',
		targetText: '',
		targetLanguage: 'Hindi',
		status: 'Draft',
		draftedByGemini: false,
		updatedAtLabel: 'Not generated'
	},
	{
		id: '01:02',
		sourceText: 'And God said, "Let there be light."',
		targetText: '',
		targetLanguage: 'Hindi',
		status: 'Draft',
		draftedByGemini: false,
		updatedAtLabel: 'Not generated'
	},
	{
		id: '01:03',
		sourceText: 'And God saw that the light was good.',
		targetText: '',
		targetLanguage: 'Hindi',
		status: 'Draft',
		draftedByGemini: false,
		updatedAtLabel: 'Not generated'
	}
];

describe('partial draft result', () => {
	it('builds partial draft result with per-segment outcomes', () => {
		const outcomes: SegmentDraftOutcome[] = [
			{ segmentId: '01:01', status: 'success', targetText: 'आदि में' },
			{ segmentId: '01:02', status: 'failed', error: 'timeout' },
			{ segmentId: '01:03', status: 'success', targetText: 'और परमेश्वर ने' }
		];

		const result = buildPartialDraftResult(outcomes);

		expect(result.successCount).toBe(2);
		expect(result.failedCount).toBe(1);
		expect(result.failedSegmentIds).toContain('01:02');
		expect(result.outcomes['01:01'].status).toBe('success');
		expect(result.outcomes['01:02'].status).toBe('failed');
	});

	it('merges partial draft result back into segments', () => {
		const outcomes: SegmentDraftOutcome[] = [
			{ segmentId: '01:01', status: 'success', targetText: 'आदि में' },
			{ segmentId: '01:02', status: 'failed', error: 'timeout' },
			{ segmentId: '01:03', status: 'success', targetText: 'और परमेश्वर ने' }
		];
		const result = buildPartialDraftResult(outcomes);
		const merged = mergePartialDraftResult(SEGMENTS, result, '2026-05-05T10:00:00.000Z');

		// Successful segments get drafted text
		expect(merged[0].targetText).toBe('आदि में');
		expect(merged[0].draftedByGemini).toBe(true);
		// Failed segment keeps original text
		expect(merged[1].targetText).toBe('');
		expect(merged[1].draftedByGemini).toBe(false);
		// Third segment succeeds
		expect(merged[2].targetText).toBe('और परमेश्वर ने');
		expect(merged[2].draftedByGemini).toBe(true);
	});

	it('reports all success when no failures', () => {
		const outcomes: SegmentDraftOutcome[] = [
			{ segmentId: '01:01', status: 'success', targetText: 'आदि में' }
		];
		const result = buildPartialDraftResult(outcomes);

		expect(result.successCount).toBe(1);
		expect(result.failedCount).toBe(0);
		expect(result.failedSegmentIds).toHaveLength(0);
	});

	it('reports all failed when all segments fail', () => {
		const outcomes: SegmentDraftOutcome[] = [
			{ segmentId: '01:01', status: 'failed', error: 'rate limit' },
			{ segmentId: '01:02', status: 'failed', error: 'rate limit' }
		];
		const result = buildPartialDraftResult(outcomes);

		expect(result.successCount).toBe(0);
		expect(result.failedCount).toBe(2);
		expect(result.failedSegmentIds).toEqual(['01:01', '01:02']);
	});
});

describe('retry failed segments', () => {
	it('filters segments to only those that previously failed', () => {
		const failedIds = ['01:02'];
		const forRetry = retryFailedSegments(SEGMENTS, failedIds);

		expect(forRetry).toHaveLength(1);
		expect(forRetry[0].id).toBe('01:02');
	});

	it('returns empty array when no failed segments', () => {
		const forRetry = retryFailedSegments(SEGMENTS, []);
		expect(forRetry).toHaveLength(0);
	});

	it('handles multiple failed segments in original order', () => {
		const failedIds = ['01:03', '01:01'];
		const forRetry = retryFailedSegments(SEGMENTS, failedIds);

		// Preserves original segment order
		expect(forRetry[0].id).toBe('01:01');
		expect(forRetry[1].id).toBe('01:03');
	});
});
