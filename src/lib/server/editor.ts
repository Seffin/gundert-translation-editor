import type { ObsSegment, ObsStory } from '$lib/server/obs';

export type EditorSegment = {
	id: string;
	sourceText: string;
	targetText: string;
	targetLanguage: string;
	status: 'Draft' | 'Done';
	draftedByGemini: boolean;
	updatedAtLabel: string;
	aiProvenance?: AIDraftProvenance;
	lastSavedByActorId?: string;
	lastSavedAtIso?: string;
};

export type AIDraftScope = 'whole-story' | 'selected-chunk';

export type AIDraftProvenance = {
	actor: string;
	scope: AIDraftScope;
	generatedAtIso: string;
	generatedAtLabel: string;
};

export type StoryEditorModel = {
	storyId: string;
	storyNumber: number;
	title: string;
	description: string;
	targetLanguage: string;
	segments: EditorSegment[];
};

function deriveStatus(segmentIndex: number): 'Draft' | 'Done' {
	return segmentIndex < 2 ? 'Done' : 'Draft';
}

function deriveGeminiLabel(segmentIndex: number): string {
	if (segmentIndex === 0) return '2 mins ago';
	if (segmentIndex === 1) return '5 mins ago';
	return 'Not generated';
}

function deriveGeminiIso(segmentIndex: number): string {
	if (segmentIndex === 0) return '2026-05-05T09:58:00.000Z';
	if (segmentIndex === 1) return '2026-05-05T09:55:00.000Z';
	return '2026-05-05T09:50:00.000Z';
}

function mapSegment(segment: ObsSegment, index: number, targetLanguage: string): EditorSegment {
	const status = deriveStatus(index);
	const draftedByGemini = status === 'Done';
	const updatedAtLabel = deriveGeminiLabel(index);
	return {
		id: segment.id,
		sourceText: segment.text,
		targetText: '',
		targetLanguage,
		status,
		draftedByGemini,
		updatedAtLabel,
		aiProvenance: draftedByGemini
			? {
				actor: 'Gemini',
				scope: 'whole-story',
				generatedAtIso: deriveGeminiIso(index),
				generatedAtLabel: updatedAtLabel
			}
			: undefined,
		lastSavedByActorId: undefined,
		lastSavedAtIso: undefined
	};
}

export const DEFAULT_STORY_LANGUAGE = 'Hindi';

export function buildStoryEditorModel(
	story: ObsStory,
	targetLanguage: string = DEFAULT_STORY_LANGUAGE
): StoryEditorModel {
	return {
		storyId: story.storyId,
		storyNumber: story.storyNumber,
		title: story.title,
		description: `Story ${story.storyId} baseline editor view for source and target translation.`,
		targetLanguage,
		segments: story.segments.map((segment, index) => mapSegment(segment, index, targetLanguage))
	};
}
