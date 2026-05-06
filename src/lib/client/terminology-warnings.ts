import type { GlossaryTerm } from '$lib/glossary';
import type { EditorSegment } from '$lib/server/editor';

export type TerminologyGlossaryTerm = GlossaryTerm;

export type TerminologyWarning = {
	segmentId: string;
	sourceTerm: string;
	expectedTargetTerm: string;
};

function includesNormalized(haystack: string, needle: string): boolean {
	return haystack.toLocaleLowerCase().includes(needle.toLocaleLowerCase());
}

export function buildTerminologyWarnings(
	segments: EditorSegment[],
	glossaryTerms: TerminologyGlossaryTerm[]
): TerminologyWarning[] {
	const approved = glossaryTerms.filter((term) => term.status === 'Approved');
	const warnings: TerminologyWarning[] = [];

	for (const segment of segments) {
		for (const term of approved) {
			const sourceHasTerm = includesNormalized(segment.sourceText, term.sourceTerm);
			if (!sourceHasTerm) continue;

			const targetHasExpected = includesNormalized(segment.targetText, term.targetTerm);
			if (targetHasExpected) continue;

			warnings.push({
				segmentId: segment.id,
				sourceTerm: term.sourceTerm,
				expectedTargetTerm: term.targetTerm
			});
		}
	}

	return warnings;
}
