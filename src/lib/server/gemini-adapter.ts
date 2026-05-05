import type { EditorSegment } from './editor';

export type SourceSegmentForGemini = {
	id: string;
	sourceText: string;
};

export type GeminiDraftRequest = {
	storyId: string;
	targetLanguage: string;
	sourceSegments: SourceSegmentForGemini[];
	prompt: string;
};

export type GeminiDraftResponse = {
	candidates: Array<{
		content: {
			parts: Array<{
				text: string;
			}>;
		};
		finishReason: string;
	}>;
	usageMetadata?: {
		promptTokenCount: number;
		candidatesTokenCount: number;
		totalTokenCount: number;
	};
};

export type GeminiErrorResponse = {
	error: {
		code: number;
		message: string;
		status: string;
	};
};

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.0-flash';

export function buildGeminiWholeStoryRequest(
	segments: EditorSegment[],
	targetLanguage: string,
	storyId: string
): GeminiDraftRequest {
	const sourceSegments: SourceSegmentForGemini[] = segments.map((segment) => ({
		id: segment.id,
		sourceText: segment.sourceText
	}));

	const prompt = buildWholeStoryDraftPrompt(segments, targetLanguage);

	return {
		storyId,
		targetLanguage,
		sourceSegments,
		prompt
	};
}

function buildWholeStoryDraftPrompt(segments: EditorSegment[], targetLanguage: string): string {
	const sourceTexts = segments.map((s) => s.sourceText).join('\n\n');

	return `You are a professional translator specializing in Bible translation to ${targetLanguage}.

Translate the following Bible story text segment by segment from English to ${targetLanguage}. 

Maintain:
- Formal, respectful tone appropriate for scripture
- Clear narrative flow
- Cultural and linguistic accuracy
- Consistency with common ${targetLanguage} Bible translation conventions

Source text:
${sourceTexts}

Provide translations that are accurate, natural, and appropriate for a Bible translation project. Format your response with each translation clearly corresponding to each source segment, separated by blank lines and the separator "---".`;
}

export function parseGeminiWholeStoryResponse(
	response: GeminiDraftResponse,
	originalSegments: EditorSegment[],
	nowIso: string
): EditorSegment[] {
	if (!response.candidates || response.candidates.length === 0) {
		throw new Error('No candidates in Gemini response');
	}

	const firstCandidate = response.candidates[0];
	if (!firstCandidate.content?.parts?.[0]?.text) {
		throw new Error('Invalid Gemini response structure');
	}

	const responseText = firstCandidate.content.parts[0].text;
	const translations = parseResponseIntoTranslations(responseText);

	return originalSegments.map((segment, index) => {
		const translation = translations[index] || segment.targetText;

		return {
			...segment,
			targetText: translation,
			draftedByGemini: true,
			status: 'Draft' as const,
			updatedAtLabel: 'Just now'
		};
	});
}

function parseResponseIntoTranslations(responseText: string): string[] {
	// Split by --- or by double newlines to extract individual translations
	const parts = responseText.split(/---|\n\n/).filter((part) => part.trim().length > 0);

	// Filter out parts that are clearly prompts/metadata (very long or contain "source text")
	return parts
		.filter(
			(part) =>
				!part.toLowerCase().includes('source text') &&
				part.split('\n').length <= 5 &&
				part.length < 500
		)
		.map((part) => part.trim());
}

export async function requestGeminiWholeStoryDraft(
	segments: EditorSegment[],
	targetLanguage: string,
	storyId: string,
	apiKey: string
): Promise<EditorSegment[]> {
	const request = buildGeminiWholeStoryRequest(segments, targetLanguage, storyId);
	const nowIso = new Date().toISOString();

	const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

	const payload = {
		contents: [
			{
				parts: [
					{
						text: request.prompt
					}
				]
			}
		],
		generationConfig: {
			temperature: 0.7,
			topK: 40,
			topP: 0.95,
			maxOutputTokens: 2048
		},
		safetySettings: [
			{
				category: 'HARM_CATEGORY_HARASSMENT',
				threshold: 'BLOCK_NONE'
			},
			{
				category: 'HARM_CATEGORY_HATE_SPEECH',
				threshold: 'BLOCK_NONE'
			},
			{
				category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
				threshold: 'BLOCK_NONE'
			},
			{
				category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
				threshold: 'BLOCK_NONE'
			}
		]
	};

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
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
	return parseGeminiWholeStoryResponse(data, segments, nowIso);
}
