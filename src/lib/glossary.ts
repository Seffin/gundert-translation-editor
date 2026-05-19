export type GlossaryStatus = 'Proposed' | 'Approved';

export type GlossaryTerm = {
	id: string;
	sourceTerm: string;
	targetTerm: string;
	status: GlossaryStatus;
	rationale: string;
};

export type GlossaryTermDraft = Omit<GlossaryTerm, 'id'>;

function normalizeDraft(draft: GlossaryTermDraft): GlossaryTermDraft {
	return {
		sourceTerm: draft.sourceTerm.trim(),
		targetTerm: draft.targetTerm.trim(),
		status: draft.status,
		rationale: draft.rationale.trim()
	};
}

function nextGlossaryId(terms: GlossaryTerm[]): string {
	return `term-${terms.length + 1}`;
}

export function createGlossaryTermDraft(): GlossaryTermDraft {
	return {
		sourceTerm: '',
		targetTerm: '',
		status: 'Proposed',
		rationale: ''
	};
}

export function addGlossaryTerm(terms: GlossaryTerm[], draft: GlossaryTermDraft): GlossaryTerm[] {
	const normalized = normalizeDraft(draft);
	if (!normalized.sourceTerm || !normalized.targetTerm) {
		throw new Error('Source term and target term are required.');
	}

	return [
		...terms,
		{
			id: nextGlossaryId(terms),
			...normalized
		}
	];
}

export function updateGlossaryTerm(
	terms: GlossaryTerm[],
	id: string,
	draft: GlossaryTermDraft
): GlossaryTerm[] {
	const normalized = normalizeDraft(draft);
	if (!normalized.sourceTerm || !normalized.targetTerm) {
		throw new Error('Source term and target term are required.');
	}

	return terms.map((term) => {
		if (term.id !== id) return term;
		return {
			...term,
			...normalized
		};
	});
}
