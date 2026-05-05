import type { ObsSegment, ObsStory } from '$lib/server/obs';

export type EditorSegment = {
	id: string;
	sourceText: string;
	targetText: string;
	targetLanguage: string;
	status: 'Draft' | 'Done';
	draftedByGemini: boolean;
	updatedAtLabel: string;
	lastSavedByActorId?: string;
	lastSavedAtIso?: string;
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

function mapSegment(segment: ObsSegment, index: number, targetLanguage: string): EditorSegment {
	const status = deriveStatus(index);
	return {
		id: segment.id,
		sourceText: segment.text,
		targetText: '',
		targetLanguage,
		status,
		draftedByGemini: status === 'Done',
		updatedAtLabel: deriveGeminiLabel(index),
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
