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

type ParsedJsonDraft = {
	translations: Array<{ id: string; text: string }>;
};

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.5-flash';

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

function buildChunkPrompt(
	allSegments: EditorSegment[],
	selectedSegments: EditorSegment[],
	targetLanguage: string
): string {
	const allStoryContext = allSegments
		.map((segment) => `${segment.id}: ${segment.sourceText}`)
		.join('\n');
	const selectedIds = selectedSegments.map((segment) => segment.id).join(', ');

	return `You are a professional translator specializing in Bible translation to ${targetLanguage}.

Translate only the selected segments from English to ${targetLanguage}, using the whole story context below.

Maintain:
- Formal, respectful tone appropriate for scripture
- Clear narrative flow
- Cultural and linguistic accuracy
- Consistency with common ${targetLanguage} Bible translation conventions

Whole story context (all segments):
${allStoryContext}

Selected segment IDs:
${selectedIds}

Return ONLY valid JSON using this exact schema:
{"translations":[{"id":"SEGMENT_ID","text":"FULL_TRANSLATION"}]}

Rules:
- Include exactly one object for each selected segment ID.
- Each translation must be a single block in the "text" field, even if it has multiple paragraphs.
- Crucial: If the translated text contains any double quotes ("), they MUST be properly escaped as \\" (with a backslash) to ensure the JSON is valid and parsable.
- Do not include markdown fences or commentary.`;
}

function regexParseJsonDraft(text: string): ParsedJsonDraft | undefined {
	const translations: Array<{ id: string; text: string }> = [];
	const regex = /"id"\s*:\s*"([^"]+)"\s*,\s*"text"\s*:\s*"/g;
	let match;
	const matches: Array<{ id: string; index: number; textStart: number }> = [];

	while ((match = regex.exec(text)) !== null) {
		matches.push({
			id: match[1],
			index: match.index,
			textStart: match.index + match[0].length
		});
	}

	for (let i = 0; i < matches.length; i++) {
		const current = matches[i];
		const endBoundary = i + 1 < matches.length ? matches[i + 1].index : text.length;
		let segmentTextChunk = text.slice(current.textStart, endBoundary);

		const trailingMatch = segmentTextChunk.match(/\s*"\s*\}\s*[\],\}\s]*$/);
		if (trailingMatch) {
			const trimLen = trailingMatch[0].length;
			segmentTextChunk = segmentTextChunk.slice(0, segmentTextChunk.length - trimLen);
		} else {
			segmentTextChunk = segmentTextChunk
				.replace(/\s*"\s*\}\s*,?\s*$/, '')
				.replace(/\s*"?\s*\]?\s*\}?\s*$/, '');
		}

		const unescapedText = segmentTextChunk.replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();

		if (unescapedText) {
			translations.push({
				id: current.id,
				text: unescapedText
			});
		}
	}

	if (translations.length > 0) {
		return { translations };
	}
	return undefined;
}

function parseJsonDraftResponse(responseText: string): ParsedJsonDraft | undefined {
	const normalized = responseText.trim();
	if (normalized.length === 0) return undefined;

	const jsonText = extractJsonFromResponse(normalized);
	if (!jsonText) return undefined;

	try {
		const parsed = JSON.parse(jsonText) as unknown;
		if (!parsed || typeof parsed !== 'object' || !('translations' in parsed)) {
			return regexParseJsonDraft(jsonText);
		}

		const translations = (parsed as { translations?: unknown }).translations;
		if (!Array.isArray(translations)) {
			return regexParseJsonDraft(jsonText);
		}

		const normalizedTranslations = translations
			.filter(
				(item): item is { id: string; text: string } =>
					typeof item === 'object' &&
					item !== null &&
					typeof (item as { id?: unknown }).id === 'string' &&
					typeof (item as { text?: unknown }).text === 'string'
			)
			.map((item) => ({ id: item.id, text: item.text.trim() }))
			.filter((item) => item.id.trim().length > 0 && item.text.length > 0);

		if (normalizedTranslations.length === 0) {
			return regexParseJsonDraft(jsonText);
		}

		return { translations: normalizedTranslations };
	} catch {
		return regexParseJsonDraft(jsonText);
	}
}

function extractJsonFromResponse(text: string): string | undefined {
	// Strategy 1: Extract from markdown code fences (anywhere in the text)
	const fencedMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/i);
	if (fencedMatch?.[1]) {
		const candidate = fencedMatch[1].trim();
		if (candidate.startsWith('{')) return candidate;
	}

	// Strategy 2: Find raw JSON object starting with {"translations"
	const jsonStart = text.indexOf('{"translations"');
	if (jsonStart !== -1) {
		const candidate = text.slice(jsonStart);
		// Find matching closing brace by counting braces
		let depth = 0;
		for (let i = 0; i < candidate.length; i++) {
			if (candidate[i] === '{') depth++;
			else if (candidate[i] === '}') {
				depth--;
				if (depth === 0) {
					return candidate.slice(0, i + 1);
				}
			}
		}
	}

	// Strategy 3: Try parsing the entire text as JSON directly
	if (text.startsWith('{')) return text;

	return undefined;
}

function applyChunkDraftBySegmentId(
	segments: EditorSegment[],
	selection: SegmentSelectionModel,
	translationsById: Map<string, string>,
	nowIso: string
): EditorSegment[] {
	return segments.map((segment) => {
		if (!selection.selected[segment.id]) {
			return segment;
		}

		const translation = translationsById.get(segment.id) ?? segment.targetText;
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

function parseChunkTranslations(responseText: string, selectedCount: number): string[] {
	const normalized = responseText.trim();

	if (selectedCount <= 1) {
		return normalized.length > 0 ? [normalized] : [];
	}

	if (
		normalized.includes('\n---\n') ||
		normalized.startsWith('---\n') ||
		normalized.endsWith('\n---')
	) {
		return normalized
			.split(/\n---\n|^---\n|\n---$/m)
			.filter((part) => part.trim().length > 0)
			.map((part) => part.trim());
	}

	return normalized
		.split(/\n\n/)
		.filter((part) => part.trim().length > 0)
		.map((part) => part.trim());
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
	const prompt = buildChunkPrompt(segments, selectedSegments, targetLanguage);
	const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

	const payload = {
		contents: [{ parts: [{ text: prompt }] }],
		generationConfig: {
			temperature: 0.7,
			topK: 40,
			topP: 0.95,
			maxOutputTokens: 65536,
			responseMimeType: 'application/json'
		},
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
	const parsedJsonDraft = parseJsonDraftResponse(responseText);

	if (parsedJsonDraft) {
		const selectedIds = new Set(selectedSegments.map((segment) => segment.id));
		const translationsById = new Map<string, string>();

		for (const translation of parsedJsonDraft.translations) {
			if (selectedIds.has(translation.id)) {
				translationsById.set(translation.id, translation.text);
			}
		}

		if (translationsById.size > 0) {
			return applyChunkDraftBySegmentId(segments, selection, translationsById, nowIso);
		}
	}

	const translations = parseChunkTranslations(responseText, selectedSegments.length);

	return applyChunkDraftToSegments(segments, selection, translations, nowIso);
}
