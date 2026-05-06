import { describe, expect, it } from 'vitest';
import {
	addGlossaryTerm,
	createGlossaryTermDraft,
	updateGlossaryTerm,
	type GlossaryTerm
} from '$lib/glossary';

const TERMS: GlossaryTerm[] = [
	{
		id: 'term-1',
		sourceTerm: 'Grace',
		targetTerm: 'Anugrah',
		status: 'Approved',
		rationale: 'Unmerited divine favor'
	},
	{
		id: 'term-2',
		sourceTerm: 'Covenant',
		targetTerm: 'Ahd',
		status: 'Proposed',
		rationale: 'Formal agreement'
	}
];

describe('glossary domain', () => {
	it('creates a draft with empty editable fields', () => {
		expect(createGlossaryTermDraft()).toEqual({
			sourceTerm: '',
			targetTerm: '',
			status: 'Proposed',
			rationale: ''
		});
	});

	it('adds a new term to the glossary list', () => {
		const updated = addGlossaryTerm(TERMS, {
			sourceTerm: 'Messiah',
			targetTerm: 'Masih',
			status: 'Approved',
			rationale: 'Common translation in church context'
		});

		expect(updated).toHaveLength(3);
		expect(updated[2].sourceTerm).toBe('Messiah');
		expect(updated[2].targetTerm).toBe('Masih');
		expect(updated[2].status).toBe('Approved');
	});

	it('edits an existing glossary term in place by id', () => {
		const updated = updateGlossaryTerm(TERMS, 'term-2', {
			sourceTerm: 'Covenant',
			targetTerm: 'Berith',
			status: 'Approved',
			rationale: 'Aligned to translation committee recommendation'
		});

		expect(updated).toHaveLength(2);
		expect(updated[1].targetTerm).toBe('Berith');
		expect(updated[1].status).toBe('Approved');
		expect(updated[1].rationale).toMatch(/committee/i);
	});
});
