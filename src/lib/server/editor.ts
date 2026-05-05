import type { ObsSegment, ObsStory } from '$lib/server/obs';

export type EditorSegment = {
	id: string;
	sourceText: string;
	targetText: string;
	targetLanguage: 'Hindi' | 'Malayalam';
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
	segments: EditorSegment[];
};

function deriveLanguage(storyNumber: number, segmentIndex: number): 'Hindi' | 'Malayalam' {
	return (storyNumber + segmentIndex) % 2 === 0 ? 'Hindi' : 'Malayalam';
}

function deriveStatus(segmentIndex: number): 'Draft' | 'Done' {
	return segmentIndex < 2 ? 'Done' : 'Draft';
}

function deriveGeminiLabel(segmentIndex: number): string {
	if (segmentIndex === 0) return '2 mins ago';
	if (segmentIndex === 1) return '5 mins ago';
	return 'Not generated';
}

function mapSegment(storyNumber: number, segment: ObsSegment, index: number): EditorSegment {
	const status = deriveStatus(index);
	const targetLanguage = deriveLanguage(storyNumber, index);
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

export function buildStoryEditorModel(story: ObsStory): StoryEditorModel {
	return {
		storyId: story.storyId,
		storyNumber: story.storyNumber,
		title: story.title,
		description: `Story ${story.storyId} baseline editor view for source and target translation.`,
		segments: story.segments.map((segment, index) => mapSegment(story.storyNumber, segment, index))
	};
}
