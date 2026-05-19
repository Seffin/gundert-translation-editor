import { describe, expect, it, vi } from 'vitest';
import type { EditorSegment } from '$lib/server/editor';
import {
	buildGeminiWholeStoryRequest,
	parseGeminiWholeStoryResponse,
	requestGeminiWholeStoryDraft,
	type GeminiDraftResponse
} from '$lib/server/gemini-adapter';

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
		targetLanguage: 'Malayalam',
		status: 'Draft',
		draftedByGemini: false,
		updatedAtLabel: 'Not generated'
	}
];

const MOCK_GEMINI_RESPONSE: GeminiDraftResponse = {
	candidates: [
		{
			content: {
				parts: [
					{
						text: 'In the beginning, God created the heavens and the earth.\n\nIn the beginning, God created the heavens and the earth (Hindi translation).\n\n---\n\nAnd God said, "Let there be light."\n\nAnd God said, "Let there be light." (Malayalam translation).'
					}
				]
			},
			finishReason: 'STOP'
		}
	],
	usageMetadata: {
		promptTokenCount: 100,
		candidatesTokenCount: 150,
		totalTokenCount: 250
	}
};

describe('Gemini whole-story draft adapter', () => {
	it('builds request from editor segments with story context', () => {
		const request = buildGeminiWholeStoryRequest(SEGMENTS, 'Malayalam', 'story-01');

		expect(request.storyId).toBe('story-01');
		expect(request.targetLanguage).toBe('Malayalam');
		expect(request.sourceSegments).toHaveLength(2);
		expect(request.sourceSegments[0].sourceText).toBe(
			'In the beginning, God created the heavens and the earth.'
		);
		expect(request.prompt).toMatch(/Malayalam/i);
		expect(request.prompt).toMatch(/translation/i);
	});

	it('parses Gemini response into draft segments', () => {
		const drafted = parseGeminiWholeStoryResponse(
			MOCK_GEMINI_RESPONSE,
			SEGMENTS,
			'2026-05-05T10:00:00.000Z'
		);

		expect(drafted).toHaveLength(2);
		expect(drafted[0].id).toBe('01:01');
		expect(drafted[0].targetText).toMatch(/beginning|God|created/i);
		expect(drafted[0].draftedByGemini).toBe(true);
		expect(drafted[0].aiProvenance?.actor).toBe('Gemini');
		expect(drafted[0].aiProvenance?.scope).toBe('whole-story');
		expect(drafted[0].aiProvenance?.generatedAtIso).toBe('2026-05-05T10:00:00.000Z');
		expect(drafted[1].id).toBe('01:02');
		expect(drafted[1].draftedByGemini).toBe(true);
		expect(drafted[1].aiProvenance?.scope).toBe('whole-story');
	});

	it('handles Gemini API success with mocked fetch', async () => {
		const mockFetch = vi.fn(() =>
			Promise.resolve(
				new Response(JSON.stringify(MOCK_GEMINI_RESPONSE), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				})
			)
		);
		vi.stubGlobal('fetch', mockFetch);

		const result = await requestGeminiWholeStoryDraft(
			SEGMENTS,
			'Malayalam',
			'story-01',
			'fake-api-key'
		);

		expect(result).toHaveLength(2);
		expect(result[0].draftedByGemini).toBe(true);
		expect(result[0].aiProvenance?.actor).toBe('Gemini');
		expect(result[0].aiProvenance?.scope).toBe('whole-story');
		expect(mockFetch).toHaveBeenCalled();
	});

	it('throws on Gemini API error', async () => {
		const mockFetch = vi.fn(() =>
			Promise.resolve(
				new Response(JSON.stringify({ error: { message: 'API error' } }), {
					status: 500
				})
			)
		);
		vi.stubGlobal('fetch', mockFetch);

		await expect(() =>
			requestGeminiWholeStoryDraft(SEGMENTS, 'Malayalam', 'story-01', 'fake-api-key')
		).rejects.toThrow(/API|error/i);
	});

	it('includes story metadata in request', () => {
		const request = buildGeminiWholeStoryRequest(SEGMENTS.slice(0, 1), 'Hindi', 'story-29');

		expect(request.storyId).toBe('story-29');
		expect(request.sourceSegments).toHaveLength(1);
		expect(request.targetLanguage).toBe('Hindi');
	});
});
