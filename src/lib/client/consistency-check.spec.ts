import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildConsistencyIssues, validateConsistencyWithLLM, validateConsistencyIssuesWithLLM } from './consistency-check';
import type { GlossaryTerm } from '$lib/glossary';
import type { EditorSegment } from '$lib/server/editor';

describe('consistency check', () => {
	const createSegment = (id: string, sourceText: string, targetText: string): EditorSegment => ({
		id,
		sourceText,
		targetText,
		targetLanguage: 'Hindi',
		status: 'Draft',
		draftedByGemini: false,
		updatedAtLabel: '2026-05-06'
	});

	const createTerm = (sourceTerm: string, targetTerm: string, status: 'Approved' | 'Proposed' = 'Approved'): GlossaryTerm => ({
		id: `term-${sourceTerm}`,
		sourceTerm,
		targetTerm,
		status,
		rationale: `Translation of ${sourceTerm}`
	});

	it('returns empty list when no approved terms', () => {
		const segments = [createSegment('seg-1', 'God is great', 'Ishwar bahut bada hai')];
		const terms = [createTerm('God', 'Ishwar', 'Proposed')]; // Proposed, not approved

		const issues = buildConsistencyIssues(segments, terms);

		expect(issues).toHaveLength(0);
	});

	it('returns empty list when approved term appears in only one segment', () => {
		const segments = [
			createSegment('seg-1', 'God is great', 'Ishwar bahut bada hai'),
			createSegment('seg-2', 'Love is patient', 'Pyaar sabr-sheel hai')
		];
		const terms = [createTerm('God', 'Ishwar')];

		const issues = buildConsistencyIssues(segments, terms);

		expect(issues).toHaveLength(0);
	});

	it('detects inconsistent translation of same glossary term across segments', () => {
		const segments = [
			createSegment('seg-1', 'God is great', 'Ishwar bahut bada hai'),
			createSegment('seg-2', 'God loves us', 'Devta hum se pyaar karta hai'),
			createSegment('seg-3', 'Trust God always', 'Hamesha Ishwar par bharosa rakho')
		];
		const terms = [createTerm('God', 'Ishwar')];

		const issues = buildConsistencyIssues(segments, terms);

		expect(issues).toHaveLength(1);
		expect(issues[0]?.sourceTerm).toBe('God');
		expect(issues[0]?.expectedTargetTerm).toBe('Ishwar');
		expect(issues[0]?.segmentVariations).toHaveLength(3);
		expect(issues[0]?.segmentVariations[0]?.targetTerm).toBe('Ishwar'); // seg-1
		expect(issues[0]?.segmentVariations[1]?.targetTerm).toBe(null); // seg-2 uses Devta, not Ishwar
		expect(issues[0]?.segmentVariations[2]?.targetTerm).toBe('Ishwar'); // seg-3
	});

	it('returns no issues when same term is consistently translated', () => {
		const segments = [
			createSegment('seg-1', 'God is great', 'Ishwar bahut bada hai'),
			createSegment('seg-2', 'God loves us', 'Ishwar hum se pyaar karta hai'),
			createSegment('seg-3', 'Trust God always', 'Hamesha Ishwar par bharosa rakho')
		];
		const terms = [createTerm('God', 'Ishwar')];

		const issues = buildConsistencyIssues(segments, terms);

		expect(issues).toHaveLength(0);
	});

	it('detects multiple consistency issues for different glossary terms', () => {
		const segments = [
			createSegment('seg-1', 'God loves Love', 'Ishwar pyaar se pyaar karate hain'),
			createSegment('seg-2', 'God gives Love', 'Devta deta hai Affection'),
			createSegment('seg-3', 'God is Love', 'Ishwar pyaar hai')
		];
		const terms = [createTerm('God', 'Ishwar'), createTerm('Love', 'Pyaar')];

		const issues = buildConsistencyIssues(segments, terms);

		expect(issues).toHaveLength(2);
		expect(issues.map((i) => i.sourceTerm).sort()).toEqual(['God', 'Love']);
	});

	it('performs case-insensitive matching for source terms', () => {
		const segments = [
			createSegment('seg-1', 'God is great', 'Ishwar bahut bada hai'),
			createSegment('seg-2', 'god loves us', 'Devta hum se pyaar karta hai'), // lowercase "god"
			createSegment('seg-3', 'Trust GOD', 'Ishwar par bharosa rakho') // uppercase "GOD"
		];
		const terms = [createTerm('God', 'Ishwar')];

		const issues = buildConsistencyIssues(segments, terms);

		expect(issues).toHaveLength(1);
		expect(issues[0]?.segmentVariations).toHaveLength(3);
	});

	it('segments include index for ordering in UI', () => {
		const segments = [
			createSegment('seg-1', 'God is great', 'Ishwar bahut bada hai'),
			createSegment('seg-2', 'God loves us', 'Devta hum se pyaar karta hai')
		];
		const terms = [createTerm('God', 'Ishwar')];

		const issues = buildConsistencyIssues(segments, terms);

		expect(issues[0]?.segmentVariations[0]?.segmentIndex).toBe(0);
		expect(issues[0]?.segmentVariations[1]?.segmentIndex).toBe(1);
	});
});

describe('LLM validation', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		global.fetch = fetchMock;
	});

	it('returns false when no API key provided', async () => {
		const result = await validateConsistencyWithLLM('God', ['Ishwar', 'Devta'], 'Hindi', 'Ishwar', '');

		expect(result.isInconsistency).toBe(true);
		expect(result.explanation).toContain('no API key');
	});

	it('returns false for consistent translations', async () => {
		const result = await validateConsistencyWithLLM('God', ['Ishwar'], 'Hindi', 'Ishwar', '');

		expect(result.isInconsistency).toBe(true); // No key, so fallback
	});

	it('calls Gemini API with correct prompt structure', async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				candidates: [
					{
						content: {
							parts: [{ text: 'INCONSISTENCY: Must use same term consistently' }]
						}
					}
				]
			})
		});

		await validateConsistencyWithLLM('God', ['Ishwar', 'Devta'], 'Hindi', 'Ishwar', 'test-key');

		expect(fetchMock).toHaveBeenCalledOnce();
		const callArgs = fetchMock.mock.calls[0];
		const url = callArgs?.[0];
		expect(url).toContain('gemini-2.5-flash');
		expect(url).toContain('test-key');
	});

	it('returns isInconsistency=true when LLM says INCONSISTENCY', async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				candidates: [
					{
						content: {
							parts: [{ text: 'INCONSISTENCY: In Bible translation, must be unified' }]
						}
					}
				]
			})
		});

		const result = await validateConsistencyWithLLM('God', ['Ishwar', 'Devta'], 'Hindi', 'Ishwar', 'test-key');

		expect(result.isInconsistency).toBe(true);
	});

	it('returns isInconsistency=false when LLM says ACCEPTABLE', async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				candidates: [
					{
						content: {
							parts: [{ text: 'ACCEPTABLE: Both are valid synonyms in context' }]
						}
					}
				]
			})
		});

		const result = await validateConsistencyWithLLM('God', ['Ishwar', 'Bhagwan'], 'Hindi', 'Ishwar', 'test-key');

		expect(result.isInconsistency).toBe(false);
	});

	it('handles API errors gracefully', async () => {
		fetchMock.mockRejectedValueOnce(new Error('Network error'));

		const result = await validateConsistencyWithLLM('God', ['Ishwar', 'Devta'], 'Hindi', 'Ishwar', 'test-key');

		expect(result.isInconsistency).toBe(true); // Fallback to flagging
		expect(result.explanation).toContain('LLM validation error');
	});

	it('validates multiple issues', async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			json: async () => ({
				candidates: [{ content: { parts: [{ text: 'INCONSISTENCY: Must unify' }] } }]
			})
		});

		const issues = [
			{
				sourceTerm: 'God',
				expectedTargetTerm: 'Ishwar',
				segmentVariations: [
					{ segmentId: 'seg-1', segmentIndex: 0, targetTerm: 'Ishwar' },
					{ segmentId: 'seg-2', segmentIndex: 1, targetTerm: 'Devta' }
				]
			},
			{
				sourceTerm: 'Love',
				expectedTargetTerm: 'Pyaar',
				segmentVariations: [
					{ segmentId: 'seg-1', segmentIndex: 0, targetTerm: 'Pyaar' },
					{ segmentId: 'seg-2', segmentIndex: 1, targetTerm: 'Affection' }
				]
			}
		];

		const validated = await validateConsistencyIssuesWithLLM(issues, 'Hindi', 'test-key');

		expect(validated).toHaveLength(2);
		expect(validated[0]?.validated).toBe(true);
		expect(validated[1]?.validated).toBe(true);
	});

	it('skips LLM validation when no API key', async () => {
		const issues = [
			{
				sourceTerm: 'God',
				expectedTargetTerm: 'Ishwar',
				segmentVariations: [
					{ segmentId: 'seg-1', segmentIndex: 0, targetTerm: 'Ishwar' },
					{ segmentId: 'seg-2', segmentIndex: 1, targetTerm: 'Devta' }
				]
			}
		];

		const result = await validateConsistencyIssuesWithLLM(issues, 'Hindi', null);

		expect(result).toHaveLength(1);
		expect(result[0]?.validated).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
