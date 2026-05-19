import type { GlossaryTerm } from '$lib/glossary';
import type { EditorSegment } from '$lib/server/editor';

export interface ConsistencyIssue {
	sourceTerm: string;
	segmentVariations: Array<{
		segmentId: string;
		segmentIndex: number;
		targetTerm: string | null;
	}>;
	expectedTargetTerm: string;
	validated?: boolean; // True if LLM confirmed the inconsistency is real (not a synonym)
}

export interface LLMValidationResult {
	isInconsistency: boolean;
	explanation: string;
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Detects cross-segment consistency issues where the same glossary term
 * is translated differently across multiple segments.
 *
 * For each approved glossary term that appears in multiple segments,
 * verifies all translations match the approved target term. Returns
 * issues when variations are found.
 */
export function buildConsistencyIssues(
	segments: EditorSegment[],
	glossaryTerms: GlossaryTerm[]
): ConsistencyIssue[] {
	// Filter to approved terms only
	const approvedTerms = glossaryTerms.filter((t) => t.status === 'Approved');

	const issues: ConsistencyIssue[] = [];

	for (const glossaryTerm of approvedTerms) {
		// Find all segments containing this source term (case-insensitive)
		const matchingSegments = segments
			.map((seg, index) => ({
				segment: seg,
				index,
				contains: seg.sourceText.toLowerCase().includes(glossaryTerm.sourceTerm.toLowerCase())
			}))
			.filter((m) => m.contains);

		// Skip if term appears in fewer than 2 segments
		if (matchingSegments.length < 2) continue;

		// Collect target translations used for this term
		const targetTranslations = matchingSegments.map((m) => {
			const hasExpectedTarget = m.segment.targetText
				.toLowerCase()
				.includes(glossaryTerm.targetTerm.toLowerCase());
			return {
				segmentId: m.segment.id,
				segmentIndex: m.index,
				targetTerm: hasExpectedTarget
					? glossaryTerm.targetTerm
					: extractAlternativeTranslation(
							m.segment.targetText,
							glossaryTerm.sourceTerm,
							glossaryTerm.targetTerm
						)
			};
		});

		// Check if all use the approved target term
		const allMatch = targetTranslations.every((t) => t.targetTerm === glossaryTerm.targetTerm);

		if (!allMatch) {
			issues.push({
				sourceTerm: glossaryTerm.sourceTerm,
				segmentVariations: targetTranslations,
				expectedTargetTerm: glossaryTerm.targetTerm
			});
		}
	}

	return issues;
}

/**
 * Attempts to extract an alternative translation if the expected one isn't found.
 * This helps surface what the translator actually used.
 */
function extractAlternativeTranslation(
	targetText: string,
	sourceTerm: string,
	expectedTerm: string
): string | null {
	void targetText;
	void sourceTerm;
	void expectedTerm;

	// Very simple heuristic: look for words in targetText that might be the translation
	// In a real system, this could use fuzzy matching or word tokenization
	// For now, return null to indicate "not the expected term"
	return null;
}

/**
 * Validates a consistency issue using Gemini LLM.
 * Checks if the different translations are actually inconsistent or legitimate synonyms.
 *
 * @param sourceTerm The original term (e.g., "God")
 * @param variations The different translations used (e.g., ["Ishwar", "Devta", "Bhagwan"])
 * @param targetLanguage The target language (e.g., "Hindi")
 * @param apiKey Gemini API key (from VITE_GEMINI_API_KEY)
 * @returns true if this is a real inconsistency, false if synonyms are acceptable
 */
export async function validateConsistencyWithLLM(
	sourceTerm: string,
	variations: string[],
	targetLanguage: string,
	expectedTerm: string,
	apiKey: string
): Promise<LLMValidationResult> {
	if (!apiKey) {
		return {
			isInconsistency: true,
			explanation: 'LLM validation not available (no API key)'
		};
	}

	const uniqueVariations = Array.from(new Set(variations.filter((v) => v !== null)));

	if (uniqueVariations.length <= 1) {
		return {
			isInconsistency: false,
			explanation: 'All translations are consistent'
		};
	}

	const prompt = `You are reviewing Bible translation consistency. A translator used different terms for the same source word.

Source term: "${sourceTerm}"
Target language: ${targetLanguage}
Approved translation: "${expectedTerm}"
Translations used in different segments: ${uniqueVariations.map((v) => `"${v}"`).join(', ')}

Question: Is this a real inconsistency that should be corrected, or are these acceptable synonyms in ${targetLanguage} Bible translation?

Consider:
1. Are these terms synonymous in ${targetLanguage}?
2. Would a ${targetLanguage} Bible reader understand them as referring to the same concept?
3. Is there a theological reason to prefer one over another?

Respond with ONLY:
- "INCONSISTENCY" if the terms should be unified
- "ACCEPTABLE" if synonyms are fine
- One sentence explanation

Example:
INCONSISTENCY: In Bible translation, "God" must always be the same word for clarity.`;

	try {
		const response = await fetch(
			`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [
						{
							parts: [{ text: prompt }]
						}
					],
					generationConfig: {
						maxOutputTokens: 100,
						temperature: 0.3
					}
				})
			}
		);

		if (!response.ok) {
			return {
				isInconsistency: true,
				explanation: 'LLM validation failed (fallback to flagging)'
			};
		}

		const data = (await response.json()) as {
			candidates: Array<{
				content: { parts: Array<{ text: string }> };
			}>;
		};

		const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'INCONSISTENCY';
		const isInconsistency = responseText.includes('INCONSISTENCY');

		return {
			isInconsistency,
			explanation: responseText
		};
	} catch (err) {
		return {
			isInconsistency: true,
			explanation: `LLM validation error: ${err instanceof Error ? err.message : 'Unknown error'}`
		};
	}
}

/**
 * Validates all consistency issues using LLM (optional enhancement).
 * Only validates if apiKey is provided.
 */
export async function validateConsistencyIssuesWithLLM(
	issues: ConsistencyIssue[],
	targetLanguage: string,
	apiKey: string | null
): Promise<Array<ConsistencyIssue & { validated?: boolean }>> {
	if (!apiKey || issues.length === 0) {
		return issues;
	}

	const updatedIssues: Array<ConsistencyIssue & { validated?: boolean }> = [];

	for (const issue of issues) {
		const variations = issue.segmentVariations
			.map((v) => v.targetTerm)
			.filter((t) => t !== null) as string[];

		const validation = await validateConsistencyWithLLM(
			issue.sourceTerm,
			variations,
			targetLanguage,
			issue.expectedTargetTerm,
			apiKey
		);

		updatedIssues.push({
			...issue,
			validated: validation.isInconsistency
		});
	}

	return updatedIssues;
}
