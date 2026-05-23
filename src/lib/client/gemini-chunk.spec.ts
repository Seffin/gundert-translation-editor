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
		expect(result[1].aiProvenance?.actor).toBe('Gemini');
		expect(result[1].aiProvenance?.scope).toBe('selected-chunk');
		expect(result[1].aiProvenance?.generatedAtIso).toBe('2026-05-05T10:00:00.000Z');
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

	it('calls Gemini API with whole-story context and selected segment ids', async () => {
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
		expect(result[1].aiProvenance?.actor).toBe('Gemini');
		expect(result[1].aiProvenance?.scope).toBe('selected-chunk');
		// Verify unselected segment unchanged
		expect(result[0].targetText).toBe('पहले से था');

		const fetchCall = mockFetch.mock.calls[0];
		const body = JSON.parse(fetchCall[1].body as string);
		// Prompt should include whole story context and selected IDs for deterministic mapping
		expect(body.contents[0].parts[0].text).toContain('Let there be light');
		expect(body.contents[0].parts[0].text).toContain('In the beginning');
		expect(body.contents[0].parts[0].text).toContain('Selected segment IDs');
		expect(body.contents[0].parts[0].text).toContain('01:02');
	});

	it('preserves internal blank lines when drafting a single selected segment', async () => {
		const multiParagraphTranslation =
			'ദൈവം ആകാശവും ഭൂമിയും സൃഷ്ടിച്ചു.\n\nഅവൻ സൃഷ്ടിച്ചതെല്ലാം നല്ലതായിരുന്നു.';

		const mockFetch = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						candidates: [
							{
								content: {
									parts: [{ text: multiParagraphTranslation }]
								},
								finishReason: 'STOP'
							}
						]
					}),
					{
						status: 200,
						headers: { 'content-type': 'application/json' }
					}
				)
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
			'Malayalam',
			'story-01',
			'fake-api-key'
		);

		expect(result[1].targetText).toBe(multiParagraphTranslation);
	});

	it('supports multi-segment drafts with paragraph breaks using explicit separators', async () => {
		const firstTranslation = 'അപ്പോൾ ദൈവം അരുളിച്ചെയ്തു: വെളിച്ചമുണ്ടാകട്ടെ.\n\nവെളിച്ചം ഉണ്ടായി.';
		const secondTranslation =
			'ദൈവം വെളിച്ചം നല്ലതാണെന്ന് കണ്ടു.\n\nഅവൻ വെളിച്ചത്തെയും ഇരുളിനെയും വേർതിരിച്ചു.';

		const mockFetch = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						candidates: [
							{
								content: {
									parts: [{ text: `${firstTranslation}\n---\n${secondTranslation}` }]
								},
								finishReason: 'STOP'
							}
						]
					}),
					{
						status: 200,
						headers: { 'content-type': 'application/json' }
					}
				)
			)
		);
		vi.stubGlobal('fetch', mockFetch);

		const selection: SegmentSelectionModel = {
			selected: { '01:01': false, '01:02': true, '01:03': true },
			count: 2
		};

		const result = await requestGeminiChunkDraft(
			SEGMENTS,
			selection,
			'Malayalam',
			'story-01',
			'fake-api-key'
		);

		expect(result[1].targetText).toBe(firstTranslation);
		expect(result[2].targetText).toBe(secondTranslation);
	});

	it('maps JSON translations by segment id to prevent split bleed across selected segments', async () => {
		const firstTranslation =
			'ദൈവം എല്ലാം സൃഷ്ടിച്ചു.\n\nഅവന്റെ ആത്മാവ് ജലത്തിനുമീതെ ഉണ്ടായിരുന്നു.';
		const secondTranslation = 'ദൈവം അരുളിച്ചെയ്തു: വെളിച്ചമുണ്ടാകട്ടെ.';

		const mockFetch = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						candidates: [
							{
								content: {
									parts: [
										{
											text: JSON.stringify({
												translations: [
													{ id: '01:01', text: firstTranslation },
													{ id: '01:02', text: secondTranslation }
												]
											})
										}
									]
								},
								finishReason: 'STOP'
							}
						]
					}),
					{
						status: 200,
						headers: { 'content-type': 'application/json' }
					}
				)
			)
		);
		vi.stubGlobal('fetch', mockFetch);

		const selection: SegmentSelectionModel = {
			selected: { '01:01': true, '01:02': true, '01:03': false },
			count: 2
		};

		const result = await requestGeminiChunkDraft(
			SEGMENTS,
			selection,
			'Malayalam',
			'story-01',
			'fake-api-key'
		);

		expect(result[0].targetText).toBe(firstTranslation);
		expect(result[1].targetText).toBe(secondTranslation);
		expect(result[2].targetText).toBe('');
	});

	it('parses JSON wrapped in markdown code fences as Gemini typically returns', async () => {
		const firstTranslation =
			'ആദിയിൽ ദൈവം സകലവും സൃഷ്ടിച്ചത് ഇങ്ങനെയാണ്. അവൻ ആകാശവും ഭൂമിയും അതിലുള്ള സകലതും ആറ് ദിവസങ്ങൾകൊണ്ട് സൃഷ്ടിച്ചു.';
		const secondTranslation = 'അപ്പോൾ ദൈവം അരുളിച്ചെയ്തു: "വെളിച്ചം ഉണ്ടാകട്ടെ!" വെളിച്ചം ഉണ്ടായി.';

		const fencedJson =
			'```json\n' +
			JSON.stringify(
				{
					translations: [
						{ id: '01:01', text: firstTranslation },
						{ id: '01:02', text: secondTranslation }
					]
				},
				null,
				2
			) +
			'\n```';

		const mockFetch = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						candidates: [
							{
								content: {
									parts: [{ text: fencedJson }]
								},
								finishReason: 'STOP'
							}
						]
					}),
					{
						status: 200,
						headers: { 'content-type': 'application/json' }
					}
				)
			)
		);
		vi.stubGlobal('fetch', mockFetch);

		const selection: SegmentSelectionModel = {
			selected: { '01:01': true, '01:02': true, '01:03': false },
			count: 2
		};

		const result = await requestGeminiChunkDraft(
			SEGMENTS,
			selection,
			'Malayalam',
			'story-01',
			'fake-api-key'
		);

		expect(result[0].targetText).toBe(firstTranslation);
		expect(result[1].targetText).toBe(secondTranslation);
		expect(result[2].targetText).toBe('');
	});

	it('handles fenced JSON with extra commentary text before/after fence', async () => {
		const firstTranslation = 'ആദിയിൽ ദൈവം സകലവും സൃഷ്ടിച്ചു.';
		const secondTranslation = 'ദൈവം വെളിച്ചമുണ്ടാകട്ടെ എന്ന് അരുളിച്ചെയ്തു.';

		const responseWithCommentary =
			'Here is the translation:\n\n```json\n' +
			JSON.stringify(
				{
					translations: [
						{ id: '01:01', text: firstTranslation },
						{ id: '01:02', text: secondTranslation }
					]
				},
				null,
				2
			) +
			'\n```\n\nLet me know if you need any changes.';

		const mockFetch = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						candidates: [
							{
								content: {
									parts: [{ text: responseWithCommentary }]
								},
								finishReason: 'STOP'
							}
						]
					}),
					{
						status: 200,
						headers: { 'content-type': 'application/json' }
					}
				)
			)
		);
		vi.stubGlobal('fetch', mockFetch);

		const selection: SegmentSelectionModel = {
			selected: { '01:01': true, '01:02': true, '01:03': false },
			count: 2
		};

		const result = await requestGeminiChunkDraft(
			SEGMENTS,
			selection,
			'Malayalam',
			'story-01',
			'fake-api-key'
		);

		expect(result[0].targetText).toBe(firstTranslation);
		expect(result[1].targetText).toBe(secondTranslation);
	});

	it('successfully parses JSON containing unescaped double quotes in translated text', async () => {
		const firstTranslation =
			'രണ്ടാം ദിവസം ദൈവം അരുളിച്ചെയ്തു: "വെള്ളങ്ങൾക്കു മീതെ ഒരു വിതാനം ഉണ്ടാകട്ടെ." അങ്ങനെ വിതാനം ഉണ്ടായി. ദൈവം ഈ വിതാനത്തിന് ആകാശം എന്നു പേരിട്ടു.';

		const invalidJsonString =
			'{"translations":[{"id":"01:03","text":"രണ്ടാം ദിവസം ദൈവം അരുളിച്ചെയ്തു: "വെള്ളങ്ങൾക്കു മീതെ ഒരു വിതാനം ഉണ്ടാകട്ടെ." അങ്ങനെ വിതാനം ഉണ്ടായി. ദൈവം ഈ വിതാനത്തിന് ആകാശം എന്നു പേരിട്ടു."}]}';

		const mockFetch = vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						candidates: [
							{
								content: {
									parts: [{ text: invalidJsonString }]
								},
								finishReason: 'STOP'
							}
						]
					}),
					{
						status: 200,
						headers: { 'content-type': 'application/json' }
					}
				)
			)
		);
		vi.stubGlobal('fetch', mockFetch);

		const selection: SegmentSelectionModel = {
			selected: { '01:01': false, '01:02': false, '01:03': true },
			count: 1
		};

		const result = await requestGeminiChunkDraft(
			SEGMENTS,
			selection,
			'Malayalam',
			'story-01',
			'fake-api-key'
		);

		expect(result[2].targetText).toBe(firstTranslation);
	});
});
