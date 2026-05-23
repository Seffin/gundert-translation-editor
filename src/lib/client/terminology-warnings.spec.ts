import { describe, expect, it } from 'vitest';
import {
	buildTerminologyWarnings,
	type TerminologyGlossaryTerm
} from '$lib/client/terminology-warnings';
import type { EditorSegment } from '$lib/server/editor';

const GLOSSARY: TerminologyGlossaryTerm[] = [
	{
		id: 'term-1',
		sourceTerm: 'God',
		targetTerm: 'Ishwar',
		status: 'Approved',
		rationale: 'Preferred rendering in this project',
		language: 'Hindi'
	},
	{
		id: 'term-2',
		sourceTerm: 'Covenant',
		targetTerm: 'Ahd',
		status: 'Proposed',
		rationale: 'Still under review',
		language: 'Hindi'
	}
];

const SEGMENTS: EditorSegment[] = [
	{
		id: '01:01',
		sourceText: 'God created the heavens and earth.',
		targetText: '',
		targetLanguage: 'Hindi',
		status: 'Draft',
		draftedByGemini: false,
		updatedAtLabel: 'Not generated'
	}
];

describe('terminology warnings', () => {
	it('creates warning for approved glossary term missing in target segment', () => {
		const warnings = buildTerminologyWarnings(SEGMENTS, GLOSSARY);

		expect(warnings).toHaveLength(1);
		expect(warnings[0].segmentId).toBe('01:01');
		expect(warnings[0].expectedTargetTerm).toBe('Ishwar');
		expect(warnings[0].sourceTerm).toBe('God');
	});

	it('does not warn when expected target term is present', () => {
		const warnings = buildTerminologyWarnings(
			[
				{
					...SEGMENTS[0],
					targetText: 'ईश्वर (Ishwar) ने आकाश और पृथ्वी बनाई।'
				}
			],
			GLOSSARY
		);

		expect(warnings).toEqual([]);
	});

	it('ignores non-approved glossary terms in warning generation', () => {
		const warnings = buildTerminologyWarnings(
			[
				{
					...SEGMENTS[0],
					sourceText: 'The covenant is eternal.'
				}
			],
			GLOSSARY
		);

		expect(warnings).toEqual([]);
	});
});
