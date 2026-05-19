import type { GlossaryTerm } from '$lib/glossary';

const GLOSSARY_TERMS: GlossaryTerm[] = [
	{
		id: 'term-1',
		sourceTerm: 'Grace',
		targetTerm: 'Anugrah',
		status: 'Approved',
		rationale: 'Represents unmerited divine favor in church usage'
	},
	{
		id: 'term-2',
		sourceTerm: 'Covenant',
		targetTerm: 'Ahd',
		status: 'Proposed',
		rationale: 'Candidate term under reviewer discussion'
	},
	{
		id: 'term-3',
		sourceTerm: 'Messiah',
		targetTerm: 'Masih',
		status: 'Approved',
		rationale: 'Widely understood theological rendering'
	}
];

export function listGlossaryTerms(): GlossaryTerm[] {
	return GLOSSARY_TERMS.map((term) => ({ ...term }));
}
