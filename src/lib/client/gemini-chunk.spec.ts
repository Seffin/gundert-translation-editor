import { describe, expect, it, vi } from 'vitest';
import type { EditorSegment } from '$lib/server/editor';
import type { GeminiDraftResponse } from '$lib/server/gemini-adapter';
import {
	applyChunkDraftToSegments,
	buildSegmentSelectionModel,
	requestGeminiChunkDraft,
	toggleSegmentSelection,
	type SegmentSelectionModel
} from '$lib/client/gemini-chunk';

const SEGMENTS: EditorSegment[] = [
	{
		id: '01:01',
		sourceText: 'In the beginning, God created the heavens and the earth.',
		targetText: 'पहले से था',
		targetLanguage: 'Hindi',
		status: 'Done',
		draftedByGemini: true,
		updatedAtLabel: '5 mins ago'
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

describe('segment selection model', () => {
	it('builds selection model with all segments unselected by default', () => {
		const model = buildSegmentSelectionModel(SEGMENTS);

		expect(Object.keys(model.selected)).toHaveLength(3);
		expect(model.selected['01:01']).toBe(false);
		expect(model.selected['01:02']).toBe(false);
		expect(model.selected['01:03']).toBe(false);
		expect(model.count).toBe(0);
	});

	it('toggles segment selection on and off', () => {
		const model = buildSegmentSelectionModel(SEGMENTS);
		const toggled = toggleSegmentSelection(model, '01:02');

		expect(toggled.selected['01:02']).toBe(true);
		expect(toggled.count).toBe(1);

		const toggledBack = toggleSegmentSelection(toggled, '01:02');
		expect(toggledBack.selected['01:02']).toBe(false);
		expect(toggledBack.count).toBe(0);
	});

	it('tracks count of selected segments accurately across multiple toggles', () => {
		let model = buildSegmentSelectionModel(SEGMENTS);
		model = toggleSegmentSelection(model, '01:01');
		model = toggleSegmentSelection(model, '01:03');

		expect(model.count).toBe(2);
		expect(model.selected['01:01']).toBe(true);
		expect(model.selected['01:02']).toBe(false);
		expect(model.selected['01:03']).toBe(true);
	});
});

describe('selective chunk draft', () => {
	const MOCK_RESPONSE: GeminiDraftResponse = {
		candidates: [
			{
				content: {
					parts: [{ text: 'प्रकाश हो जाए\n\nAnd God saw that it was good (Hindi).' }]
				},
				finishReason: 'STOP'
			}
		]
	};

	it('applies chunk draft only to selected segments, preserving others', () => {
		const selection: SegmentSelectionModel = {
			selected: { '01:01': false, '01:02': true, '01:03': false },
			count: 1
		};

		const result = applyChunkDraftToSegments(
			SEGMENTS,
			selection,
			['प्रकाश हो जाए'],
			'2026-05-05T10:00:00.000Z'
		);

		// Segment 01:01 unchanged
		expect(result[0].targetText).toBe('पहले से था');
		expect(result[0].draftedByGemini).toBe(true); // already was
		// Segment 01:02 updated with draft
		expect(result[1].targetText).toBe('प्रकाश हो जाए');
		expect(result[1].draftedByGemini).toBe(true);
		// Segment 01:03 unchanged
		expect(result[2].targetText).toBe('');
		expect(result[2].draftedByGemini).toBe(false);
	});

	it('handles multiple selected segments in order', () => {
		const selection: SegmentSelectionModel = {
			selected: { '01:01': false, '01:02': true, '01:03': true },
			count: 2
		};

		const result = applyChunkDraftToSegments(
			SEGMENTS,
			selection,
			['प्रकाश हो जाए', 'और परमेश्वर ने देखा कि प्रकाश अच्छा है'],
			'2026-05-05T10:00:00.000Z'
		);

		expect(result[0].targetText).toBe('पहले से था');
		expect(result[1].targetText).toBe('प्रकाश हो जाए');
		expect(result[2].targetText).toBe('और परमेश्वर ने देखा कि प्रकाश अच्छा है');
	});

	it('calls Gemini API only with selected segments', async () => {
		const mockFetch = vi.fn(() =>
			Promise.resolve(
				new Response(JSON.stringify(MOCK_RESPONSE), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				})
			)
		);
		vi.stubGlobal('fetch', mockFetch);

		const selection: SegmentSelectionModel = {
			selected: { '01:01': false, '01:02': true, '01:03': false },
			count: 1
		};

		const result = await requestGeminiChunkDraft(
			SEGMENTS,
			selection,
			'Hindi',
			'story-01',
			'fake-api-key'
		);

		expect(result).toHaveLength(3);
		// Verify selected segment got a new draft
		expect(result[1].draftedByGemini).toBe(true);
		// Verify unselected segment unchanged
		expect(result[0].targetText).toBe('पहले से था');

		const fetchCall = mockFetch.mock.calls[0];
		const body = JSON.parse(fetchCall[1].body as string);
		// Prompt should only include the selected segment source text
		expect(body.contents[0].parts[0].text).toContain('Let there be light');
		expect(body.contents[0].parts[0].text).not.toContain('In the beginning');
	});
});
