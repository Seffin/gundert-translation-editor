import type { GlossaryTerm } from '$lib/glossary';

const GLOSSARY_TERMS: GlossaryTerm[] = [
	{
		id: 'term-1',
		sourceTerm: 'Grace',
		targetTerm: 'Anugrah',
		status: 'Approved',
		rationale: 'Represents unmerited divine favor in church usage',
		language: 'Hindi'
	},
	{
		id: 'term-2',
		sourceTerm: 'Covenant',
		targetTerm: 'Ahd',
		status: 'Proposed',
		rationale: 'Candidate term under reviewer discussion',
		language: 'Hindi'
	},
	{
		id: 'term-3',
		sourceTerm: 'Messiah',
		targetTerm: 'Masih',
		status: 'Approved',
		rationale: 'Widely understood theological rendering',
		language: 'Hindi'
	},
	{
		id: 'term-4',
		sourceTerm: 'God',
		targetTerm: 'ദൈവം',
		status: 'Approved',
		rationale: 'Theological anchor for Malayalam OBS stories',
		language: 'Malayalam'
	},
	{
		id: 'term-5',
		sourceTerm: 'Jesus',
		targetTerm: 'യേശു',
		status: 'Approved',
		rationale: 'Central character across Malayalam OBS smoke stories',
		language: 'Malayalam'
	},
	{
		id: 'term-6',
		sourceTerm: 'forgive',
		targetTerm: 'ക്ഷമിക്കുക',
		status: 'Approved',
		rationale: 'Core theological theme in Malayalam',
		language: 'Malayalam'
	},
	{
		id: 'term-7',
		sourceTerm: 'disciples',
		targetTerm: 'ശിഷ്യന്മാര്‍',
		status: 'Approved',
		rationale: 'Core group of followers in Malayalam OBS context',
		language: 'Malayalam'
	}
];

export function listGlossaryTerms(): GlossaryTerm[] {
	return GLOSSARY_TERMS.map((term) => ({ ...term }));
}
