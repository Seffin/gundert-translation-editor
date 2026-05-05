import type { EditorSegment } from '$lib/server/editor';

export type SegmentSelectionModel = {
	selected: Record<string, boolean>;
	count: number;
};

type GeminiDraftResponse = {
	candidates: Array<{
		content: { parts: Array<{ text: string }> };
		finishReason: string;
	}>;
};

type GeminiErrorResponse = {
	error: { code: number; message: string; status: string };
};

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash';

export function buildSegmentSelectionModel(segments: EditorSegment[]): SegmentSelectionModel {
	const selected: Record<string, boolean> = {};
	for (const segment of segments) {
		selected[segment.id] = false;
	}
	return { selected, count: 0 };
}

export function toggleSegmentSelection(
	model: SegmentSelectionModel,
	segmentId: string
): SegmentSelectionModel {
	const wasSelected = model.selected[segmentId] ?? false;
	const updated = { ...model.selected, [segmentId]: !wasSelected };
	const count = Object.values(updated).filter(Boolean).length;
	return { selected: updated, count };
}

export function applyChunkDraftToSegments(
	segments: EditorSegment[],
	selection: SegmentSelectionModel,
	translations: string[],
	nowIso: string
): EditorSegment[] {
	let translationIndex = 0;

	return segments.map((segment) => {
		if (!selection.selected[segment.id]) {
			return segment;
		}

		const translation = translations[translationIndex++] ?? segment.targetText;
		return {
			...segment,
			targetText: translation,
			draftedByGemini: true,
			status: 'Draft' as const,
			updatedAtLabel: 'Just now',
			aiProvenance: {
				actor: 'Gemini',
				scope: 'selected-chunk',
				generatedAtIso: nowIso,
				generatedAtLabel: 'Just now'
			}
		};
	});
}

function buildChunkPrompt(selectedSegments: EditorSegment[], targetLanguage: string): string {
	const sourceTexts = selectedSegments.map((s) => s.sourceText).join('\n\n');

	return `You are a professional translator specializing in Bible translation to ${targetLanguage}.

Translate the following Bible story text segment by segment from English to ${targetLanguage}.

Maintain:
- Formal, respectful tone appropriate for scripture
- Clear narrative flow
- Cultural and linguistic accuracy
- Consistency with common ${targetLanguage} Bible translation conventions

Source text:
${sourceTexts}

Provide one translation per segment, separated by blank lines. Do not include the source text or any explanation.`;
}

export async function requestGeminiChunkDraft(
	segments: EditorSegment[],
	selection: SegmentSelectionModel,
	targetLanguage: string,
	storyId: string,
	apiKey: string
): Promise<EditorSegment[]> {
	const selectedSegments = segments.filter((s) => selection.selected[s.id]);

	if (selectedSegments.length === 0) {
		return segments;
	}

	const nowIso = new Date().toISOString();
	const prompt = buildChunkPrompt(selectedSegments, targetLanguage);
	const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

	const payload = {
		contents: [{ parts: [{ text: prompt }] }],
		generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
		safetySettings: [
			{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
			{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
			{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
			{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
		]
	};

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		const errorBody = await response.text();
		try {
			const error = JSON.parse(errorBody) as GeminiErrorResponse;
			throw new Error(`Gemini API error: ${error.error.message}`);
		} catch {
			throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
		}
	}

	const data = (await response.json()) as GeminiDraftResponse;

	if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
		throw new Error('No candidates in Gemini response');
	}

	const responseText = data.candidates[0].content.parts[0].text;
	const translations = responseText
		.split(/\n\n/)
		.filter((part) => part.trim().length > 0)
		.map((part) => part.trim());

	return applyChunkDraftToSegments(segments, selection, translations, nowIso);
}
